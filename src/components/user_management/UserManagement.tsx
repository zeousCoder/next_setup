"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserList from "./user_list/admin/AdminUserList";
import AdminUserGroup from "./user_groups/AdminUserGroup";
import { useSearchParams, useRouter } from "next/navigation";

export default function UserManagement({ showTab }: { showTab: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = searchParams.get("tab");

  // fallback based on section
  const getDefaultTab = () => {
    if (showTab === "admin") return "admin-list";
    if (showTab === "company") return "company-list";
    if (showTab === "vendor") return "vendor-list";
  };

  const activeTab = tab || getDefaultTab();

  const handleTabChange = (value: string) => {
    router.push(`?tab=${value}`);
  };

  return (
    <div className="flex gap-4 w-full">
      {/* ADMIN */}
      {showTab === "admin" && (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="admin-list">Admin User List (MV56)</TabsTrigger>
            <TabsTrigger value="admin-group">
              Admin User Group (MV55)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin-list">
            <AdminUserList />
          </TabsContent>

          <TabsContent value="admin-group">
            <AdminUserGroup />
          </TabsContent>
        </Tabs>
      )}

      {/* COMPANY */}
      {showTab === "company" && (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="company-list">
              Company User List (MV265)
            </TabsTrigger>
            <TabsTrigger value="company-group">
              Company User Group (MV263)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company-list">Company List UI</TabsContent>

          <TabsContent value="company-group">Company Group UI</TabsContent>
        </Tabs>
      )}

      {/* VENDOR */}
      {showTab === "vendor" && (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="vendor-list">
              Vendor User List (MV266)
            </TabsTrigger>
            <TabsTrigger value="vendor-group">
              Vendor User Group (MV264)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor-list">Vendor List UI</TabsContent>

          <TabsContent value="vendor-group">Vendor Group UI</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
