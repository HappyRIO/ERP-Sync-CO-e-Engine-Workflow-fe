import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Package, Truck, Loader2, CheckCircle2, Shield, Award, FileCheck, User, Phone, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBooking } from "@/hooks/useBookings";
import { useJob } from "@/hooks/useJobs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStatusLabelExtended, getStatusColor } from "@/types/booking-lifecycle";
import type { BookingLifecycleStatus } from "@/types/booking-lifecycle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { Driver } from "@/types/jobs";
import { canDriverEditJob } from "@/utils/job-helpers";

// Driver vehicle information mapping (same as Assignment page)
const driverVehicleInfo: Record<string, { vehicleReg: string; vehicleType: 'van' | 'truck' | 'car'; vehicleFuelType: 'petrol' | 'diesel' | 'electric' }> = {
  'user-4': { vehicleReg: 'AB12 CDE', vehicleType: 'van', vehicleFuelType: 'diesel' }, // James Wilson
  'user-6': { vehicleReg: 'XY34 FGH', vehicleType: 'truck', vehicleFuelType: 'diesel' }, // Sarah Chen
  'user-7': { vehicleReg: 'CD56 IJK', vehicleType: 'truck', vehicleFuelType: 'diesel' }, // Mike Thompson
  'user-8': { vehicleReg: 'EF78 LMN', vehicleType: 'truck', vehicleFuelType: 'petrol' }, // Emma Davis
  'user-9': { vehicleReg: 'GH90 OPQ', vehicleType: 'van', vehicleFuelType: 'electric' }, // David Martinez
  'user-10': { vehicleReg: 'IJ12 RST', vehicleType: 'van', vehicleFuelType: 'petrol' }, // Lisa Anderson
};

const timelineSteps: { 
  status: BookingLifecycleStatus; 
  label: string; 
  icon: typeof CheckCircle2;
}[] = [
  { status: 'created', label: 'Created', icon: Package },
  { status: 'scheduled', label: 'Scheduled', icon: Calendar },
  { status: 'collected', label: 'Collected', icon: Truck },
  { status: 'sanitised', label: 'Sanitised', icon: Shield },
  { status: 'graded', label: 'Graded', icon: Award },
  { status: 'completed', label: 'Completed', icon: FileCheck },
];

const BookingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: booking, isLoading, error } = useBooking(id || null);
  const { data: relatedJob } = useJob(booking?.jobId || null);
  const [driverDetails, setDriverDetails] = useState<Driver | null>(null);

  // Fetch driver details if booking has driverId but no relatedJob driver
  useEffect(() => {
    const fetchDriverDetails = async () => {
      // Only fetch if we have driverId but no relatedJob driver
      if (booking?.driverId && !relatedJob?.driver) {
        try {
          const { mockExtendedUsers } = await import('@/mocks/mock-entities');
          const user = mockExtendedUsers?.find(u => u.id === booking.driverId);
          const vehicleInfo = driverVehicleInfo[booking.driverId];
          
          if (user && vehicleInfo) {
            setDriverDetails({
              id: booking.driverId,
              name: user.name || booking.driverName || 'Driver Name',
              vehicleReg: vehicleInfo.vehicleReg,
              vehicleType: vehicleInfo.vehicleType,
              vehicleFuelType: vehicleInfo.vehicleFuelType,
              phone: user.email || '+44 7700 900000',
            });
          } else if (booking.driverName) {
            // Fallback: create minimal driver info from booking data
            setDriverDetails({
              id: booking.driverId,
              name: booking.driverName,
              vehicleReg: vehicleInfo?.vehicleReg || 'XX00 XXX',
              vehicleType: vehicleInfo?.vehicleType || 'van',
              vehicleFuelType: vehicleInfo?.vehicleFuelType || 'diesel',
              phone: '+44 7700 900000',
            });
          }
        } catch (error) {
          console.error('Failed to fetch driver details:', error);
          // Fallback to minimal info
          if (booking.driverName) {
            setDriverDetails({
              id: booking.driverId,
              name: booking.driverName,
              vehicleReg: 'XX00 XXX',
              vehicleType: 'van',
              vehicleFuelType: 'diesel',
              phone: '+44 7700 900000',
            });
          }
        }
      } else {
        setDriverDetails(null);
      }
    };

    if (booking) {
      fetchDriverDetails();
    }
  }, [booking, relatedJob]);

  // Debug: Log cancellation notes to console (must be before early returns)
  useEffect(() => {
    if (booking && booking.status === 'cancelled') {
      console.log('Booking cancellation details:', {
        status: booking.status,
        cancellationNotes: booking.cancellationNotes,
        hasCancellationNotes: !!booking.cancellationNotes,
        bookingKeys: Object.keys(booking)
      });
    }
  }, [booking]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Booking not found</AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/bookings" className="text-inherit no-underline">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  const statusColor = getStatusColor(booking.status);
  const statusLabel = getStatusLabelExtended(booking.status);
  const totalAssets = booking.assets.reduce((sum, a) => sum + a.quantity, 0);
  
  // Use saved round trip distance from booking (calculated at creation)
  const roundTripDistanceKm = booking.roundTripDistanceKm || 0;
  const roundTripDistanceMiles = booking.roundTripDistanceMiles || 0;
  
  const isCancelled = booking.status === 'cancelled';
  const currentIndex = !isCancelled 
    ? timelineSteps.findIndex(step => step.status === booking.status)
    : -1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" asChild>
          <Link to="/bookings" className="text-inherit no-underline">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{booking.organisationName || booking.clientName}</h2>
          <p className="text-muted-foreground font-mono">{booking.bookingNumber}</p>
        </div>
        <Badge className={cn("text-sm", statusColor)}>{statusLabel}</Badge>
      </motion.div>

      {/* Horizontal Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Booking Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4">
            <div className="relative flex items-center justify-between">
              {/* Progress line background */}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2 mx-6" />
              
              {/* Progress line fill */}
              {!isCancelled && (
                <motion.div 
                  className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 mx-6"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(currentIndex / (timelineSteps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}

              {timelineSteps.map((step, index) => {
                const isCompleted = !isCancelled && index < currentIndex;
                const isCurrent = !isCancelled && index === currentIndex;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.status}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex flex-col items-center relative z-10"
                  >
                    {/* Icon */}
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all mb-2",
                      isCompleted || isCurrent
                        ? "border-primary bg-primary/10"
                        : "border-muted bg-muted"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Icon className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                      )}
                    </div>

                    {/* Label */}
                    <span className={cn(
                      "text-xs font-medium text-center mb-1",
                      (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>

                    {/* Status Badge */}
                    {isCurrent && (
                      <Badge className="bg-warning/20 text-warning text-xs px-2 py-0">
                        Current
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="outline" className="bg-success/10 text-success text-xs px-2 py-0">
                        Done
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
            
            {isCancelled && (
              <div className="mt-4 text-center">
                <Badge className="bg-destructive/10 text-destructive">Cancelled</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCancelled && booking.cancellationNotes && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    <p className="font-semibold mb-2">Cancellation Reason</p>
                    <p className="whitespace-pre-wrap">{booking.cancellationNotes}</p>
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{booking.siteName}</p>
                  <p className="text-sm text-muted-foreground">{booking.siteAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p className="font-medium">
                    {new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {roundTripDistanceKm > 0 && (
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Round Trip Mileage</p>
                    <p className="font-medium">
                      {roundTripDistanceMiles.toFixed(1)} miles ({roundTripDistanceKm.toFixed(1)} km)
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From collection site to warehouse and return
                    </p>
                  </div>
                </div>
              )}
              {booking.preferredVehicleType && (
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client Preferred Vehicle</p>
                    <p className="font-medium capitalize">{booking.preferredVehicleType}</p>
                  </div>
                </div>
              )}

              {(relatedJob?.driver || driverDetails) && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Driver Assignment</p>
                    {/* Only show Driver View button to driver role, and only if job is editable */}
                    {user?.role === 'driver' && relatedJob && canDriverEditJob(relatedJob) && relatedJob?.id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/driver/jobs/${relatedJob.id}`} className="text-inherit no-underline">
                          <Smartphone className="h-4 w-4 mr-2" />
                          Driver View
                        </Link>
                      </Button>
                    )}
                  </div>
                  {(() => {
                    const driver = relatedJob?.driver || driverDetails;
                    if (!driver) return null;
                    return (
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{driver.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{driver.vehicleReg}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{driver.phone}</span>
                        </div>
                        {driver.vehicleType && (
                          <Badge variant="outline" className="text-xs">
                            {driver.vehicleType}
                            {driver.vehicleFuelType && ` • ${driver.vehicleFuelType}`}
                          </Badge>
                        )}
                        {driver.eta && (
                          <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                            ETA: {driver.eta}
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.assets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{asset.categoryName}</span>
                    </div>
                    <Badge variant="secondary">{asset.quantity} units</Badge>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Assets</span>
                    <span className="font-bold text-lg">{totalAssets}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Driver Card */}
          {(relatedJob?.driver || driverDetails) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Driver Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Driver Details</p>
                    {user?.role === 'driver' && relatedJob && canDriverEditJob(relatedJob) && relatedJob?.id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/driver/jobs/${relatedJob.id}`} className="text-inherit no-underline">
                          <Smartphone className="h-4 w-4 mr-2" />
                          Driver View
                        </Link>
                      </Button>
                    )}
                  </div>
                  {(() => {
                    const driver = relatedJob?.driver || driverDetails;
                    if (!driver) return null;
                    return (
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{driver.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{driver.vehicleReg}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{driver.phone}</span>
                        </div>
                        {driver.vehicleType && (
                          <Badge variant="outline" className="text-xs">
                            {driver.vehicleType}
                            {driver.vehicleFuelType && ` • ${driver.vehicleFuelType}`}
                          </Badge>
                        )}
                        {driver.eta && (
                          <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                            ETA: {driver.eta}
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Estimated CO₂e Saved</p>
                <p className="text-2xl font-bold text-success">
                  {(booking.estimatedCO2e / 1000).toFixed(1)}t
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Buyback Value</p>
                <p className="text-2xl font-bold">£{booking.estimatedBuyback.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Charity Donation</p>
                <p className="text-lg font-semibold">{booking.charityPercent}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(booking.status === 'sanitised' || booking.status === 'graded' || booking.status === 'completed') && (
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/bookings/${id}/certificates`} className="text-inherit no-underline">
                    View Certificates
                  </Link>
                </Button>
              )}
              {(booking.status === 'graded' || booking.status === 'completed') && (
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/bookings/${id}/grading`} className="text-inherit no-underline">
                    View Grading Report
                  </Link>
                </Button>
              )}
              {booking.status === 'completed' && (
                <Button variant="default" asChild className="w-full">
                  <Link to={`/bookings/${id}/summary`} className="text-inherit no-underline">
                    View Completion Summary
                  </Link>
                </Button>
              )}
              {booking.jobId && (
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/jobs/${booking.jobId}`} className="text-inherit no-underline">
                    View Related Job
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;

