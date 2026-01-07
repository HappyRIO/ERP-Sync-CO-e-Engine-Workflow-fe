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
      // Refresh notifications and unread count, as driver assignment triggers notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
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
      // Completing a booking triggers notifications for client and admin
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useApproveBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, notes }: { bookingId: string; notes?: string }) =>
      bookingService.approveBooking(bookingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      // Booking approval triggers notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, status, notes }: { bookingId: string; status: string; notes?: string }) =>
      bookingService.updateBookingStatus(bookingId, status as any, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      // Many booking status changes generate notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

