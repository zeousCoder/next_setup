import { getPermission } from "../_actions/permission-action";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const usePermissions = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["permission"],
    queryFn: () => getPermission(),
  });

  return {
    data,
    isLoading,
    error,
  };
};
