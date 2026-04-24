import React from "react";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
