"use client";
import { Button } from "@/components/ui/button";
import { apiFetcher } from "@/lib/api/apiFetcher";
import { toast } from "sonner";

export default function Home() {
  const cronTest = async () => {
    const res = await apiFetcher("/api/crons/test-cron", {
      method: "POST",
    });
    console.log(res);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };
  return (
    <div>
      <Button onClick={cronTest}>Test Cron</Button>
    </div>
  );
}
