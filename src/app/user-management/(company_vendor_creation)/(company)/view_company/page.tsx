import ViewCompany from "@/components/user_management/company/ViewCompany";
import { permissionCheck } from "@/session/auth-session";
import React from "react";

export default async function ViewCompanyPage() {
  await permissionCheck("MV268");
  return <ViewCompany />;
}
