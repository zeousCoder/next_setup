import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import type { QueryValues } from "mysql2";

export type DatabaseKey = "db1" | "db2";
export type DatabaseSelection = DatabaseKey | DatabaseKey[];

type queryDebug = {
  debug?: boolean;
};

// Database URLs from environment variables
const dbUrls: Record<DatabaseKey, string | undefined> = {
  db1: process.env.MYSQL_URL,
  db2: process.env.MYSQL_URL_1,
};

// Store connection pools
const pools: Partial<Record<DatabaseKey, Pool>> = {};

// Fetch the database URL for a given key.

function getDbUrl(db: DatabaseKey): string {
  const dbUrl = dbUrls[db];
  if (!dbUrl) {
    throw new Error(`${db} URL is not set`);
  }
  return dbUrl;
}

// Get or create a MySQL pool for the specified database.

export function getMySqlPool(db: DatabaseKey = "db1"): Pool {
  if (!pools[db]) {
    pools[db] = mysql.createPool({
      uri: getDbUrl(db), // Use the correct database URL
      waitForConnections: true, // Wait for a connection to be available
      connectionLimit: 10, // Limit the number of connections
      queueLimit: 0, // Limit the number of requests in the queue
      enableKeepAlive: true, // Enable keep-alive connections
      keepAliveInitialDelay: 0, // Delay the keep-alive connection
    });
  }
  return pools[db] as Pool; // Return the pool for the specified database
}

// Get a connection from the selected database.
export async function mySqlConnect(db: DatabaseKey = "db1") {
  return getMySqlPool(db).getConnection();
}

function buildQuery(query: string, values: QueryValues): string {
  const vals = [...(Array.isArray(values) ? values : [values])];
  return query.replace(/\?/g, () => {
    const val = vals.shift();
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "string") return `'${val}'`;
    return String(val);
  });
}

// Execute a SQL query on one or multiple databases.
export async function sqlQuery<T = RowDataPacket[]>(
  query: string,
  values: QueryValues = [],
  db: DatabaseSelection = "db1",
  options: queryDebug = {},
): Promise<T | Record<DatabaseKey, T>> {
  const dbLabel = Array.isArray(db) ? db.join(", ") : db;

  if (options.debug) {
    console.group(`🔍 sqlQuery [${dbLabel}]`);
    console.log(buildQuery(query, values));
    console.groupEnd();
  }

  try {
    // If multiple databases are provided, return an object keyed by database
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

    // Single database query, return rows
    const [rows] = await getMySqlPool(db).query(query, values);
    return rows as T;
  } catch (error: any) {
    console.group(`❌ sqlQuery Error [${dbLabel}]`);
    console.error(buildQuery(query, values));
    console.error("Message:", error.message);
    console.groupEnd();
    throw error;
  }
}
