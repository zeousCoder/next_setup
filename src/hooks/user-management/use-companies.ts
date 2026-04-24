import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCompany,
  getCompanies,
  updateCompany,
  updateCompanyPassword,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from "@/actions/user-management/company-action";

export const useCompanies = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await getCompanies();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data;
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (input: CreateCompanyInput) => createCompany(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to create company";
      toast.error(message);
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: (input: UpdateCompanyInput) => updateCompany(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company updated successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to update company";
      toast.error(message);
    },
  });

  const updateCompanyPasswordMutation = useMutation({
    mutationFn: (input: { id: number; password: string }) =>
      updateCompanyPassword(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company password updated successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update company password";
      toast.error(message);
    },
  });

  return {
    companies: data,
    isLoading,
    error,
    createCompanyMutation,
    updateCompanyMutation,
    updateCompanyPasswordMutation,
  };
};
