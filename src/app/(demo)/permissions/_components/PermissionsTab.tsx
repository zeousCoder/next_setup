import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TblPermissionsCategory from "./TblPermissionsCategory";
import TblPermissions from "./TblPermissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreatePermissionButton from "./CreatePermissionButton";

export default function PermissionsTab() {
  return (
    <div>
      <Tabs defaultValue="category">
        <TabsList>
          <TabsTrigger value="category">Categories</TabsTrigger>
          <TabsTrigger value="permission">Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="category">
          <CardHandler
            title="Categories"
            description="A list of all categories permissions."
            actions={<CreatePermissionButton />}
          >
            <TblPermissionsCategory />
          </CardHandler>
        </TabsContent>
        <TabsContent value="permission">
          <CardHandler
            title="Permissions"
            description="A list of all permissions."
            actions={<CreatePermissionButton />}
          >
            <TblPermissions />
          </CardHandler>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function CardHandler({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
