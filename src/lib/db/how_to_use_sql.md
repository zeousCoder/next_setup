# How to use `@/lib/db/mysql`

A small, type-safe MySQL toolkit built on `mysql2/promise`. It gives you three things:

1. **`db(table)`** — a chainable query builder (preferred for common CRUD).
2. **`sqlQuery(...)`** — a raw query escape hatch for anything the builder can't express.
3. **`withTransaction(...)`** — atomic multi-query transactions with auto commit/rollback.

All three use parameterized queries (`?` placeholders) under the hood — never string interpolation — so they are safe from SQL injection by default.

---

## Setup

Add your connection strings to `.env`:

```env
MYSQL_URL="mysql://user:pass@host:3306/my_db"
MYSQL_URL_1="mysql://user:pass@host:3306/second_db"   # optional — for multi-DB
```

The pools are created lazily on first use. You don't need to call any "init" function.

---

## The query builder: `db(table)`

Every call returns a `QueryBuilder` that you chain methods on, then await a terminal method (`.get()`, `.first()`, `.count()`, `.insert()`, `.update()`, `.delete()`).

```ts
import { db } from "@/lib/db/mysql";
```

### SELECT

```ts
// SELECT * FROM users
const allUsers = await db("users").get();

// SELECT id, name FROM users WHERE role = 'ADMIN' ORDER BY name ASC LIMIT 10
const admins = await db("users")
  .select("id", "name")
  .whereEq("role", "ADMIN")
  .orderBy("name")
  .limit(10)
  .get();

// First match — returns the row or null
const user = await db("users").whereEq("email", "a@b.com").first();
```

### Typed rows

Pass a row type for auto-complete and type-safe results:

```ts
type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

const admins = await db<User>("users").whereEq("role", "ADMIN").get();
//     ^? User[]
```

### WHERE helpers

| Method | SQL |
|---|---|
| `.where("age > ?", 18)` | Raw fragment with `?` placeholders |
| `.whereEq("email", value)` | `` `email` = ? `` |
| `.whereIn("id", [1, 2, 3])` | `` `id` IN (?, ?, ?) `` |
| `.whereLike("name", "%john%")` | `` `name` LIKE ? `` |

Multiple `where*` calls are combined with `AND`:

```ts
await db("users")
  .whereEq("role", "ADMIN")
  .where("created_at > ?", "2025-01-01")
  .whereLike("email", "%@company.com")
  .get();
```

### Sorting, paging, grouping

```ts
// ORDER BY created_at DESC, name ASC
await db("users").orderBy("created_at", "DESC").orderBy("name").get();

// Page 2, 20 per page
await db("users").limit(20).offset(20).get();

// GROUP BY
await db("orders")
  .select("status", "COUNT(*) AS total")
  .groupBy("status")
  .get();
```

### JOINs

Three flavors — `join` (INNER), `leftJoin`, `rightJoin`. All three take a table name, an `ON` clause, and optional `?`-placeholder values that are safely bound.

```ts
// INNER JOIN: users that have at least one paid order
await db("users u")
  .select("u.id", "u.name", "o.total")
  .join("orders o", "o.user_id = u.id AND o.status = ?", "paid")
  .get();

// LEFT JOIN: every user + their order count (including users with 0 orders)
await db("users u")
  .select("u.id", "u.name", "COUNT(o.id) AS orders")
  .leftJoin("orders o", "o.user_id = u.id")
  .groupBy("u.id")
  .get();

// Chain multiple joins
await db("orders o")
  .select("o.id", "u.email", "p.name")
  .join("users u", "u.id = o.user_id")
  .join("products p", "p.id = o.product_id")
  .whereEq("o.status", "paid")
  .get();
```

Notes:

- Pass the table with its alias if you want one (e.g. `"users u"` or `"users AS u"`).
- Inside column names for `select`, `whereEq`, `orderBy`, etc. you can use dotted references like `"u.name"` — the builder won't incorrectly wrap those in backticks.
- JOINs apply to `get()`, `first()`, and `count()`. For `update` / `delete` across joined tables, use `sqlQuery(...)` directly.

### COUNT

```ts
const total = await db("users").whereEq("role", "ADMIN").count();
//    ^? number

// Works with JOINs too
const paidUsers = await db("users u")
  .join("orders o", "o.user_id = u.id AND o.status = ?", "paid")
  .count();
```

`count()` reuses your current WHERE / JOIN / GROUP-BY state, so the count always matches what `.get()` would return.

### INSERT

