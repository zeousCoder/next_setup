# Method Use Cases

A reference for every utility/method in this project with real examples.

---

## 1. `sqlQuery` — `src/lib/db/mysql.ts`

Runs a SQL query against one or multiple MySQL databases. Uses connection pooling internally.

**Signature**
```ts
sqlQuery<T>(query, values, db?, options?)
```

| Param | Type | Default | Description |
|---|---|---|---|
| `query` | `string` | — | SQL string with `?` placeholders |
| `values` | `QueryValues` | `[]` | Values to substitute for `?` |
| `db` | `"db1" \| "db2" \| DatabaseKey[]` | `"db1"` | Which database(s) to run on |
| `options.debug` | `boolean` | `false` | Print formatted query to console |

---

### SELECT — fetch all rows
```ts
const rows = await sqlQuery("SELECT * FROM employees");
```

### SELECT — with WHERE
```ts
const rows = await sqlQuery(
  "SELECT * FROM employees WHERE id = ? AND status = ?",
  [42, "active"]
);
```

### SELECT — typed response
```ts
type Employee = { id: number; name: string; email: string };

const rows = await sqlQuery<Employee[]>(
  "SELECT id, name, email FROM employees WHERE dept = ?",
  ["engineering"]
);
// rows is Employee[]
```

### INSERT
```ts
const result = await sqlQuery(
  "INSERT INTO employees (name, email, dept) VALUES (?, ?, ?)",
  ["John Doe", "john@example.com", "engineering"],
  "db1"
);
```

### UPDATE
```ts
await sqlQuery(
  "UPDATE employees SET name = ?, email = ? WHERE id = ?",
  ["Jane Doe", "jane@example.com", 5],
  "db1"
);
```

### DELETE
```ts
await sqlQuery(
  "DELETE FROM employees WHERE id = ?",
  [5],
  "db1"
);
```

### Query on db2
```ts
const rows = await sqlQuery(
  "SELECT * FROM orders WHERE user_id = ?",
  [userId],
  "db2"
);
```

### Query on BOTH databases at once
```ts
const result = await sqlQuery(
  "SELECT * FROM config",
  [],
  ["db1", "db2"]
) as Record<"db1" | "db2", ConfigRow[]>;

const db1Config = result.db1;
const db2Config = result.db2;
```

### With debug (prints formatted query to terminal + browser console)
```ts
await sqlQuery(
  "SELECT * FROM tbl_permission_category WHERE id = ?",
  [3],
  "db1",
  { debug: true }
);
// Console: 🔍 sqlQuery [db1]
//          SELECT * FROM tbl_permission_category WHERE id = 3
```

> **Note:** Always wrap in `try/catch` in server actions. On error, the query is **always** printed to console even without `debug: true`.

---

## 2. `apiFetcher` — `src/lib/api/apiFetcher.ts`

Wraps `fetch` with auto auth headers, timeout, retries, and a standard `ApiResponse<T>` shape.

**Signature**
```ts
apiFetcher<TResponse, TBody>(endpoint, options?)
```

**Always returns:**
```ts
{
  success: boolean;
  statusCode: number;
  message: string;
  description?: string;
  data: T | null;
  timestamp: string;
}
```

| Option | Type | Default | Description |
|---|---|---|---|
| `method` | `GET\|POST\|PUT\|PATCH\|DELETE` | `GET` | HTTP method |
| `body` | `TBody` | — | JSON body or FormData |
| `token` | `string` | env `SERVER_TOKEN` | Override Bearer token |
| `timeoutMs` | `number` | `15000` | Abort after ms |
| `retries` | `number` | `0` | Retry count on 5xx/timeout (GET only) |
| `retryDelayMs` | `number` | `500` | Delay between retries |
| `cache` | `RequestCache` | `no-store` | Next.js fetch cache |
| `next` | `NextFetchRequestConfig` | — | Next.js ISR/revalidation config |

---

### GET request
```ts
const res = await apiFetcher<User[]>("/users");

if (res.success) {
  console.log(res.data); // User[]
} else {
  console.error(res.message); // e.g. "Not Found"
}
```

### GET with typed response
```ts
type Product = { id: number; name: string; price: number };

const res = await apiFetcher<Product>("/products/123");
if (res.success && res.data) {
  console.log(res.data.name);
}
```

### POST with body
```ts
type LoginBody = { email: string; password: string };
type LoginResponse = { token: string; user: User };

const res = await apiFetcher<LoginResponse, LoginBody>("/auth/login", {
  method: "POST",
  body: { email: "user@example.com", password: "secret" },
});
```

### PUT / PATCH
```ts
await apiFetcher<void, { name: string }>("/users/5", {
  method: "PUT",
  body: { name: "New Name" },
});

await apiFetcher<void, { status: string }>("/orders/10", {
  method: "PATCH",
  body: { status: "shipped" },
});
```

### DELETE
```ts
const res = await apiFetcher("/users/5", { method: "DELETE" });
```

