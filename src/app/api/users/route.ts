import { sqlQuery } from "@/lib/db/mysql";
import { withApiHandler } from "@/lib/api/apiHandler";

export const GET = withApiHandler(async () => {
  const users = await sqlQuery("SELECT * FROM employees LIMIT 2", [], "db2");

  return users;
});
