"use client";

import { useEffect, useState } from "react";
import { ShieldPlus } from "lucide-react";
import type { Session } from "next-auth";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function SessionShowcase({ session }: { session: Session }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Session">
          <ShieldPlus size={16} />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto max-w-[90vw]">
        <pre className="whitespace-pre rounded-md bg-black p-2 text-[11px] leading-relaxed text-red-400">
          {JSON.stringify(session, null, 2)}
        </pre>
      </PopoverContent>
    </Popover>
  );
}
