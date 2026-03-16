import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Package, ArrowRight, Loader2, Truck, Route, Fuel, User, UserPlus, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useBookings, useUpdateBookingStatus } from "@/hooks/useBookings";
import { useJob } from "@/hooks/useJobs";
import { useDrivers } from "@/hooks/useDrivers";
import { useReassignDriver } from "@/hooks/useJobs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStatusLabelExtended, getStatusColor } from "@/types/booking-lifecycle";
import type { BookingLifecycleStatus } from "@/types/booking-lifecycle";
import { BookingTypeBadge } from "@/components/bookings/BookingTypeBadge";
import { toast } from "sonner";

const statusGroups: { label: string; statuses: (BookingLifecycleStatus | 'cancelled')[] }[] = [
  { label: "Pending Approval", statuses: ['pending'] },
  { label: "Created", statuses: ['created'] },
  { label: "Scheduled", statuses: ['scheduled', 'collection_scheduled', 'delivery_scheduled'] },
  { label: "JML - Device Management", statuses: ['device_allocated', 'courier_booked'] },
  { label: "Collected", statuses: ['collected'] },
  { label: "In Transit", statuses: ['in_transit'] },
  { label: "In Progress", statuses: ['warehouse', 'sanitised', 'graded'] },
  { label: "Delivered", statuses: ['delivered'] },
  { label: "Completed", statuses: ['completed'] },
  { label: "Cancelled", statuses: ['cancelled'] },
];

