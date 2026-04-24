"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

/**
 * Shape each consumer needs to provide. We accept anything extra (`...` rest)
 * so you can pass your raw row objects and just tell us how to derive the
 * `value`, `label`, and optional `disabled` flags via accessor functions.
 */
export type EntitySelectAccessors<T> = {
  getValue: (item: T) => string;
  getLabel: (item: T) => React.ReactNode;
  getDisabled?: (item: T) => boolean;
  getKey?: (item: T) => string | number;
};

export type EntitySelectProps<T> = EntitySelectAccessors<T> & {
  items: T[];

  // Controlled / uncontrolled value
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  // UX
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;

  // Form integration — useful when using native <form> + FormData
  name?: string;
  id?: string;

  // Styling hooks
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;

  // Special: prepend an option for "All" / "None" style filters.
  // If set, that value will appear as the first item and select it clears the
  // selection semantically (caller decides what the value means — typically
  // "" or "ALL").
  allOption?: { value: string; label: React.ReactNode };
};

/**
 * Generic, controlled/uncontrolled Select for rendering a list of entities.
 *
 * Works for both form fields and table filters. Use the domain wrappers
 * (`SelectCompany`, `SelectVendor`, ...) when you want a tight API, or drop
 * this in directly when you need full control.
 */
export default function EntitySelect<T>({
  items,
  getValue,
  getLabel,
  getDisabled,
  getKey,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  emptyMessage = "No options available",
  disabled,
  required,
  name,
  id,
  className,
  triggerClassName,
  contentClassName,
  allOption,
}: EntitySelectProps<T>) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
      name={name}
    >
      <SelectTrigger id={id} className={triggerClassName ?? className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {allOption ? (
          <SelectItem value={allOption.value}>{allOption.label}</SelectItem>
        ) : null}

        {items.length === 0 ? (
          <SelectItem value="__empty" disabled>
            {emptyMessage}
          </SelectItem>
        ) : (
          items.map((item, index) => {
            const itemValue = getValue(item);
            return (
              <SelectItem
                key={getKey ? getKey(item) : (itemValue ?? index)}
                value={itemValue}
                disabled={getDisabled?.(item)}
              >
                {getLabel(item)}
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}
