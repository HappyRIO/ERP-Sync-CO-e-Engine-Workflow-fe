// Custom hooks for booking history
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { useAuth } from '@/contexts/AuthContext';

export function useBookings(filter?: { status?: string; clientId?: string }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bookings', user?.id, filter],
    queryFn: () => bookingService.getBookings(user, filter),
  });
}

export function useBooking(id: string | null) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => id ? bookingService.getBookingById(id) : null,
    enabled: !!id,
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ bookingId, driverId }: { bookingId: string; driverId: string }) =>
      bookingService.assignDriver(bookingId, driverId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (bookingId: string) =>
      bookingService.completeBooking(bookingId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: string }) =>
      bookingService.updateBookingStatus(bookingId, status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

