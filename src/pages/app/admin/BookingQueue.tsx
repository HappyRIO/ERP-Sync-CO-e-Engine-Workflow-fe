import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Package, ArrowRight, Loader2, Truck, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookings, useUpdateBookingStatus } from "@/hooks/useBookings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStatusLabelExtended, getStatusColor } from "@/types/booking-lifecycle";
import type { BookingLifecycleStatus } from "@/types/booking-lifecycle";
import { toast } from "sonner";

const statusGroups: { label: string; statuses: (BookingLifecycleStatus | 'cancelled')[] }[] = [
  { label: "Created", statuses: ['created'] },
  { label: "Scheduled", statuses: ['scheduled'] },
  { label: "In Progress", statuses: ['collected', 'sanitised', 'graded'] },
  { label: "Completed", statuses: ['completed'] },
  { label: "Cancelled", statuses: ['cancelled'] },
];

const BookingQueue = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusGroup, setStatusGroup] = useState<string>("all");

  const { data: bookings = [], isLoading, error } = useBookings();
  const updateBookingStatus = useUpdateBookingStatus();

  const handleMoveToSanitisation = (bookingId: string) => {
    updateBookingStatus.mutate(
      { bookingId, status: 'sanitised' },
      {
        onSuccess: () => {
          toast.success("Booking moved to sanitisation", {
            description: "Booking status updated to sanitised.",
          });
        },
        onError: (error) => {
          toast.error("Failed to update booking status", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.siteName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusGroup === "all" || 
      statusGroups.find(g => g.label === statusGroup)?.statuses.includes(booking.status);
    
    return matchesSearch && matchesStatus;
  });

  // Group bookings by status
  const groupedBookings = statusGroups.reduce((acc, group) => {
    const groupBookings = filteredBookings.filter(b => group.statuses.includes(b.status));
    if (groupBookings.length > 0) {
      acc[group.label] = groupBookings;
    }
    return acc;
  }, {} as Record<string, typeof filteredBookings>);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load bookings. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Booking Queue</h2>
          <p className="text-muted-foreground">Manage and assign bookings by status</p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, booking number, or site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusGroup} onValueChange={setStatusGroup}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {statusGroups.map((group) => (
              <SelectItem key={group.label} value={group.label}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Bookings by Status Group */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(groupedBookings).length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No bookings found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-6">
          {statusGroups.map((group) => {
            const groupBookings = groupedBookings[group.label];
            if (!groupBookings || groupBookings.length === 0) return null;

            return (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{group.label}</h3>
                  <Badge variant="secondary">{groupBookings.length}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {groupBookings.map((booking, index) => {
                    const statusColor = getStatusColor(booking.status);
                    const statusLabel = getStatusLabelExtended(booking.status);

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="hover:shadow-md transition-shadow h-full">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base mb-1">{booking.clientName}</CardTitle>
                                <p className="text-xs font-mono text-muted-foreground">{booking.bookingNumber}</p>
                              </div>
                              <Badge className={statusColor}>{statusLabel}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{booking.siteName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(booking.scheduledDate).toLocaleDateString("en-GB")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Package className="h-4 w-4" />
                              <span>{booking.assets.reduce((sum, a) => sum + a.quantity, 0)} assets</span>
                            </div>
                            {booking.preferredVehicleType && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Truck className="h-4 w-4" />
                                <span>Preferred: {booking.preferredVehicleType.charAt(0).toUpperCase() + booking.preferredVehicleType.slice(1)}</span>
                              </div>
                            )}
                            {booking.driverName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Truck className="h-4 w-4" />
                                <span>Driver: {booking.driverName}</span>
                              </div>
                            )}
                            {booking.status === 'created' && (
                              <Button variant="default" asChild className="w-full mt-2" size="sm">
                                <Link to={`/admin/assign?booking=${booking.id}`} className="text-inherit no-underline">
                                  <UserPlus />
                                  Assign Driver
                                </Link>
                              </Button>
                            )}
                            {booking.status === 'collected' && (
                              <Button asChild className="w-full mt-2" size="sm" variant="default">
                                <Link to={`/admin/sanitisation/${booking.id}`} className="text-inherit no-underline">
                                  Record Sanitisation
                                </Link>
                              </Button>
                            )}
                            {booking.status === 'sanitised' && (
                              <Button asChild className="w-full mt-2" size="sm" variant="default">
                                <Link to={`/admin/grading/${booking.id}`} className="text-inherit no-underline">
                                  Grade Assets
                                </Link>
                              </Button>
                            )}
                            {booking.status === 'graded' && (
                              <Button asChild className="w-full mt-2" size="sm" variant="success">
                                <Link to={`/admin/approval/${booking.id}`} className="text-inherit no-underline">
                                  Final Approval
                                </Link>
                              </Button>
                            )}
                            <Button variant="outline" asChild className="w-full" size="sm">
                              <Link to={`/bookings/${booking.id}`} className="text-inherit no-underline">
                                View Details
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingQueue;

