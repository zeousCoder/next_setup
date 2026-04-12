import {
  getCategory,
  deleteCategory,
  createCategory,
  updateCategory,
} from "./permissions-action";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const usePermissions = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => getCategory(),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete category");
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: ({
      cat_name,
      cat_status,
      utype,
    }: {
      cat_name: string;
      cat_status: "Y" | "N";
      utype: string[];
    }) => createCategory(cat_name, cat_status, utype),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Category created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      cat_name,
      cat_status,
      utype,
    }: {
      id: number;
      cat_name: string;
      cat_status: "Y" | "N";
      utype: string[];
    }) => updateCategory(id, cat_name, cat_status, utype),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Category updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update category");
    },
  });

  return {
    data,
    isLoading,
    error,
    deleteCategoryMutation,
    createCategoryMutation,
    updateCategoryMutation,
  };
};
