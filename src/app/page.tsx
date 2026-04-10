"use client";

import { Button } from "@/components/ui/button";
import { apiFetcher } from "@/lib/api/apiFetcher";
import React, { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const response = await apiFetcher<any>("/users", {
      method: "GET",
    });

    console.log("response", response);

    setData(response);
    toast.success((response.message = "sheer"));
    setLoading(false);
  };

  return (
    <div className="p-4">
      <Button onClick={fetchData} disabled={loading}>
        {loading ? "Fetching..." : "Fetch Data"}
      </Button>

      {error && <p className="text-red-500 mt-2">Error: {error}</p>}

      <div className="mt-4">
        {data?.data?.users.map((user: any) => (
          <div key={user.id} className="border p-2 rounded mb-2">
            {user.firstName} {user.lastName}
          </div>
        ))}
      </div>
    </div>
  );
}
