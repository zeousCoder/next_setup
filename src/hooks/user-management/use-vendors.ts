"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createVendor,
  getVendors,
  updateVendor,
  updateVendorPassword,
  type CreateVendorInput,
  type UpdateVendorInput,
} from "@/actions/user-management/vendor-action";

export const useVendors = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await getVendors();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data;
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: (input: CreateVendorInput) => createVendor({ data: input }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor created successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to create vendor";
      toast.error(message);
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: (input: UpdateVendorInput) => updateVendor(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor updated successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to update vendor";
      toast.error(message);
    },
  });

  const updateVendorPasswordMutation = useMutation({
    mutationFn: (input: { id: number; password: string }) =>
      updateVendorPassword(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor password updated successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update vendor password";
      toast.error(message);
    },
  });

  return {
    vendors: data,
    isLoading,
    error,
    createVendorMutation,
    updateVendorMutation,
    updateVendorPasswordMutation,
  };
};
