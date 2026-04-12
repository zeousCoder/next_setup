"use server";

import { withApiHandler } from "@/lib/api/apiHandler";
import { sqlQuery } from "@/lib/db/mysql";

export const getUsers = withApiHandler(async () => {
  const users = await sqlQuery("SELECT * FROM employees LIMIT 2", [], "db1");
  return { users };
});
