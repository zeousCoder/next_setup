import React from "react";
import { ModeToggle } from "./ThemeMode";
import { GLOBAL_CONSTANTS } from "@/constants/globalConstants";
import Image from "next/image";

export default function Header() {
  return (
    <div className="">
      {/* <Image
        src={GLOBAL_CONSTANTS.headerLogo}
        alt="logo"
        width={100}
        height={100}
      /> */}
      <ModeToggle />
    </div>
  );
}
