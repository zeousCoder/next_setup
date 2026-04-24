import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminChildUser,
  getAdminChildUsers,
  updateAdminChildUser,
  updateAdminChildUserPassword,
  type CreateAdminChildUserInput,
  type UpdateAdminChildUserInput,
} from "@/actions/user-management/admin-action";
import { toast } from "sonner";

export const useAdminChildUsers = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-child-users"],
    queryFn: async () => {
      const res = await getAdminChildUsers();
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.data;
    },
  });

  const createAdminChildUserMutation = useMutation({
    mutationFn: (input: CreateAdminChildUserInput) =>
      createAdminChildUser(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-child-users"] });
      toast.success("User created successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to create user";
      toast.error(message);
    },
  });

  const updateAdminChildUserPasswordMutation = useMutation({
    mutationFn: (input: { id: number; password: string }) =>
      updateAdminChildUserPassword(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-child-users"] });
      toast.success("User password updated successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to update user password";
      toast.error(message);
    },
  });
  const updateAdminChildUserMutation = useMutation({
    mutationFn: (input: UpdateAdminChildUserInput) =>
      updateAdminChildUser(input),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-child-users"] });
      toast.success("User updated successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to update user";
      toast.error(message);
    },
  });
  return {
    adminChildUsers: data,
    isLoading,
    error,
    createAdminChildUserMutation,
    updateAdminChildUserPasswordMutation,
    updateAdminChildUserMutation,
  };
};
