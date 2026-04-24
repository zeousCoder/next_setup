import { ModeToggle } from "./ThemeMode";
import Controller from "../user_management/Controller";
import Profile from "../user_management/Profile";
import SessionShowcase from "./SessionShowcase";

import { getSession, permissionCheck } from "@/session/auth-session";

export default async function Header() {
  const session = await getSession();

  return (
    <div className="w-full h-16 border-b border-gray-200 dark:border-gray-800 flex flex-row items-center justify-between ">
      <ModeToggle />

      <div className="flex flex-row items-center gap-2 justify-center">
        {!session ? null : (
          <>
            <SessionShowcase session={session} />
            <Profile user={session?.user} />
            <Controller user={session?.user} />
          </>
        )}
      </div>
    </div>
  );
}
