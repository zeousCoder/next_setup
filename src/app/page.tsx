import { Button } from "@/components/ui/button";
import { apiFetcher } from "@/lib/api/apiFetcher";
import { getSession } from "@/session/auth-session";
import { toast } from "sonner";

export default async function Home() {
  // const cronTest = async () => {
  //   const res = await apiFetcher("/api/crons/test-cron", {
  //     method: "POST",
  //   });
  //   console.log(res);
  //   if (res.success) {
  //     toast.success(res.message);
  //   } else {
  //     toast.error(res.message);
  //   }
  // };

  // const { data: session } = useSession();
  const session = await getSession();
  return (
    <div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      {/* <Button onClick={cronTest}>Test Cron</Button> */}
    </div>
  );
}
