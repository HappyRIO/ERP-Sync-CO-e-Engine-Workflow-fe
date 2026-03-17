import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, InventoryItem, InventoryUploadItem } from "@/services/inventory.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function useInventory(clientId?: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['inventory', clientId || user?.userId],
    queryFn: () => inventoryService.getInventory(clientId || undefined),
    enabled: !!user,
  });
}

export function useAvailableInventory(allocatedTo: string, category?: string, conditionCode?: string) {
  return useQuery({
    queryKey: ['inventory', 'available', allocatedTo, category, conditionCode],
    queryFn: () => inventoryService.getAvailableInventory(allocatedTo, category, conditionCode),
    enabled: !!allocatedTo,
  });
}

export function useUploadInventory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ items, clientId }: { items: InventoryUploadItem[]; clientId?: string }) =>
      inventoryService.uploadInventory(items, clientId),
    onSuccess: async (data) => {
      toast.success("Inventory uploaded successfully", {
        description: `Created ${data.created} items`,
      });
      // Invalidate all inventory queries (with any clientId or userId) to ensure the list refreshes
      // Using exact: false will match all queries that start with ['inventory']
      await queryClient.invalidateQueries({ 
        queryKey: ['inventory'],
        exact: false
      });
      // Also explicitly refetch to ensure immediate update
      await queryClient.refetchQueries({ 
        queryKey: ['inventory'],
        exact: false
      });
    },
    onError: (error) => {
      toast.error("Failed to upload inventory", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });
}

export function useSyncInventory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (clientId?: string | null) => inventoryService.syncInventory(clientId || undefined),
    onSuccess: (data) => {
      toast.success("Inventory synced successfully", {
        description: `Synced ${data.synced} items (${data.created} created, ${data.updated} updated)`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      toast.error("Failed to sync inventory", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });
}
