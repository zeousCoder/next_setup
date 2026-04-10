import mysql, { Pool, RowDataPacket } from "mysql2/promise";
import type { QueryValues } from "mysql2";

export type DatabaseKey = "db1" | "db2";
export type DatabaseSelection = DatabaseKey | DatabaseKey[];

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

// Execute a SQL query on one or multiple databases.
export async function sqlQuery<T = RowDataPacket[]>(
  query: string,
  values: QueryValues = [],
  db: DatabaseSelection = "db1",
): Promise<T | Record<DatabaseKey, T>> {
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
}
