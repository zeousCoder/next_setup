"use client";
import { useSearchParams } from "next/navigation";
import React from "react";

export default function Error() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  return <div>Error: {message}</div>;
}
