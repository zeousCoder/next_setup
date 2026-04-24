import {
  createApiMaster,
  CreateApiMasterInput,
  getApiMaster,
  updateApiMaster,
} from "@/actions/api-master/api-master-action";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
export const useApiMaster = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["api-master"],
    queryFn: () => getApiMaster(),
  });

  const createApiMasterMutation = useMutation({
    mutationFn: (input: CreateApiMasterInput) =>
      createApiMaster({ data: input }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["api-master"] });
      toast.success("Api Master created successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to create Api Master";
      toast.error(message);
    },
  });

  const updateApiMasterMutation = useMutation({
    mutationFn: (input: CreateApiMasterInput) =>
      updateApiMaster({ data: input }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["api-master"] });
      toast.success("Api Master updated successfully");
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to update Api Master";
      toast.error(message);
    },
  });

  return {
    data,
    isLoading,
    error,
    createApiMasterMutation,
    updateApiMasterMutation,
  };
};
