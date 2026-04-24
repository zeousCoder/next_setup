"use client";

import EntitySelect, {
  type EntitySelectProps,
} from "../ui/entity-select";

export type Vendor = {
  id: number;
  LoginID?: string | null;
  fname?: string | null;
  lname?: string | null;
  status?: string;
};

type Props = Omit<
  EntitySelectProps<Vendor>,
  "items" | "getValue" | "getLabel" | "getKey"
> & {
  vendors: Vendor[];
};

/**
 * Convenience wrapper around <EntitySelect> for vendor rows.
 * Label falls back from LoginID → "fname lname" → id.
 */
export default function SelectVendor({
  vendors,
  placeholder = "Select vendor",
  emptyMessage = "No vendors available",
  ...rest
}: Props) {
  return (
    <EntitySelect<Vendor>
      items={vendors}
      getKey={(v) => v.id}
      getValue={(v) => v.id.toString()}
      getLabel={(v) => {
        if (v.LoginID) return v.LoginID;
        const name = [v.fname, v.lname].filter(Boolean).join(" ").trim();
        return name || String(v.id);
      }}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      {...rest}
    />
  );
}