const BookingQueue = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusGroup, setStatusGroup] = useState<string>("all");
  const [reassignBookingId, setReassignBookingId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  const { data: bookings = [], isLoading, error } = useBookings();
  const { data: drivers = [] } = useDrivers();
  const updateBookingStatus = useUpdateBookingStatus();
  const reassignDriver = useReassignDriver();
  
  // Filter out drivers without allocated vehicles
  const driversWithVehicles = drivers.filter(driver => driver.hasVehicle && (driver.vehicleReg || (driver.vehicles && driver.vehicles.length > 0)));
  
  // Get job for the booking being re-assigned
  const bookingToReassign = bookings.find(b => b.id === reassignBookingId);
  const { data: relatedJob } = useJob(bookingToReassign?.jobId || null);

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

  // Include any bookings that don't match any status group (safety net)
  const allStatusesInGroups = new Set(statusGroups.flatMap(g => g.statuses));
  const ungroupedBookings = filteredBookings.filter(b => !allStatusesInGroups.has(b.status));
  if (ungroupedBookings.length > 0) {
    groupedBookings['Other'] = ungroupedBookings;
  }

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
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base mb-1">{booking.organisationName || booking.clientName}</CardTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-mono text-muted-foreground">{booking.bookingNumber}</p>
                                  <BookingTypeBadge 
                                    bookingType={booking.bookingType} 
                                    jmlSubType={booking.jmlSubType}
                                    size="sm"
                                  />
                                </div>
                              </div>
                              <Badge className={statusColor}>{statusLabel}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {booking.jmlSubType === 'mover' && booking.currentAddress ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <span className="truncate text-xs">From: {booking.currentSiteName || 'Current'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <span className="truncate text-xs">To: {booking.siteName}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{booking.siteName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(booking.scheduledDate).toLocaleDateString("en-GB")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Package className="h-4 w-4" />
                              <span>{booking.assets.reduce((sum, a) => sum + a.quantity, 0)} assets</span>
                            </div>
                            {booking.roundTripDistanceKm && booking.roundTripDistanceKm > 0 && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Route className="h-4 w-4" />
                                <span>
                                  Return Journey: {booking.roundTripDistanceMiles 
                                    ? `${booking.roundTripDistanceMiles.toFixed(1)} mi`
                                    : `${(booking.roundTripDistanceKm * 0.621371).toFixed(1)} mi`}
                                </span>
                              </div>
                            )}
                            {booking.preferredVehicleType && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Fuel className="h-4 w-4" />
                                <span>Preferred: {booking.preferredVehicleType.charAt(0).toUpperCase() + booking.preferredVehicleType.slice(1)}</span>
                              </div>
                            )}
                            {booking.driverName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Driver: {booking.driverName}</span>
                              </div>
                            )}
                            {/* Show Re-assign button only when booking is scheduled, has a job, and job status is 'routed' */}
                            {booking.status === 'scheduled' && booking.jobId && booking.jobStatus === 'routed' && (
                              <Button 
                                variant="outline" 
                                className="w-full mt-2" 
                                size="sm"
                                onClick={() => {
                                  setReassignBookingId(booking.id);
                                  setSelectedDriverId("");
                                }}
                                disabled={reassignDriver.isPending}
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Re-assign Driver
                              </Button>
                            )}
                            {booking.status === 'pending' && (
                              <Button variant="default" asChild className="w-full mt-2" size="sm">
                                <Link to={`/admin/booking-approval/${booking.id}`} className="text-inherit no-underline">
                                  Review & Approve
                                </Link>
                              </Button>
                            )}
                            {booking.status === 'created' && (
                              <Button variant="default" asChild className="w-full mt-2" size="sm">
                                <Link to={`/admin/assign?booking=${booking.id}`} className="text-inherit no-underline">
                                  <UserPlus />
                                  Assign Driver
                                </Link>
                              </Button>
                            )}
                            {booking.status === 'warehouse' && (
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
                                <Link to={`/admin/booking-approval/${booking.id}`} className="text-inherit no-underline">
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

      {/* Re-assign Driver Dialog */}
      <Dialog open={!!reassignBookingId} onOpenChange={(open) => !open && setReassignBookingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-assign Driver</DialogTitle>
            <DialogDescription>
              Select a new driver to assign to this job, or choose to unassign the current driver. The current driver will be notified of the change.
              Only jobs with status 'routed' can be re-assigned or unassigned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {relatedJob && relatedJob.status !== 'routed' && (
              <Alert variant="destructive">
                <AlertDescription>
                  Cannot re-assign driver. Job status must be 'routed' to re-assign. Current status: {relatedJob.status}
                </AlertDescription>
              </Alert>
            )}
            {relatedJob && relatedJob.driver && (
              <div className="space-y-2">
                <Label>Current Driver</Label>
                <div className="p-2 rounded-md bg-muted">
                  <p className="text-sm font-medium">{relatedJob.driver.name}</p>
                  {relatedJob.driver.vehicleReg && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Vehicle:</p>
                      <p className="text-xs text-muted-foreground font-mono">{relatedJob.driver.vehicleReg}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {relatedJob.driver.vehicleType} • {relatedJob.driver.vehicleFuelType}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newDriver">New Driver</Label>
              <Select 
                value={selectedDriverId} 
                onValueChange={setSelectedDriverId}
                disabled={!relatedJob || relatedJob.status !== 'routed'}
              >
                <SelectTrigger id="newDriver">
                  <SelectValue placeholder="Select a driver or unassign..." />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={5}>
                  <SelectItem value="unassign">
                    <div className="flex items-center gap-2 text-destructive">
                      <span>Unassign Driver</span>
                    </div>
                  </SelectItem>
                  {(() => {
                    // Get current driver and vehicle info
                    const currentDriverId = relatedJob?.driver?.id;
                    const currentVehicleReg = relatedJob?.driver?.vehicleReg;
                    
                    // Create separate entries for each driver-vehicle combination
                    // Exclude the current driver-vehicle combination
                    const driverVehicleCombinations: Array<{
                      driverId: string;
                      driverName: string;
                      vehicle: { id: string; vehicleReg: string; vehicleType: string; vehicleFuelType: string };
                    }> = [];
                    
                    driversWithVehicles.forEach((driver) => {
                      const driverVehicles = driver.vehicles && driver.vehicles.length > 0 
                        ? driver.vehicles 
                        : driver.vehicleReg 
                          ? [{ id: driver.vehicleId || '', vehicleReg: driver.vehicleReg, vehicleType: driver.vehicleType || 'van', vehicleFuelType: driver.vehicleFuelType || 'diesel' }]
                          : [];
                      
                      driverVehicles.forEach((vehicle) => {
                        // Exclude current driver-vehicle combination
                        const isCurrent = currentDriverId === driver.id && currentVehicleReg === vehicle.vehicleReg;
                        if (!isCurrent) {
                          driverVehicleCombinations.push({
                            driverId: driver.id,
                            driverName: driver.name,
                            vehicle,
                          });
                        }
                      });
                    });
                    
                    return driverVehicleCombinations.map((combo) => {
                      // Use vehicle.id if available, otherwise use a fallback
                      const vehicleId = combo.vehicle.id || combo.driverId;
                      const value = `${combo.driverId}:${vehicleId}`;
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex flex-col gap-1">
                            <span>{combo.driverName}</span>
                            <div className="text-xs text-muted-foreground">
                              {combo.vehicle.vehicleReg} - {combo.vehicle.vehicleType} {combo.vehicle.vehicleFuelType}
                            </div>
                          </div>
                        </SelectItem>
                      );
                    });
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReassignBookingId(null);
                setSelectedDriverId("");
              }}
              disabled={reassignDriver.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!relatedJob) {
                  toast.error("Job not found");
                  return;
                }

                if (relatedJob.status !== 'routed') {
                  toast.error("Can only re-assign/unassign driver when job status is 'routed'");
                  return;
                }

                if (selectedDriverId === 'unassign') {
                  // Unassign driver
                  reassignDriver.mutate(
                    { jobId: relatedJob.id, driverId: null },
                    {
                      onSuccess: () => {
                        toast.success("Driver unassigned successfully");
                        setReassignBookingId(null);
                        setSelectedDriverId("");
                      },
                      onError: (error) => {
                        toast.error("Failed to unassign driver", {
                          description: error instanceof Error ? error.message : "Please try again.",
                        });
                      },
                    }
                  );
                } else if (selectedDriverId) {
                  // Re-assign to new driver-vehicle combination
                  // Parse driverId:vehicleId format
                  const [driverId, vehicleId] = selectedDriverId.split(':');
                  reassignDriver.mutate(
                    { jobId: relatedJob.id, driverId, vehicleId },
                    {
                      onSuccess: () => {
                        toast.success("Driver re-assigned successfully");
                        setReassignBookingId(null);
                        setSelectedDriverId("");
                      },
                      onError: (error) => {
                        toast.error("Failed to re-assign driver", {
                          description: error instanceof Error ? error.message : "Please try again.",
                        });
                      },
                    }
                  );
                } else {
                  toast.error("Please select a driver or choose to unassign");
                }
              }}
              disabled={
                !selectedDriverId || 
                reassignDriver.isPending || 
                !relatedJob || 
                relatedJob.status !== 'routed' ||
                (selectedDriverId !== 'unassign' && selectedDriverId.split(':')[0] === relatedJob?.driver?.id)
              }
            >
              {reassignDriver.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {selectedDriverId === 'unassign' ? 'Unassigning...' : 'Re-assigning...'}
                </>
              ) : (
                selectedDriverId === 'unassign' ? 'Unassign Driver' : 'Re-assign Driver'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingQueue;