```ts
const newId = await db("users").insert({
  name: "Jane",
  email: "jane@example.com",
  password: hashedPassword,
});
// newId → auto-increment id of the inserted row
```

### UPDATE

```ts
const affected = await db("users")
  .whereEq("id", 42)
  .update({ name: "Jane Doe" });
```

> **Safety guard:** `.update()` **throws** if no `where*` clause is set — that prevents accidental full-table updates.

### DELETE

```ts
const removed = await db("users").whereEq("id", 42).delete();
```

> **Safety guard:** `.delete()` **throws** without a `where*` clause.

### Picking the database

The builder uses `db1` by default. To run one query against `db2`:

```ts
await db("users").useDb("db2").get();
```

---

## Raw queries: `sqlQuery(...)`

For joins, subqueries, window functions, or anything the builder doesn't cover, drop down to raw SQL. Values still go through `?` placeholders.

```ts
import { sqlQuery } from "@/lib/db/mysql";

const rows = await sqlQuery<{ id: number; total: number }[]>(
  `SELECT u.id, SUM(o.amount) AS total
     FROM users u
     JOIN orders o ON o.user_id = u.id
    WHERE u.role = ?
    GROUP BY u.id`,
  ["ADMIN"],
);
```

### Running on multiple databases in parallel

Pass an array as the third argument; you get an object keyed by DB.

```ts
const results = await sqlQuery<{ total: number }[]>(
  "SELECT COUNT(*) AS total FROM orders",
  [],
  ["db1", "db2"],
);

results.db1; // { total: number }[]
results.db2; // { total: number }[]
```

### Debug logging

Pass `{ debug: true }` to print the final SQL with values interpolated (for reading only — the actual query still runs parameterized):

```ts
await sqlQuery("SELECT * FROM users WHERE id = ?", [1], "db1", { debug: true });
// 🔍 sqlQuery [db1]
// SELECT * FROM users WHERE id = 1
```

---

## Transactions: `withTransaction(...)`

Wrap multiple statements in an atomic transaction. Auto-commits on success, auto-rolls-back on any thrown error, and always releases the connection.

```ts
import { withTransaction } from "@/lib/db/mysql";

await withTransaction(async (conn) => {
  await conn.query("INSERT INTO orders (user_id, total) VALUES (?, ?)", [
    userId,
    total,
  ]);
  await conn.query("UPDATE inventory SET stock = stock - ? WHERE id = ?", [
    qty,
    productId,
  ]);

  // throw here → everything is rolled back
});
```

Pick a specific DB:

```ts
await withTransaction(async (conn) => { ... }, "db2");
```

> Inside a transaction you must use `conn.query(...)` directly so every statement runs on the same connection. The `db(...)` builder and top-level `sqlQuery(...)` grab their own connections from the pool, so they won't participate in your transaction.

---

## Quick reference

| Task | Snippet |
|---|---|
| Get all rows | `db("t").get()` |
| Get one row | `db("t").whereEq("id", 1).first()` |
| Count | `db("t").whereEq("role", "ADMIN").count()` |
| Search | `db("t").whereLike("name", "%foo%").get()` |
| Multiple IDs | `db("t").whereIn("id", [1,2,3]).get()` |
| INNER JOIN | `db("a").join("b", "b.a_id = a.id").get()` |
| LEFT JOIN | `db("a").leftJoin("b", "b.a_id = a.id").get()` |
| Pagination | `db("t").limit(20).offset(40).get()` |
| Insert | `db("t").insert({ ... })` |
| Update | `db("t").whereEq("id", 1).update({ ... })` |
| Delete | `db("t").whereEq("id", 1).delete()` |
| Raw SQL | `sqlQuery("...", [values])` |
| Multi-DB | `sqlQuery("...", [], ["db1","db2"])` |
| Transaction | `withTransaction(async (conn) => { ... })` |

---

## Gotchas

- **Always** pass user input through `?` placeholders (all `where*` / `insert` / `update` helpers already do this). Never concatenate values into the SQL string.
- `.update()` and `.delete()` refuse to run without a `where*` clause — this is intentional.
- `buildDebugQuery` (used by `{ debug: true }`) produces a human-readable string only. Do **not** send its output back to the database.
- Pools live for the lifetime of the process. In dev with hot-reload, Next.js may create several — that's fine, each is scoped to its module cache.
- `mySqlConnect()` gives you a raw connection. If you use it directly, remember to call `connection.release()` in a `finally` block — or just use `withTransaction()` which handles that for you.
