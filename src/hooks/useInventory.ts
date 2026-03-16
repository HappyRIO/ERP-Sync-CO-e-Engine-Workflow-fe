import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService, InventoryItem, InventoryUploadItem } from "@/services/inventory.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function useInventory(clientId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['inventory', clientId || user?.userId],
    queryFn: () => inventoryService.getInventory(clientId),
    enabled: !!user,
  });
}

export function useAvailableInventory(clientId: string, deviceType?: string, conditionCode?: string) {
  return useQuery({
    queryKey: ['inventory', 'available', clientId, deviceType, conditionCode],
    queryFn: () => inventoryService.getAvailableInventory(clientId, deviceType, conditionCode),
    enabled: !!clientId,
  });
}

export function useUploadInventory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ items, clientId }: { items: InventoryUploadItem[]; clientId?: string }) =>
      inventoryService.uploadInventory(items, clientId),
    onSuccess: (data) => {
      toast.success("Inventory uploaded successfully", {
        description: `Created ${data.created} items`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
    mutationFn: (clientId?: string) => inventoryService.syncInventory(clientId),
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
