import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Package, Truck, Route, Fuel, Loader2, CheckCircle2, Shield, Award, FileCheck, User, Phone, Smartphone, Warehouse, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBooking } from "@/hooks/useBookings";
import { useJob } from "@/hooks/useJobs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStatusLabelExtended, getStatusColor, getStatusLabel } from "@/types/booking-lifecycle";
import type { BookingLifecycleStatus } from "@/types/booking-lifecycle";
import { BookingTypeBadge } from "@/components/bookings/BookingTypeBadge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { canDriverEditJob } from "@/utils/job-helpers";
import { useDriver } from "@/hooks/useDrivers";
import type { Driver } from "@/types/jobs";
import { useMemo } from "react";

// Helper function to get timeline steps based on booking type
function getTimelineSteps(
  bookingType?: 'itad_collection' | 'jml',
  jmlSubType?: 'new_starter' | 'leaver' | 'breakfix' | 'mover' | null
): { 
  status: BookingLifecycleStatus; 
  label: string; 
  icon: typeof CheckCircle2;
}[] {
  // ITAD workflow
  if (!bookingType || bookingType === 'itad_collection') {
    return [
      { status: 'created', label: 'Created', icon: Package },
      { status: 'scheduled', label: 'Scheduled', icon: Calendar },
      { status: 'collected', label: 'Collected', icon: Truck },
      { status: 'warehouse', label: 'At Warehouse', icon: Warehouse },
      { status: 'sanitised', label: 'Sanitised', icon: Shield },
      { status: 'graded', label: 'Graded', icon: Award },
      { status: 'completed', label: 'Completed', icon: FileCheck },
    ];
  }

  // JML workflows
  if (bookingType === 'jml') {
    if (jmlSubType === 'new_starter') {
      // New-starter: created → device_allocated → courier_booked → dispatched → delivered → completed
      return [
        { status: 'created', label: 'Created', icon: Package },
        { status: 'device_allocated', label: 'Device Allocated', icon: Package },
        { status: 'courier_booked', label: 'Courier Booked', icon: Calendar },
        { status: 'dispatched', label: 'Dispatched', icon: Truck },
        { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
        { status: 'completed', label: 'Completed', icon: FileCheck },
      ];
    } else if (jmlSubType === 'leaver') {
      // Leaver: created → collection_scheduled → collected → warehouse → sanitised → graded → inventory → completed
      return [
        { status: 'created', label: 'Created', icon: Package },
        { status: 'collection_scheduled', label: 'Collection Scheduled', icon: Calendar },
        { status: 'collected', label: 'Collected', icon: Truck },
        { status: 'warehouse', label: 'At Warehouse', icon: Warehouse },
        { status: 'sanitised', label: 'Sanitised', icon: Shield },
        { status: 'graded', label: 'Graded', icon: Award },
        { status: 'inventory', label: 'Inventory', icon: Package },
        { status: 'completed', label: 'Completed', icon: FileCheck },
      ];
    } else if (jmlSubType === 'mover') {
      // Mover: Leaver first (collect old), then New Starter (deliver new)
      // created → collection_scheduled → collected → warehouse → inventory → device_allocated → courier_booked → dispatched → delivered → completed
      return [
        { status: 'created', label: 'Created', icon: Package },
        { status: 'collection_scheduled', label: 'Collection Scheduled', icon: Calendar },
        { status: 'collected', label: 'Collected', icon: Truck },
        { status: 'warehouse', label: 'At Warehouse', icon: Warehouse },
        { status: 'inventory', label: 'Inventory', icon: Package },
        { status: 'device_allocated', label: 'Device Allocated', icon: Package },
        { status: 'courier_booked', label: 'Courier Booked', icon: Calendar },
        { status: 'dispatched', label: 'Dispatched', icon: Truck },
        { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
        { status: 'completed', label: 'Completed', icon: FileCheck },
      ];
    } else if (jmlSubType === 'breakfix') {
      // Breakfix: New Starter first (deliver replacement), then Leaver (collect broken)
      // created → device_allocated → courier_booked → dispatched → delivered → collected → warehouse → sanitised → graded → inventory → completed
      return [
        { status: 'created', label: 'Created', icon: Package },
        { status: 'device_allocated', label: 'Replacement Allocated', icon: Package },
        { status: 'courier_booked', label: 'Courier Booked', icon: Calendar },
        { status: 'dispatched', label: 'Dispatched', icon: Truck },
        { status: 'delivered', label: 'Replacement Delivered', icon: CheckCircle2 },
        { status: 'collected', label: 'Broken Device Collected', icon: Truck },
        { status: 'warehouse', label: 'At Warehouse', icon: Warehouse },
        { status: 'sanitised', label: 'Sanitised', icon: Shield },
        { status: 'graded', label: 'Graded', icon: Award },
        { status: 'inventory', label: 'Inventory', icon: Package },
        { status: 'completed', label: 'Completed', icon: FileCheck },
      ];
    }
  }

  // Default to ITAD if unknown
  return [
    { status: 'created', label: 'Created', icon: Package },
    { status: 'scheduled', label: 'Scheduled', icon: Calendar },
    { status: 'collected', label: 'Collected', icon: Truck },
    { status: 'warehouse', label: 'At Warehouse', icon: Warehouse },
    { status: 'sanitised', label: 'Sanitised', icon: Shield },
    { status: 'graded', label: 'Graded', icon: Award },
    { status: 'completed', label: 'Completed', icon: FileCheck },
  ];
}

const BookingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: booking, isLoading, error } = useBooking(id || null);
  const { data: relatedJob } = useJob(booking?.jobId || null);
  // Fetch driver details if booking has driverId but no relatedJob driver
  const { data: driverDetailsData } = useDriver(
    booking?.driverId && !relatedJob?.driver ? booking.driverId : null
  );
  
  // Transform driverDetailsData to match the Driver type expected by the component (from jobs.ts)
  const driverDetails: Driver | null = driverDetailsData ? {
    id: driverDetailsData.id,
    name: driverDetailsData.name,
    vehicleReg: driverDetailsData.vehicleReg || 'N/A',
    vehicleType: (driverDetailsData.vehicleType || 'van') as 'van' | 'truck' | 'car',
    vehicleFuelType: (driverDetailsData.vehicleFuelType || 'diesel') as 'petrol' | 'diesel' | 'electric',
    phone: driverDetailsData.phone || '',
    // eta is optional and not available from driver service
  } : null;

  // Get timeline steps based on booking type - MUST be called before conditional returns
  const timelineSteps = useMemo(
    () => getTimelineSteps(booking?.bookingType, booking?.jmlSubType),
    [booking?.bookingType, booking?.jmlSubType]
  );

  // Extract device details from status history notes - MUST be called before conditional returns
  const deviceDetailsMap = useMemo(() => {
    const map = new Map<string, { make: string; model: string; deviceType?: string }>();
    
    if (!booking) return map;
    
    // Type assertion: statusHistory exists in API response but not in type definition
    const statusHistory = (booking as any).statusHistory as Array<{
      id: string;
      status: string;
      changedBy?: string;
      notes?: string;
      createdAt: string;
    }> | undefined;
    
    if (statusHistory && statusHistory.length > 0) {
      const creationHistory = statusHistory.find(h => 
        h.notes && h.notes.includes('Device details:')
      );
      
      if (creationHistory && creationHistory.notes) {
        try {
          const deviceDetailsMatch = creationHistory.notes.match(/Device details: (\[.*\])/);
          if (deviceDetailsMatch) {
            const deviceDetails = JSON.parse(deviceDetailsMatch[1]);
            deviceDetails.forEach((device: any) => {
              // Use category name as key, store device info
              map.set(device.category, {
                make: device.make,
                model: device.model,
                deviceType: device.deviceType,
              });
            });
          }
        } catch (error) {
          // If parsing fails, return empty map
          console.error('Failed to parse device details from status history:', error);
        }
      }
    }
    
    return map;
  }, [booking]);

  // Helper function to check if Device Type should be shown for a category
  const shouldShowDeviceType = (category: string): boolean => {
    const categoryLower = category.toLowerCase();
    // Only show Device Type for categories where Windows/Apple distinction is meaningful
    // Hide for: Smart Phones, Tablets, Networking, Server, Storage (these don't use Windows/Apple)
    return categoryLower.includes('laptop') || categoryLower.includes('desktop');
  };

  // Enrich assets with device details - MUST be called before conditional returns
  const enrichedAssets = useMemo(() => {
    if (!booking?.assets) return [];
    return booking.assets.map(asset => {
      const deviceInfo = deviceDetailsMap.get(asset.categoryName);
      const showDeviceType = shouldShowDeviceType(asset.categoryName);
      return {
        ...asset,
        deviceMake: deviceInfo?.make,
        deviceModel: deviceInfo?.model,
        deviceType: showDeviceType ? deviceInfo?.deviceType : undefined,
      };
    });
  }, [booking?.assets, deviceDetailsMap]);

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
  
  const roundTripDistanceKm = booking.roundTripDistanceKm || 0;
  const roundTripDistanceMiles = booking.roundTripDistanceMiles || 0;
  
  const isCancelled = booking.status === 'cancelled';
  const currentIndex = !isCancelled 
    ? timelineSteps.findIndex(step => step.status === booking.status)
    : -1;

  const totalSteps = timelineSteps.length;
  // We use a small offset to account for icon width, then interpolate
  const iconCenterOffset = 2.5; // Approximate offset for icon center (2.5% works for most screen sizes)
  
  const progressPercent = !isCancelled && currentIndex >= 0
    ? totalSteps === 1
      ? 100
      : currentIndex === 0
      ? iconCenterOffset // First icon center
      : currentIndex === totalSteps - 1
      ? 100 // Last icon: line goes full width
      : iconCenterOffset + (currentIndex / (totalSteps - 1)) * (100 - 2 * iconCenterOffset)
    : 0;

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
          <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold text-foreground">{booking.organisationName || booking.clientName}</h2>
            <BookingTypeBadge 
              bookingType={booking.bookingType} 
              jmlSubType={booking.jmlSubType}
              size="sm"
            />
          </div>
          <p className="text-muted-foreground font-mono">{booking.bookingNumber}</p>
        </div>
        <Badge className={cn("text-sm", statusColor)}>{statusLabel}</Badge>
      </motion.div>

      {/* Booking Progress Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Booking Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4">
            {/* Mobile: Vertical Timeline */}
            <div className="md:hidden">
              <div className="relative flex flex-col">
                {/* Full height background line */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
              
                {/* Progress line - ends at center of current icon */}
                {!isCancelled && currentIndex >= 0 && (() => {
                  const totalSteps = timelineSteps.length;
                  return (
                <motion.div 
                      className="absolute left-5 w-0.5 bg-primary"
                      initial={{ height: "0%" }}
                      animate={{ 
                        height: currentIndex === 0 
                          ? '0px'
                          : currentIndex === totalSteps - 1
                          ? 'calc(100% - 20px)' // Full height minus top offset
                          : `calc(${((currentIndex + 0.5) / totalSteps) * 100}% - 20px)` // To center of current icon
                      }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ top: '20px' }} // Start from center of first icon
                />
                  );
                })()}

              {timelineSteps.map((step, index) => {
                const isCompleted = !isCancelled && index < currentIndex;
                const isCurrent = !isCancelled && index === currentIndex;
                const Icon = step.icon;

                  return (
                    <motion.div
                      key={step.status}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative flex items-start gap-3 pb-6 last:pb-0"
                    >
                      {/* Icon with solid background to cover line */}
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all flex-shrink-0 relative z-10",
                        isCompleted || isCurrent
                          ? "border-primary bg-background"
                          : "border-muted bg-background"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Icon className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-sm font-medium",
                            (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </span>
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
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Horizontal Timeline */}
            <div className="hidden md:block">
              <div className="relative flex items-center justify-between">
                {timelineSteps.map((step, index) => {
                  const isCompleted = !isCancelled && index < currentIndex;
                  const isCurrent = !isCancelled && index === currentIndex;
                  const Icon = step.icon;
                  const isLast = index === timelineSteps.length - 1;

                return (
                  <motion.div
                    key={step.status}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex flex-col items-center relative z-10 flex-1"
                  >
                      {/* Horizontal line connector - connects through center of icons */}
                      {!isLast && (
                        <div 
                          className={cn(
                            "absolute top-1/2 h-0.5 -translate-y-1/2",
                            isCompleted
                              ? "bg-primary" 
                              : isCurrent
                              ? "bg-primary"
                              : "bg-border"
                          )}
                          style={{
                            left: '50%', // Start from center of current icon
                            right: 'calc(-50%)', // End at center of next icon (extend into next flex item)
                            zIndex: 0
                          }}
                        />
                      )}
                      
                      {/* Icon with solid background to cover line */}
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all mb-2 relative z-10",
                      isCompleted || isCurrent
                          ? "border-primary bg-background"
                          : "border-muted bg-background"
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

              {/* JML Employee Details (match style of site details for ITAD) */}
              {booking.bookingType === 'jml' && booking.employeeName && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employee</p>
                    <p className="font-medium">{booking.employeeName}</p>
                    {(booking.employeeEmail || booking.employeePhone) && (
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        {booking.employeeEmail && (
                          <span>{booking.employeeEmail}</span>
                        )}
                        {booking.employeePhone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.employeePhone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Site details (ITAD and JML) */}
              {booking.jmlSubType === 'mover' && booking.currentAddress ? (
                <>
                  {/* Current Address (From) */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">From (Collection)</p>
                      <p className="font-medium">{booking.currentSiteName || 'Current Address'}</p>
                      <p className="text-sm text-muted-foreground">{booking.currentAddress}</p>
                      {booking.currentPostcode && (
                        <p className="text-xs text-muted-foreground mt-0.5">{booking.currentPostcode}</p>
                      )}
                    </div>
                  </div>
                  {/* New Address (To) */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">To (Delivery)</p>
                      <p className="font-medium">{booking.siteName}</p>
                      <p className="text-sm text-muted-foreground">{booking.siteAddress}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{booking.siteName}</p>
                    <p className="text-sm text-muted-foreground">{booking.siteAddress}</p>
                  </div>
                </div>
              )}
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
                  <Route className="h-5 w-5 text-muted-foreground" />
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
                  <Fuel className="h-5 w-5 text-muted-foreground" />
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
                          <span className="font-mono">{driver.vehicleReg || 'N/A'}</span>
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
                        {(relatedJob?.status === "routed" || relatedJob?.status === "en-route") && (
                          <Badge 
                            variant="secondary" 
                            className={driver.isEtaDelayed 
                              ? "bg-destructive/20 text-destructive border-destructive/50" 
                              : "bg-warning/20 text-warning-foreground"
                            }
                          >
                            ETA: {driver.eta || "--:--"}
                            {driver.isEtaDelayed && " (Delayed)"}
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
                {enrichedAssets.map((asset, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{asset.categoryName}</span>
                      </div>
                      <Badge variant="secondary">{asset.quantity} units</Badge>
                    </div>
                    {/* Device details (if available) */}
                    {asset.deviceMake || asset.deviceModel ? (
                      <div className="pl-7 text-xs text-muted-foreground flex flex-wrap gap-x-1">
                        {asset.deviceMake && <span>{asset.deviceMake}</span>}
                        {asset.deviceModel && (
                          <>
                            {asset.deviceMake && <span>•</span>}
                            <span>{asset.deviceModel}</span>
                          </>
                        )}
                        {asset.deviceType && (
                          <>
                            {(asset.deviceMake || asset.deviceModel) && <span>•</span>}
                            <span>{asset.deviceType}</span>
                          </>
                        )}
                      </div>
                    ) : null}
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
                          <span className="font-mono">{driver.vehicleReg || 'N/A'}</span>
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
                        {(relatedJob?.status === "routed" || relatedJob?.status === "en-route") && (
                          <Badge 
                            variant="secondary" 
                            className={driver.isEtaDelayed 
                              ? "bg-destructive/20 text-destructive border-destructive/50" 
                              : "bg-warning/20 text-warning-foreground"
                            }
                          >
                            ETA: {driver.eta || "--:--"}
                            {driver.isEtaDelayed && " (Delayed)"}
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
                <p className="text-lg font-semibold">{booking.charityPercent ?? 0}%</p>
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

