"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PencilIcon, PlusIcon } from "lucide-react";
import { usePermissions } from "./use-permissions";

const USER_TYPES = [
  { value: "A", label: "Admin" },
  { value: "V", label: "Vendor" },
  { value: "SA", label: "Super Admin" },
] as const;

type UserTypeValue = (typeof USER_TYPES)[number]["value"];

export type CategoryInitialData = {
  id: number;
  cat_name: string;
  cat_status: "Y" | "N";
  utype: string;
};

interface Props {
  initialData?: CategoryInitialData;
}

const FORM_ID = "category-form";

export default function CreatePermissionButton({ initialData }: Props) {
  const isEdit = !!initialData;

  const [open, setOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catStatus, setCatStatus] = useState<"Y" | "N">("Y");
  const [selectedTypes, setSelectedTypes] = useState<UserTypeValue[]>([]);

  const { createCategoryMutation, updateCategoryMutation } = usePermissions();
  const isPending = isEdit
    ? updateCategoryMutation.isPending
    : createCategoryMutation.isPending;

  const resetToInitial = () => {
    if (initialData) {
      setCatName(initialData.cat_name);
      setCatStatus(initialData.cat_status);
      setSelectedTypes(
        initialData.utype
          .split(",")
          .map((u) => u.trim())
          .filter((u) =>
            USER_TYPES.some((t) => t.value === u),
          ) as UserTypeValue[],
      );
    } else {
      setCatName("");
      setCatStatus("Y");
      setSelectedTypes([]);
    }
  };

  useEffect(() => {
    if (open) resetToInitial();
  }, [open]);

  const toggleType = (value: UserTypeValue) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isEdit) {
      updateCategoryMutation.mutate(
        {
          id: initialData.id,
          cat_name: catName,
          cat_status: catStatus,
          utype: selectedTypes,
        },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createCategoryMutation.mutate(
        { cat_name: catName, cat_status: catStatus, utype: selectedTypes },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit category</span>
          </Button>
        ) : (
          <Button variant="default" size="sm" className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            Create Category
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the category details below."
              : "Add a new category and assign it to user types."}
          </DialogDescription>
        </DialogHeader>

        <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat_name">Category Name</Label>
            <Input
              id="cat_name"
              name="cat_name"
              placeholder="e.g. UserManagement"
              autoComplete="off"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value.replace(/\s/g, ""))}
            />
          </div>

          <div className="space-y-2">
            <Label>User Type</Label>
            <div className="flex flex-wrap gap-4">
              {USER_TYPES.map((type) => (
                <div key={type.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`utype-${type.value}`}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => toggleType(type.value)}
                  />
                  <Label
                    htmlFor={`utype-${type.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select at least one user type.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat_status">Status</Label>
            <Select
              name="cat_status"
              value={catStatus}
              onValueChange={(v) => setCatStatus(v as "Y" | "N")}
            >
              <SelectTrigger id="cat_status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Y">Active</SelectItem>
                <SelectItem value="N">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={selectedTypes.length === 0 || isPending}
          >
            {isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
