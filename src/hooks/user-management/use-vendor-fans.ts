"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createFan,
  getFansByVendor,
  updateFan,
  type CreateFanInput,
  type UpdateFanInput,
} from "@/actions/user-management/fan-action";

export const useVendorFans = (vendorId: number | null | undefined) => {
  const queryClient = useQueryClient();

  const enabled = Boolean(vendorId);
  const queryKey = ["vendor-fans", vendorId] as const;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      if (!vendorId) return [];
      const res = await getFansByVendor(vendorId);
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    // the vendor list shows the default FAN, keep it in sync too
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
  };

  const createFanMutation = useMutation({
    mutationFn: (input: CreateFanInput) => createFan(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      invalidate();
      toast.success("FAN added successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to create FAN";
      toast.error(message);
    },
  });

  const updateFanMutation = useMutation({
    mutationFn: (input: UpdateFanInput) => updateFan(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      invalidate();
      toast.success("FAN updated successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to update FAN";
      toast.error(message);
    },
  });

  return {
    fans: data,
    isLoading,
    error,
    refetch,
    createFanMutation,
    updateFanMutation,
  };
};
