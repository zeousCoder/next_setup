"use client";

import EntitySelect, {
  type EntitySelectProps,
} from "../ui/entity-select";

export type Company = {
  id: number;
  company_name: string;
  status?: string;
};

/**
 * Convenience wrapper around <EntitySelect> for company rows.
 * Accepts all the generic props (value / onValueChange / placeholder / etc.)
 * plus the `companies` list.
 *
 * Use in forms:
 *   <SelectCompany
 *     name="company_id"
 *     companies={companies}
 *     value={form.company_id}
 *     onValueChange={(v) => setForm((s) => ({ ...s, company_id: v }))}
 *     required
 *   />
 *
 * Use in filters (adds an "All companies" entry):
 *   <SelectCompany
 *     companies={companies}
 *     value={filter}
 *     onValueChange={setFilter}
 *     allOption={{ value: "", label: "All companies" }}
 *     placeholder="All companies"
 *   />
 */
type Props = Omit<
  EntitySelectProps<Company>,
  "items" | "getValue" | "getLabel" | "getKey"
> & {
  companies: Company[];
};

export default function SelectCompany({
  companies,
  placeholder = "Select company",
  emptyMessage = "No active companies available",
  ...rest
}: Props) {
  return (
    <EntitySelect<Company>
      items={companies}
      getKey={(c) => c.id}
      getValue={(c) => c.id.toString()}
      getLabel={(c) => c.company_name}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      {...rest}
    />
  );
}