### FormData upload
```ts
const form = new FormData();
form.append("file", file);
form.append("name", "avatar");

const res = await apiFetcher<{ url: string }>("/upload", {
  method: "POST",
  body: form, // Content-Type is NOT set — browser sets it with boundary
});
```

### With custom Bearer token
```ts
const res = await apiFetcher<Order[]>("/orders", {
  token: userSession.accessToken,
});
```

### With timeout + retries (good for unstable endpoints)
```ts
const res = await apiFetcher<ReportData>("/reports/generate", {
  timeoutMs: 30000, // 30s timeout
  retries: 3,       // retry 3 times on 5xx
  retryDelayMs: 1000,
});
```

### Next.js ISR revalidation
```ts
// Revalidate every 60 seconds
const res = await apiFetcher<Product[]>("/products", {
  cache: "force-cache",
  next: { revalidate: 60 },
});

// Tag-based revalidation
const res = await apiFetcher<Post>("/posts/1", {
  cache: "force-cache",
  next: { tags: ["post-1"] },
});
```

---

## 3. `serialize` — `src/lib/utils.ts`

Strips non-serializable values (like `Date`, `BigInt`, class instances) from MySQL/DB results before passing to client components or returning from server actions.

```ts
serialize<T>(data: T): T
// equivalent to: JSON.parse(JSON.stringify(data))
```

### Usage in server actions (always do this)
```ts
"use server";
import { sqlQuery } from "@/lib/db/mysql";
import { serialize } from "@/lib/utils";

export async function getCategory() {
  const rows = await sqlQuery("SELECT * FROM tbl_permission_category");
  return serialize(rows); // safe to pass to client
}
```

> Without `serialize`, MySQL `Date` objects will throw "Error: Only plain objects can be passed to Client Components from Server Components."

---

## 4. `cn` — `src/lib/utils.ts`

Merges Tailwind classes safely, resolving conflicts (e.g. `p-2` vs `p-4`).

```ts
cn(...inputs: ClassValue[]): string
```

```tsx
// Conditional classes
<div className={cn("p-4 rounded", isActive && "bg-blue-500", isError && "bg-red-500")} />

// Merging with prop overrides
function Button({ className }: { className?: string }) {
  return <button className={cn("px-4 py-2 bg-blue-500", className)} />;
}
// cn resolves conflicts: "bg-blue-500 bg-red-500" → keeps last one
<Button className="bg-red-500" />
```

---

## 5. Server Action Pattern — `"use server"` files

Server actions run **only on the server**. Use them to talk to the DB or call internal APIs.

### Standard pattern
```ts
"use server";
import { sqlQuery } from "@/lib/db/mysql";
import { serialize } from "@/lib/utils";

export async function getItems() {
  try {
    const rows = await sqlQuery("SELECT * FROM items", [], "db1");
    return serialize(rows);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch items");
  }
}

export async function createItem(name: string, status: "Y" | "N") {
  try {
    const result = await sqlQuery(
      "INSERT INTO items (name, status) VALUES (?, ?)",
      [name, status],
      "db1"
    );
    return serialize(result);
  } catch (error: any) {
    throw new Error(error.message || "Failed to create item");
  }
}

export async function deleteItem(id: number) {
  try {
    await sqlQuery("DELETE FROM items WHERE id = ?", [id], "db1");
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete item");
  }
}
```

---

## 6. Custom Hook Pattern — TanStack Query + Server Actions

The standard pattern used across this project for client-side data + mutations.

```ts
// use-items.ts  (client-side hook)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getItems, createItem, deleteItem } from "./items-action";

export const useItems = () => {
  const queryClient = useQueryClient();

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ["items"],
    queryFn: () => getItems(),
  });

  // Create
  const createMutation = useMutation({
    mutationFn: ({ name, status }: { name: string; status: "Y" | "N" }) =>
      createItem(name, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create item");
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete item");
    },
  });

  return { data, isLoading, error, createMutation, deleteMutation };
};
```

**Using the hook in a component:**
```tsx
"use client";
export default function ItemsTable() {
  const { data, isLoading, createMutation, deleteMutation } = useItems();

  return (
    <>
      <button
        onClick={() => createMutation.mutate({ name: "New Item", status: "Y" })}
        disabled={createMutation.isPending}
      >
        Create
      </button>

      {data?.map((item) => (
        <div key={item.id}>
          {item.name}
          <button
            onClick={() => deleteMutation.mutate(item.id)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </button>
        </div>
      ))}
    </>
  );
}
```

---

## 7. `getMySqlPool` / `mySqlConnect` — `src/lib/db/mysql.ts`

Low-level access. Prefer `sqlQuery` for normal use. Only use these when you need manual transaction control.

