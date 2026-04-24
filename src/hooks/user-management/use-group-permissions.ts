import { useQuery } from "@tanstack/react-query";

import {
  getGroupPermissions,
  type GroupPermissionRow,
} from "@/actions/user-management/group-permission-action";

type Options = {
  /** When false, the query will not fire. Useful for lazy drawer/modal loads. */
  enabled?: boolean;
};

/**
 * Fetches all permissions (joined with `tbl_permission` + `tbl_permission_category`)
 * for a given `gr_id` and caches the result per group.
 *
 * Usage:
 *   const { permissions, grouped, isLoading, error } = useGroupPermissions(
 *     groupId,
 *     { enabled: drawerOpen },
 *   );
 */
export const useGroupPermissions = (
  groupId: number | null | undefined,
  options?: Options,
) => {
  const enabled = (options?.enabled ?? true) && Boolean(groupId);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["group-permissions", groupId],
    enabled,
    queryFn: async () => {
      if (!groupId) return [] as GroupPermissionRow[];
      const res = await getGroupPermissions(groupId);
      if (!res.success) {
        throw new Error(res.error);
      }
      return (res.data ?? []) as GroupPermissionRow[];
    },
  });

  const permissions: GroupPermissionRow[] = data ?? [];

  // Bucket by category name so the UI can render category sections directly.
  const grouped: { cat_name: string; items: GroupPermissionRow[] }[] = (() => {
    const map = new Map<string, GroupPermissionRow[]>();
    for (const perm of permissions) {
      const key = perm.cat_name ?? "Uncategorised";
      const list = map.get(key);
      if (list) list.push(perm);
      else map.set(key, [perm]);
    }
    return Array.from(map.entries()).map(([cat_name, items]) => ({
      cat_name,
      items,
    }));
  })();

  return {
    permissions,
    grouped,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
};
