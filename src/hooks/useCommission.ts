// Custom hooks for commission
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commissionService } from '@/services/commission.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useCommissions(filter?: { status?: string; period?: string }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['commissions', user?.id, filter],
    queryFn: () => commissionService.getCommissions(user, filter),
  });
}

export function useCommissionSummary() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['commissionSummary', user?.id],
    queryFn: () => commissionService.getCommissionSummary(user),
  });
}

export function useUpdateCommissionStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ commissionId, status }: { commissionId: string; status: 'pending' | 'approved' | 'paid' }) =>
      commissionService.updateCommissionStatus(commissionId, status),
    onSuccess: (data, variables) => {
      toast.success('Commission status updated', {
        description: `Status changed to ${variables.status}`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commissionSummary'] });
    },
    onError: (error) => {
      toast.error('Failed to update commission status', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

