// Custom hook for fetching sites
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteService, type Site } from '@/services/site.service';

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: () => siteService.getSites(),
    staleTime: 60000, // 1 minute
  });
}

export function useSite(id: string | undefined) {
  return useQuery({
    queryKey: ['site', id],
    queryFn: () => id ? siteService.getSite(id) : null,
    enabled: !!id,
    staleTime: 60000,
  });
}

export function useSearchSites(query: string) {
  return useQuery({
    queryKey: ['sites', 'search', query],
    queryFn: () => siteService.searchSites(query),
    enabled: query.length > 2,
    staleTime: 30000,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (site: Omit<Site, 'id'>) => siteService.createSite(site),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Site, 'id'>> }) =>
      siteService.updateSite(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => siteService.deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useSetDefaultSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => siteService.setDefaultSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

