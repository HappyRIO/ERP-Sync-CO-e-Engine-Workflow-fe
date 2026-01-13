import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, UserPlus, Truck, Calendar, MapPin, Package, Loader2, CheckCircle2, Car, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBooking, useAssignDriver } from "@/hooks/useBookings";
import { useDrivers } from "@/hooks/useDrivers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import type { BookingLifecycleStatus } from "@/types/booking-lifecycle";
import { calculateRoundTripDistance, geocodePostcode, kmToMiles } from "@/lib/calculations";

const Assignment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking");

  const { data: booking, isLoading: isLoadingBooking } = useBooking(bookingId);
  const { data: drivers = [], isLoading: isLoadingDrivers } = useDrivers();
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [roundTripDistanceKm, setRoundTripDistanceKm] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const assignMutation = useAssignDriver();
  
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const selectedDriverVehicle = selectedDriver ? {
    vehicleReg: selectedDriver.vehicleReg,
    vehicleType: selectedDriver.vehicleType,
    vehicleFuelType: selectedDriver.vehicleFuelType,
  } : null;
  
  const assignedDriver = booking?.driverId ? drivers.find(d => d.id === booking.driverId) : null;
  const assignedDriverVehicle = assignedDriver ? {
    vehicleReg: assignedDriver.vehicleReg,
    vehicleType: assignedDriver.vehicleType,
    vehicleFuelType: assignedDriver.vehicleFuelType,
  } : null;

  // Set selected driver if booking already has one
  useEffect(() => {
    if (booking?.driverId) {
      setSelectedDriverId(booking.driverId);
    }
  }, [booking]);

  // Use stored round trip distance from booking, or calculate if not available
  useEffect(() => {
    const calculateDistance = async () => {
      // First, check if booking already has stored distance (preferred)
      if (booking?.roundTripDistanceKm && booking.roundTripDistanceKm > 0) {
        setRoundTripDistanceKm(booking.roundTripDistanceKm);
        setIsCalculatingDistance(false);
        return;
      }
      
      // If no stored distance, try to calculate from coordinates
      if (booking?.lat && booking?.lng) {
        setIsCalculatingDistance(true);
        try {
          const distanceKm = await calculateRoundTripDistance(booking.lat, booking.lng);
          setRoundTripDistanceKm(distanceKm);
        } catch (error) {
          console.error('Error calculating road distance from coordinates:', error);
          // Fallback: try postcode geocoding
          if (booking.siteAddress) {
            try {
              const postcodeMatch = booking.siteAddress.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/i);
              if (postcodeMatch) {
                const postcode = postcodeMatch[0].replace(/\s+/g, ' ').trim().toUpperCase();
                const coordinates = await geocodePostcode(postcode);
                if (coordinates) {
                  const distanceKm = await calculateRoundTripDistance(coordinates.lat, coordinates.lng);
                  setRoundTripDistanceKm(distanceKm);
                  return;
                }
              }
            } catch (geocodeError) {
              console.error('Error geocoding postcode:', geocodeError);
            }
          }
          // Final fallback: use default distance estimate
          setRoundTripDistanceKm(80); // Default 80km round trip
        } finally {
          setIsCalculatingDistance(false);
        }
        return;
      }
      
      // If no coordinates, try to geocode from postcode in address
      if (booking?.siteAddress) {
        setIsCalculatingDistance(true);
        try {
          // Extract postcode from address (UK postcode format: e.g., "SW1A 1AA", "M1 1AA", "B33 8TH")
          // Pattern matches: 1-2 letters, 1-2 digits, optional letter, space, digit, 2 letters
          const postcodeMatch = booking.siteAddress.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/i);
          if (postcodeMatch) {
            const postcode = postcodeMatch[0].replace(/\s+/g, ' ').trim().toUpperCase();
            const coordinates = await geocodePostcode(postcode);
            if (coordinates) {
              const distanceKm = await calculateRoundTripDistance(coordinates.lat, coordinates.lng);
              setRoundTripDistanceKm(distanceKm);
              setIsCalculatingDistance(false);
              return;
            }
          }
          // No postcode found or geocoding failed, use default
          setRoundTripDistanceKm(80); // Default 80km round trip
        } catch (error) {
          console.error('Failed to calculate distance:', error);
          setRoundTripDistanceKm(80); // Fallback to default
        } finally {
          setIsCalculatingDistance(false);
        }
        return;
      }
      
      // No booking data available, use default
      setRoundTripDistanceKm(80); // Default fallback
      setIsCalculatingDistance(false);
    };

    if (booking) {
      calculateDistance();
    }
  }, [booking]);

  const handleAssign = () => {
    if (!bookingId || !selectedDriverId) {
      toast.error("Please select a driver");
      return;
    }

    if (booking?.status !== 'created') {
      toast.error("Only bookings in 'created' status can be assigned");
      return;
    }

    assignMutation.mutate(
      { bookingId, driverId: selectedDriverId },
      {
        onSuccess: () => {
          toast.success("Driver assigned successfully!", {
            description: "Booking has been scheduled and driver has been notified.",
          });
          navigate("/admin/bookings");
        },
        onError: (error) => {
          toast.error("Failed to assign driver", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  if (isLoadingBooking) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Booking not found</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/admin/bookings")}>Back to Booking Queue</Button>
      </div>
    );
  }

  if (booking.status !== 'created' && booking.status !== 'scheduled') {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            This booking cannot be assigned. Only bookings in "created" status can be assigned a driver.
            Current status: {booking.status}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/admin/bookings")}>Back to Booking Queue</Button>
      </div>
    );
  }

  const totalAssets = booking.assets.reduce((sum, a) => sum + a.quantity, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/bookings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assign Driver</h2>
          <p className="text-muted-foreground">Schedule booking and assign driver for collection</p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Booking Number</p>
                <p className="font-mono">{booking.bookingNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-semibold">{booking.organisationName || booking.clientName}</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Site</p>
                  <p>{booking.siteName}</p>
                  <p className="text-sm text-muted-foreground">{booking.siteAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Date</p>
                  <p>{new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assets</p>
                  <p>{totalAssets} items</p>
                  <div className="text-sm text-muted-foreground mt-1">
                    {booking.assets.map(a => `${a.quantity}x ${a.categoryName}`).join(", ")}
                  </div>
                </div>
              </div>
              {roundTripDistanceKm !== null && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Round Trip Mileage</p>
                    {isCalculatingDistance ? (
                      <p className="text-sm text-muted-foreground">Calculating...</p>
                    ) : (
                      <p className="font-semibold">
                        {kmToMiles(roundTripDistanceKm).toFixed(1)} miles ({roundTripDistanceKm.toFixed(1)} km)
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From collection site to warehouse and return
                    </p>
                  </div>
                </div>
              )}
              {booking.preferredVehicleType && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client Preferred Vehicle</p>
                    <p className="font-semibold capitalize">{booking.preferredVehicleType}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please assign a driver with a {booking.preferredVehicleType} vehicle if available
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignment Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Driver Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.driverName ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Currently Assigned</p>
                  <div className="p-3 rounded-lg bg-muted space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="font-medium">{booking.driverName}</span>
                    </div>
                    {assignedDriverVehicle && (
                      <div className="flex items-center gap-2 pt-2 border-t border-muted-foreground/20">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="font-medium">{assignedDriverVehicle.vehicleType.charAt(0).toUpperCase() + assignedDriverVehicle.vehicleType.slice(1)}</p>
                          <p className="text-muted-foreground font-mono">{assignedDriverVehicle.vehicleReg}</p>
                          <p className="text-xs text-muted-foreground capitalize">{assignedDriverVehicle.vehicleFuelType}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Booking is already scheduled. To change driver, contact support.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="driver">Select Driver</Label>
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger id="driver">
                        <SelectValue placeholder="Choose a driver..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingDrivers ? (
                          <SelectItem value="loading" disabled>Loading drivers...</SelectItem>
                        ) : drivers.length === 0 ? (
                          <SelectItem value="none" disabled>No drivers available</SelectItem>
                        ) : (
                          drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              <div className="flex items-center gap-2">
                                <span>{driver.name}</span>
                                {driver.hasProfile && (
                                  <span className="text-xs text-muted-foreground">
                                    ({driver.vehicleReg} - {driver.vehicleType} {driver.vehicleFuelType})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {drivers.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No active drivers found. Please add drivers in user management.
                      </p>
                    )}
                  </div>
                  
                  {selectedDriver && selectedDriverVehicle && (
                    <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/50 border border-muted space-y-2">
                      <p className="text-sm font-medium">Driver Information</p>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedDriver.name}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-muted-foreground/20">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="font-medium">{selectedDriverVehicle.vehicleType.charAt(0).toUpperCase() + selectedDriverVehicle.vehicleType.slice(1)}</p>
                          <p className="text-muted-foreground font-mono">{selectedDriverVehicle.vehicleReg}</p>
                            <p className="text-xs text-muted-foreground capitalize">{selectedDriverVehicle.vehicleFuelType}</p>
                        </div>
                      </div>
                      </div>
                      
                      {/* Vehicle Mismatch Warning */}
                      {booking.preferredVehicleType && 
                       booking.preferredVehicleType !== selectedDriverVehicle.vehicleFuelType && (
                        <Alert className="bg-warning/10 border-warning/20">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <AlertDescription className="text-sm">
                            <strong>Vehicle Type Mismatch:</strong> Client preferred {booking.preferredVehicleType} vehicle, 
                            but selected driver has {selectedDriverVehicle.vehicleFuelType} vehicle. 
                            Consider assigning a driver with a {booking.preferredVehicleType} vehicle if available.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  <Button
                    variant="default"
                    onClick={handleAssign}
                    disabled={!selectedDriverId || assignMutation.isPending}
                    className="w-full"
                  >
                    {assignMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 />
                        Assign & Schedule
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will change booking status to "scheduled" and notify the driver.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Assignment;

