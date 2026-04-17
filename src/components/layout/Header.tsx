import React from "react";
import { ModeToggle } from "./ThemeMode";
import { GLOBAL_CONSTANTS } from "@/constants/globalConstants";
import Image from "next/image";
import Controller from "@/app/user-management/_components/Controller";

export default function Header() {
  return (
    <div className="w-full h-16 border-b border-gray-200 dark:border-gray-800 flex flex-row items-center justify-between ">
      <ModeToggle />
      <Controller />
    </div>
  );
}
