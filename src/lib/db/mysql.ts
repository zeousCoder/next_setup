import mysql, { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { QueryValues } from "mysql2";

export type DatabaseKey = "db1" | "db2";
export type DatabaseSelection = DatabaseKey | DatabaseKey[];

type QueryDebug = {
  debug?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Database URLs loaded from environment variables.
 * These are validated lazily when a pool is first created.
 */
const dbUrls: Record<DatabaseKey, string | undefined> = {
  db1: process.env.MYSQL_URL,
  db2: process.env.MYSQL_URL_1,
};

// Cached connection pools — one per database key
const pools: Partial<Record<DatabaseKey, Pool>> = {};

/**
 * Returns the database URL for a given key.
 * Throws early with a clear message if the env var is missing.
 */
function getDbUrl(db: DatabaseKey): string {
  const url = dbUrls[db];
  if (!url) throw new Error(`Environment variable for "${db}" is not set`);
  return url;
}

/**
 * Returns a cached MySQL connection pool for the given database.
 * Creates a new pool on first access (lazy initialization).
 */
export function getMySqlPool(db: DatabaseKey = "db1"): Pool {
  if (!pools[db]) {
    pools[db] = mysql.createPool({
      uri: getDbUrl(db),
      waitForConnections: true, // Queue requests instead of failing immediately
      connectionLimit: 10, // Max simultaneous connections
      queueLimit: 0, // Unlimited queue (0 = no limit)
      enableKeepAlive: true, // Prevent idle connection drops
      keepAliveInitialDelay: 0,
    });
  }
  return pools[db] as Pool;
}

/**
 * Grabs a single connection from the pool.
 * Use this when you need manual control (e.g. transactions).
 * Always call connection.release() when done.
 */
export async function mySqlConnect(db: DatabaseKey = "db1") {
  return getMySqlPool(db).getConnection();
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTION HELPER  (NEW)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs a set of queries inside a transaction.
 * Automatically commits on success and rolls back on any error.
 *
 * @example
 * await withTransaction(async (conn) => {
 *   await conn.query("INSERT INTO orders ...");
 *   await conn.query("UPDATE inventory ...");
 * });
 */
export async function withTransaction<T>(
  fn: (connection: Awaited<ReturnType<typeof mySqlConnect>>) => Promise<T>,
  db: DatabaseKey = "db1",
): Promise<T> {
  const connection = await mySqlConnect(db);
  await connection.beginTransaction();
  try {
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG QUERY BUILDER  (for logging only — NOT for execution)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interpolates `?` placeholders with actual values for debug logging.
 *
 * ⚠️  WARNING: This output is for human-readable logging ONLY.
 *              NEVER send this string to the database — use parameterized
 *              queries with `?` placeholders for all real execution.
 */
function buildDebugQuery(query: string, values: QueryValues): string {
  const vals = [...(Array.isArray(values) ? values : [values])];
  return query.replace(/\?/g, () => {
    const val = vals.shift();
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "string") return `'${val.replace(/'/g, "\\'")}'`; // escape single quotes
    return String(val);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY BUILDER
// ─────────────────────────────────────────────────────────────────────────────

type WhereClause = { sql: string; values: unknown[] };
type OrderDirection = "ASC" | "DESC";
type JoinType = "INNER" | "LEFT" | "RIGHT";
type JoinClause = {
  type: JoinType;
  table: string;
  on: string;
  values: unknown[];
};

/**
 * Wraps a SQL identifier in backticks, but leaves it alone when the caller
 * passes a dotted name (`u.id`), an alias (`users u`), a function call
 * (`COUNT(*)`), or anything that already contains backticks. This is what
 * makes JOIN-friendly names like `u.email` work without becoming `` `u.email` ``.
 */
function quoteIdent(name: string): string {
  if (/[`\s().*]/.test(name) || name.includes(".")) return name;
  return `\`${name}\``;
}

export class QueryBuilder<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  private _table: string;
  private _columns: string[] = ["*"];
  private _wheres: WhereClause[] = [];
  private _joins: JoinClause[] = [];
  private _limitVal?: number;
  private _offsetVal?: number;
  private _orderByClauses: string[] = [];
  private _groupByColumns: string[] = [];
  private _db: DatabaseKey = "db1";

  constructor(table: string) {
    this._table = table;
  }

  // ── SELECT ──────────────────────────────────────────────────────────────────

  /** Specify which columns to return. Defaults to SELECT * if omitted. */
  select(...columns: string[]): this {
    this._columns = columns.length ? columns : ["*"];
    return this;
  }

  // ── WHERE ───────────────────────────────────────────────────────────────────

  /** Raw WHERE clause with `?` placeholders for safe parameterization. */
  where(condition: string, ...values: unknown[]): this {
    this._wheres.push({ sql: condition, values });
    return this;
  }

  /** WHERE column = value */
  whereEq(column: string, value: unknown): this {
    return this.where(`${quoteIdent(column)} = ?`, value);
  }

  /** WHERE column IN (value1, value2, ...) */
  whereIn(column: string, values: unknown[]): this {
    if (!values.length)
      throw new Error("whereIn() requires at least one value");
    const placeholders = values.map(() => "?").join(", ");
    return this.where(
      `${quoteIdent(column)} IN (${placeholders})`,
      ...values,
    );
  }

  /** WHERE column LIKE '%value%' */
  whereLike(column: string, value: string): this {
    return this.where(`${quoteIdent(column)} LIKE ?`, value);
  }

  // ── JOINS ───────────────────────────────────────────────────────────────────

  /**
   * INNER JOIN. The `on` clause is a raw SQL fragment with optional `?`
   * placeholders that are safely parameterized.
   *
   * @example
   * db("users u")
   *   .select("u.id", "o.total")
   *   .join("orders o", "o.user_id = u.id")
   *   .get();
   */
  join(table: string, on: string, ...values: unknown[]): this {
    this._joins.push({ type: "INNER", table, on, values });
    return this;
  }

  /** LEFT JOIN — keeps rows from the main table even if no match is found. */
  leftJoin(table: string, on: string, ...values: unknown[]): this {
    this._joins.push({ type: "LEFT", table, on, values });
    return this;
  }

  /** RIGHT JOIN — keeps rows from the joined table even if no match is found. */
  rightJoin(table: string, on: string, ...values: unknown[]): this {
    this._joins.push({ type: "RIGHT", table, on, values });
    return this;
  }

  // ── MODIFIERS ────────────────────────────────────────────────────────────────

  limit(n: number): this {
    this._limitVal = n;
    return this;
  }

  offset(n: number): this {
    this._offsetVal = n;
    return this;
  }

  orderBy(column: string, direction: OrderDirection = "ASC"): this {
    this._orderByClauses.push(`${quoteIdent(column)} ${direction}`);
    return this;
  }

  groupBy(...columns: string[]): this {
    this._groupByColumns.push(...columns.map((c) => quoteIdent(c)));
    return this;
  }

  /** Switch to a different database for this query only. */
  useDb(db: DatabaseKey): this {
    this._db = db;
    return this;
  }

  // ── INTERNAL BUILD ───────────────────────────────────────────────────────────

  /**
   * Assembles the final SQL string and binds values array.
   * Always uses `?` placeholders — never string interpolation.
   */
  private build(): { sql: string; values: unknown[] } {
    const cols = this._columns.join(", ");
    let sql = `SELECT ${cols} FROM ${quoteIdent(this._table)}`;
    const values: unknown[] = [];

    // JOINs live between FROM and WHERE — values must be bound in that order
    for (const j of this._joins) {
      sql += ` ${j.type} JOIN ${quoteIdent(j.table)} ON ${j.on}`;
      values.push(...j.values);
    }

    if (this._wheres.length) {
      sql += " WHERE " + this._wheres.map((w) => w.sql).join(" AND ");
      this._wheres.forEach((w) => values.push(...w.values));
    }
    if (this._groupByColumns.length) {
      sql += " GROUP BY " + this._groupByColumns.join(", ");
    }
    if (this._orderByClauses.length) {
      sql += " ORDER BY " + this._orderByClauses.join(", ");
    }
    if (this._limitVal !== undefined) {
      sql += ` LIMIT ${this._limitVal}`;
    }
    if (this._offsetVal !== undefined) {
      sql += ` OFFSET ${this._offsetVal}`;
    }

    return { sql, values };
  }

  // ── READ OPERATIONS ──────────────────────────────────────────────────────────

  /** Fetch all matching rows. */
  async get(): Promise<T[]> {
    const { sql, values } = this.build();
    return (await sqlQuery<T[]>(sql, values as QueryValues, this._db)) as T[];
  }

  /** Fetch the first matching row, or null if none found. */
  async first(): Promise<T | null> {
    this._limitVal = 1;
    const rows = await this.get();
    return rows[0] ?? null;
  }

  /**
   * Count matching rows.
   * FIX: No longer mutates _columns — uses a fresh SQL string instead.
   */
  async count(): Promise<number> {
    // Build the WHERE/GROUP BY/etc. from current state
    const { sql, values } = this.build();

    // Replace the SELECT columns portion with COUNT(*) — safely, without mutation
    const countSql = sql.replace(
      /^SELECT .+ FROM/,
      "SELECT COUNT(*) AS `_count` FROM",
    );

    const rows = (await sqlQuery<{ _count: number }[]>(
      countSql,
      values as QueryValues,
      this._db,
    )) as { _count: number }[];

    return rows[0]?._count ?? 0;
  }

  // ── WRITE OPERATIONS ─────────────────────────────────────────────────────────

  /**
   * INSERT a single row into the table.
   * Returns the auto-increment ID of the new row.
   */
  async insert(data: Partial<T>): Promise<number> {
    if (!Object.keys(data).length) {
      throw new Error("insert() requires at least one field");
    }

    const keys = Object.keys(data);
    const vals = Object.values(data);
    const cols = keys.map((k) => quoteIdent(k)).join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${quoteIdent(this._table)} (${cols}) VALUES (${placeholders})`;

    const result = (await sqlQuery<ResultSetHeader>(
      sql,
      vals as QueryValues,
      this._db,
    )) as ResultSetHeader;

    return result.insertId;
  }

  /**
   * UPDATE rows that match the WHERE clause.
   * Returns the number of affected rows.
   *
   * FIX: Throws if no WHERE clause is set — prevents accidental full-table updates.
   */
  async update(data: Partial<T>): Promise<number> {
    // Safety guard — never allow UPDATE without a WHERE condition
    if (!this._wheres.length) {
      throw new Error(
        "update() requires at least one where() clause to prevent accidental full-table updates",
      );
    }

    if (!Object.keys(data).length) {
      throw new Error("update() requires at least one field to update");
    }

    const keys = Object.keys(data);
    const vals = Object.values(data);
    const set = keys.map((k) => `${quoteIdent(k)} = ?`).join(", ");
    const whereValues: unknown[] = [];

    const whereSql = " WHERE " + this._wheres.map((w) => w.sql).join(" AND ");
    this._wheres.forEach((w) => whereValues.push(...w.values));

    const sql = `UPDATE ${quoteIdent(this._table)} SET ${set}${whereSql}`;

    const result = (await sqlQuery<ResultSetHeader>(
      sql,
      [...vals, ...whereValues] as QueryValues,
      this._db,
    )) as ResultSetHeader;

    return result.affectedRows;
  }

  /**
   * DELETE rows matching the WHERE clause.
   * Returns the number of deleted rows.
   *
   * FIX: Throws if no WHERE clause is set — prevents wiping the entire table.
   */
  async delete(): Promise<number> {
    // Safety guard — never allow DELETE without a WHERE condition
    if (!this._wheres.length) {
      throw new Error(
        "delete() requires at least one where() clause to prevent accidental full-table deletion",
      );
    }

    const whereValues: unknown[] = [];
    const whereSql = " WHERE " + this._wheres.map((w) => w.sql).join(" AND ");
    this._wheres.forEach((w) => whereValues.push(...w.values));

    const sql = `DELETE FROM ${quoteIdent(this._table)}${whereSql}`;

    const result = (await sqlQuery<ResultSetHeader>(
      sql,
      whereValues as QueryValues,
      this._db,
    )) as ResultSetHeader;

    return result.affectedRows;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main query builder entry point.
 *
 * @example
 * // SELECT
 * const user = await db("users").whereEq("email", email).first();
 *
 * // INSERT
 * const id = await db("users").insert({ name, email, password });
 *
 * // UPDATE
 * await db("users").whereEq("id", userId).update({ name: "John" });
 *
 * // DELETE
 * await db("users").whereEq("id", userId).delete();
 *
 * // COUNT
 * const total = await db("users").whereEq("role", "ADMIN").count();
 */
export function db<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
): QueryBuilder<T> {
  return new QueryBuilder<T>(table);
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW QUERY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute a raw SQL query on one or multiple databases.
 * Supports debug logging and parallel multi-DB execution.
 *
 * @example
 * // Single DB
 * const rows = await sqlQuery("SELECT * FROM users WHERE id = ?", [1]);
 *
 * // Multiple DBs in parallel
 * const results = await sqlQuery("SELECT COUNT(*) FROM orders", [], ["db1", "db2"]);
 *
 * // With debug logging
 * const rows = await sqlQuery("SELECT * FROM users", [], "db1", { debug: true });
 */
export async function sqlQuery<T = RowDataPacket[]>(
  query: string,
  values: QueryValues = [],
  db: DatabaseSelection = "db1",
  options: QueryDebug = {},
): Promise<T | Record<DatabaseKey, T>> {
  const dbLabel = Array.isArray(db) ? db.join(", ") : db;

  if (options.debug) {
    console.group(`🔍 sqlQuery [${dbLabel}]`);
    // ⚠️ buildDebugQuery is for logging only — not used for execution
    console.log(buildDebugQuery(query, values));
    console.groupEnd();
  }

  try {
    // Multi-database: run the same query on all DBs in parallel
    if (Array.isArray(db)) {
      const results = await Promise.all(
        db.map(async (database) => {
          const [rows] = await getMySqlPool(database).query(query, values);
          return { database, rows: rows as T };
        }),
      );

      return results.reduce(
        (acc, { database, rows }) => {
          acc[database] = rows;
          return acc;
        },
        {} as Record<DatabaseKey, T>,
      );
    }

    // Single database query
    const [rows] = await getMySqlPool(db).query(query, values);
    return rows as T;
  } catch (error: any) {
    console.group(`❌ sqlQuery Error [${dbLabel}]`);
    console.error("Query:", buildDebugQuery(query, values));
    console.error("Message:", error.message);
    console.groupEnd();
    throw error;
  }
}