```ts
// Manual transaction example
const conn = await mySqlConnect("db1");
try {
  await conn.beginTransaction();
  await conn.query("INSERT INTO orders (user_id) VALUES (?)", [userId]);
  await conn.query("UPDATE stock SET qty = qty - 1 WHERE id = ?", [productId]);
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

---

## 8. `GlobalDownloader` — `src/components/download/GlobalDownloader.tsx`

Downloads any array of data as a **CSV file**. Works with any shape of data — pass column config to control which fields are exported and what the headers are called.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `T[]` | — | Array of objects to export |
| `columns` | `{ key: keyof T, header: string }[]` | all keys | Which fields to include and their CSV headers |
| `fileName` | `string` | `"download.csv"` | Output file name |
| `name` | `string` | `""` | Label shown on the button e.g. `"Users"` → "Download Users" |
| `variant` | `"default" \| "secondary" \| "outline" \| "ghost"` | `"secondary"` | Button style |
| `size` | `"default" \| "sm" \| "lg" \| "icon"` | `"sm"` | Button size |

---

### Basic — download all fields
```tsx
import GlobalDownloader from "@/components/download/GlobalDownloader";

<GlobalDownloader
  data={users}
  fileName="users.csv"
  name="Users"
/>
// Downloads all keys from each user object as columns
```

### With specific columns (most common usage)
```tsx
<GlobalDownloader
  data={users}
  fileName="users-export.csv"
  name="Users"
  columns={[
    { key: "id",    header: "Sr. No." },
    { key: "name",  header: "Full Name" },
    { key: "email", header: "Email Address" },
    { key: "role",  header: "Role" },
  ]}
/>
// CSV will only have these 4 columns with these exact header names
```

### With sequential Sr. No. (not DB id)
```tsx
// Map the data first to inject a sequential number
<GlobalDownloader
  data={filteredRows.map((item, index) => ({ ...item, sr_no: index + 1 }))}
  fileName="permissions.csv"
  name="Permissions"
  columns={[
    { key: "sr_no",       header: "Sr. No." },
    { key: "cat_name",    header: "Category Name" },
    { key: "cat_status",  header: "Status" },
  ]}
/>
```

### With filtered data (only download what's visible)
```tsx
const [search, setSearch] = useState("");

const filtered = data.filter((item) =>
  item.name.toLowerCase().includes(search.toLowerCase())
);

<GlobalDownloader
  data={filtered}   // always reflects current search/filter
  fileName="filtered-results.csv"
  name="Results"
  columns={[
    { key: "name",   header: "Name" },
    { key: "status", header: "Status" },
  ]}
/>
```

### With custom button style
```tsx
<GlobalDownloader
  data={orders}
  fileName="orders.csv"
  name="Orders"
  variant="outline"
  size="default"
/>
```

> **Note:** If `data` is empty, a warning toast fires and no file is downloaded.

---

## 9. `DownloadChart` — `src/components/download/DownloadChart.tsx`

Downloads any chart (or any DOM element) as a **PNG image**. Pass a `ref` pointing to the container div that wraps your chart.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `containerRef` | `RefObject<HTMLDivElement \| null>` | — | Ref to the div wrapping the chart |
| `fileName` | `string` | `"chart"` | Output file name (`.png` is added automatically) |
| `className` | `string` | — | Extra classes on the button |

---

### Basic usage
```tsx
"use client";
import { useRef } from "react";
import DownloadChart from "@/components/download/DownloadChart";
import { PieChart, Pie } from "recharts";

export default function MyChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <DownloadChart containerRef={chartRef} fileName="my-chart" />

      {/* Wrap your chart in the ref div */}
      <div ref={chartRef} className="mx-auto w-fit">
        <PieChart width={300} height={300}>
          <Pie data={data} dataKey="value" />
        </PieChart>
      </div>
    </div>
  );
}
```

### With shadcn/ui ChartContainer
```tsx
"use client";
import { useRef } from "react";
import { ChartContainer } from "@/components/ui/chart";
import DownloadChart from "@/components/download/DownloadChart";

export default function SalesChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sales</CardTitle>
        <DownloadChart containerRef={chartRef} fileName="sales-chart" />
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="mx-auto w-fit">
          <ChartContainer config={chartConfig} className="h-[250px]">
            {/* your chart here */}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

> **Tips:**
> - Add `className="mx-auto w-fit"` to the ref div so the downloaded image is tight around the chart (no extra whitespace).
> - Output is **2× retina quality** PNG with white background.
> - The button shows a spinner while the image is being generated.

---

## Quick Reference

| Method | Where | Use for |
|---|---|---|
| `sqlQuery` | `src/lib/db/mysql.ts` | All DB queries (SELECT, INSERT, UPDATE, DELETE) |
| `apiFetcher` | `src/lib/api/apiFetcher.ts` | Calling external/internal REST APIs |
| `serialize` | `src/lib/utils.ts` | Sanitize DB results before passing to client |
| `cn` | `src/lib/utils.ts` | Merge Tailwind classes conditionally |
| `GlobalDownloader` | `src/components/download/GlobalDownloader.tsx` | Download any data array as CSV |
| `DownloadChart` | `src/components/download/DownloadChart.tsx` | Download any chart/DOM element as PNG |
| `getMySqlPool` | `src/lib/db/mysql.ts` | Direct pool access (advanced) |
| `mySqlConnect` | `src/lib/db/mysql.ts` | Manual transactions only |
