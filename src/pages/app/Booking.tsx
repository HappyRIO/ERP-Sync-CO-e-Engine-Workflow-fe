import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Package, 
  Calculator, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Leaf,
  Truck,
  TreeDeciduous,
  Heart,
  Calendar,
  MapPin,
  Search,
  Loader2,
  Zap,
  Fuel,
  PoundSterling
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/booking/DatePicker";
import { MapPicker } from "@/components/booking/MapPicker";
import { AddressAutocomplete } from "@/components/booking/AddressAutocomplete";
import { co2eEquivalencies } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSites } from "@/hooks/useSites";
import { useClients } from "@/hooks/useClients";
import { useAssetCategories } from "@/hooks/useAssets";
import { useCO2Calculation } from "@/hooks/useCO2";
import { useCreateBooking } from "@/hooks/useBooking";
import { geocodePostcode } from "@/lib/calculations";
import type { Site } from "@/services/site.service";

const steps = [
  { id: 1, title: "Site Details", icon: Building2 },
  { id: 2, title: "Assets", icon: Package },
  { id: 3, title: "Review & Submit", icon: Calculator },
];

interface AssetSelection {
  categoryId: string;
  quantity: number;
}

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<string>(""); // For resellers: selected client
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [siteLocation, setSiteLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("new"); // Default to "Create New Site"
  const [siteDetails, setSiteDetails] = useState({
    siteName: "",
    street: "",
    city: "",
    county: "",
    postcode: "",
    country: "United Kingdom",
    contactName: "",
    contactPhone: "",
  });
  const [selectedAssets, setSelectedAssets] = useState<AssetSelection[]>([]);
  const [charityPercent, setCharityPercent] = useState(10);
  const [selectedVehicleType, setSelectedVehicleType] = useState<'petrol' | 'diesel' | 'electric'>('petrol');

  // Load clients (for resellers and admin)
  const { data: clients = [], isLoading: isLoadingClients } = useClients({ status: 'active' });
  
  // Load sites (for client role only - resellers create bookings for clients, so they enter site details manually)
  const { data: sites = [], isLoading: isLoadingSites } = useSites();
  const { data: assetCategories = [] } = useAssetCategories();
  const createBooking = useCreateBooking();
  
  const isReseller = user?.role === 'reseller';
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';
  
  // Calculate CO2e when assets change
  // Use memoized request object to prevent unnecessary query key changes
  // If location isn't set yet, use a default location for calculations
  const co2CalculationRequest = useMemo(() => {
    if (selectedAssets.length === 0) return null;
    
    // Use actual coordinates if available, otherwise use default (will show as estimated)
    const coordinates = siteLocation || { lat: 51.5074, lng: -0.1278 }; // Default London coordinates
    
    return {
      assets: selectedAssets,
      collectionCoordinates: coordinates,
      vehicleType: selectedVehicleType,
    };
  }, [selectedAssets, siteLocation, selectedVehicleType]);

  const { data: co2Calculation, isLoading: isCalculatingCO2, isFetching: isFetchingCO2 } = useCO2Calculation(co2CalculationRequest);

  // Set default site on mount (only if sites exist and we're still on 'new')
  useEffect(() => {
    if (sites.length > 0 && selectedSiteId === 'new') {
      const defaultSite = sites.find(s => s.isDefault);
      if (defaultSite) {
        // Don't auto-select, let user choose
        // Keep "Create New Site" as default
      }
    }
  }, [sites, selectedSiteId]);

  const handleSiteSelect = (siteId: string) => {
    if (siteId === 'new') {
      // Reset form for new site
      setSelectedSiteId('new');
      setSiteDetails({
        siteName: "",
        street: "",
        city: "",
        county: "",
        postcode: "",
        country: "United Kingdom",
        contactName: "",
        contactPhone: "",
      });
      setSiteLocation(null);
      return;
    }

    const site = sites.find(s => s.id === siteId);
    if (site) {
      setSelectedSiteId(siteId);
      // Use site fields directly - Site interface has separate address, city, and postcode fields
      setSiteDetails({
        siteName: site.name,
        street: site.address || "", // Use address as street
        city: site.city || "", // Use city field directly
        county: "", // County not stored in Site, leave empty
        postcode: site.postcode || "",
        country: "United Kingdom",
        contactName: site.contactName || "",
        contactPhone: site.contactPhone || "",
      });
      if (site.coordinates) {
        setSiteLocation(site.coordinates);
      } else if (site.postcode) {
        // Geocode postcode if coordinates not available
        geocodePostcode(site.postcode).then(coords => {
          if (coords) {
            setSiteLocation(coords);
          }
        }).catch(() => {
          // Silently fail if geocoding fails
        });
      }
    }
  };

  const updateAssetQuantity = (categoryId: string, delta: number) => {
    setSelectedAssets((prev) => {
      const existing = prev.find((a) => a.categoryId === categoryId);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) {
          return prev.filter((a) => a.categoryId !== categoryId);
        }
        return prev.map((a) =>
          a.categoryId === categoryId ? { ...a, quantity: newQty } : a
        );
      } else if (delta > 0) {
        return [...prev, { categoryId, quantity: delta }];
      }
      return prev;
    });
  };

  const getAssetQuantity = (categoryId: string) => {
    return selectedAssets.find((a) => a.categoryId === categoryId)?.quantity || 0;
  };

  const totalAssets = selectedAssets.reduce((sum, a) => sum + a.quantity, 0);
  
  // Calculate buyback estimate using asset categories from service
  const buybackEstimate = assetCategories.length > 0
    ? selectedAssets.reduce((total, asset) => {
        const category = assetCategories.find(c => c.id === asset.categoryId);
        return total + (category?.avgBuybackValue || 0) * asset.quantity;
      }, 0)
    : 0;

  // Use CO2 calculation from service (useCO2Calculation hook)
  // Use nullish coalescing to keep previous values during refetch (placeholderData handles this)
  const co2eSaved = co2Calculation?.reuseSavings ?? 0;
  const travelEmissions = co2Calculation?.travelEmissions ?? 0;
  const netCO2e = co2Calculation?.netImpact ?? 0;
  const distanceKm = co2Calculation?.distanceKm ?? 0;
  const distanceMiles = co2Calculation?.distanceMiles ?? 0;
  const vehicleEmissions = co2Calculation?.vehicleEmissions ?? {
    petrol: 0,
    diesel: 0,
    electric: 0,
  };

  // Calculate estimated cost of collection and processing
  // TODO: Replace with actual calculation formula when provided by client
  // This is a placeholder calculation based on distance and asset count
  const calculateEstimatedCost = (): number => {
    if (distanceKm === 0 || totalAssets === 0) return 0;
    
    // Placeholder calculation:
    // Base cost + distance-based cost + processing cost per asset
    const baseCost = 50; // Base collection fee
    const distanceCost = distanceKm * 0.5; // £0.50 per km (round trip)
    const processingCostPerAsset = 2; // £2 per asset for processing
    const totalProcessingCost = totalAssets * processingCostPerAsset;
    
    return baseCost + distanceCost + totalProcessingCost;
  };
  
  const estimatedCost = calculateEstimatedCost();

  const canProceed = () => {
    if (currentStep === 1) {
      // For resellers and admin, require client selection
      if ((isReseller || isAdmin) && !selectedClientId) {
        return false;
      }
      // Check all required fields (contactName and contactPhone are optional)
      const hasRequiredFields = (
        siteDetails.siteName?.trim() &&
        siteDetails.street?.trim() &&
        siteDetails.city?.trim() &&
        siteDetails.postcode?.trim() &&
        scheduledDate !== undefined
      );
      return hasRequiredFields;
    }
    if (currentStep === 2) {
      return totalAssets > 0;
    }
    if (currentStep === 3) {
      // For step 3, validate all previous steps are complete
      // Check step 1 requirements
      if ((isReseller || isAdmin) && !selectedClientId) {
        return false;
      }
      const hasStep1Fields = (
        siteDetails.siteName?.trim() &&
        siteDetails.street?.trim() &&
        siteDetails.city?.trim() &&
        siteDetails.postcode?.trim() &&
        scheduledDate !== undefined
      );
      // Check step 2 requirements
      const hasStep2Fields = totalAssets > 0;
      return hasStep1Fields && hasStep2Fields;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!scheduledDate) return;
    
    // Combine address parts
    const fullAddress = [
      siteDetails.street,
      siteDetails.city,
      siteDetails.county,
      siteDetails.country
    ].filter(Boolean).join(', ');
    
    // Determine client ID and name
    let bookingClientId: string | undefined;
    let bookingClientName: string | undefined;
    
    if (isReseller || isAdmin) {
      // For resellers and admin: use selected client
      if (selectedClientId) {
        bookingClientId = selectedClientId;
        const selectedClient = clients.find(c => c.tenantId === selectedClientId);
        bookingClientName = selectedClient?.name || undefined;
      }
      // If no client selected, bookingClientName will be undefined (will be handled by service)
      // DO NOT fall back to admin/reseller's tenant name - they must select a client
    } else if (isClient && user) {
      // For clients: use their own tenant info
      bookingClientId = user.tenantId;
      bookingClientName = user.tenantName || user.name || 'Client'; // Fallback to user name if tenantName not available
    }
    
    // Only set fallback for clients, not for admin/reseller (they must select a client)
    if (!bookingClientName && isClient && user) {
      bookingClientName = user.tenantName || user.name || 'Client';
    }
    
    createBooking.mutate(
      {
        siteId: selectedSiteId !== 'new' ? selectedSiteId : undefined,
        clientId: bookingClientId,
        clientName: bookingClientName, // Pass client name explicitly
        siteName: siteDetails.siteName,
        address: fullAddress,
        postcode: siteDetails.postcode,
        contactName: siteDetails.contactName,
        contactPhone: siteDetails.contactPhone,
        scheduledDate: scheduledDate.toISOString(),
        assets: selectedAssets,
        charityPercent,
        preferredVehicleType: selectedVehicleType, // Save client's vehicle preference
        coordinates: siteLocation || undefined,
      },
      {
        onSuccess: (booking) => {
          toast.success("Booking submitted successfully!", {
            description: `Booking ${booking.erpJobNumber} has been created.`,
          });
          // Redirect to Booking Queue page for admin, or bookings page for others
          if (user?.role === 'admin') {
            navigate(`/admin/bookings`);
          } else {
            navigate(`/bookings`);
          }
        },
        onError: (error) => {
          toast.error("Failed to create booking", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                currentStep >= step.id
                  ? "bg-success/70"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <step.icon className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">{step.title}</span>
              <span className="font-medium sm:hidden">{step.id}</span>
            </motion.div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2",
                  currentStep > step.id ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column - Form Fields */}
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Collection Site Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client Selection for Resellers and Admin */}
                  {(isReseller || isAdmin) && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                      <Label className="text-sm font-semibold">Client Selection *</Label>
                      {isLoadingClients ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <Select
                          value={selectedClientId}
                          onValueChange={setSelectedClientId}
                        >
                          <SelectTrigger className="bg-background h-9">
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.length === 0 ? (
                              <SelectItem value="" disabled>No clients available</SelectItem>
                            ) : (
                              clients.map((client) => (
                                <SelectItem key={client.id} value={client.tenantId}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{client.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Site Selection for Clients Only */}
                  {isClient && sites.length > 0 && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Site Selection</Label>
                        {selectedSiteId === 'new' && (
                          <span className="text-xs text-green-600 dark:text-green-400">● Creating New</span>
                        )}
                        {selectedSiteId !== 'new' && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">● Loaded</span>
                        )}
                      </div>
                      {isLoadingSites ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <Select
                          value={selectedSiteId}
                          onValueChange={handleSiteSelect}
                        >
                          <SelectTrigger className="bg-background h-9">
                            <SelectValue placeholder="Choose a site or create new" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span>Create New Site</span>
                              </div>
                            </SelectItem>
                            {sites.map((site) => (
                              <SelectItem key={site.id} value={site.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  <span>{site.name} - {site.postcode}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="siteName" className="text-sm">Site Name *</Label>
                      <Input
                        id="siteName"
                        placeholder="e.g., London HQ"
                        value={siteDetails.siteName}
                        onChange={(e) =>
                          setSiteDetails({ ...siteDetails, siteName: e.target.value })
                        }
                        disabled={selectedSiteId && selectedSiteId !== 'new'}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="scheduledDate" className="text-sm">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        Scheduled Date *
                      </Label>
                      <DatePicker
                        date={scheduledDate}
                        onDateChange={setScheduledDate}
                        placeholder="Pick date"
                        minDate={new Date()}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Address (use map search or enter manually)</Label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="street" className="text-sm">Street *</Label>
                        <Input
                          id="street"
                          placeholder="123 High Street"
                          value={siteDetails.street}
                          onChange={(e) =>
                            setSiteDetails({ ...siteDetails, street: e.target.value })
                          }
                          disabled={selectedSiteId && selectedSiteId !== 'new'}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-sm">City *</Label>
                        <Input
                          id="city"
                          placeholder="London"
                          value={siteDetails.city}
                          onChange={(e) =>
                            setSiteDetails({ ...siteDetails, city: e.target.value })
                          }
                          disabled={selectedSiteId && selectedSiteId !== 'new'}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="county" className="text-sm">County</Label>
                        <Input
                          id="county"
                          placeholder="Greater London"
                          value={siteDetails.county}
                          onChange={(e) =>
                            setSiteDetails({ ...siteDetails, county: e.target.value })
                          }
                          disabled={selectedSiteId && selectedSiteId !== 'new'}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="postcode" className="text-sm">Postcode *</Label>
                        <Input
                          id="postcode"
                          placeholder="EC1A 1BB"
                          value={siteDetails.postcode}
                          onChange={(e) =>
                            setSiteDetails({ ...siteDetails, postcode: e.target.value })
                          }
                          disabled={selectedSiteId && selectedSiteId !== 'new'}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="country" className="text-sm">Country</Label>
                        <Input
                          id="country"
                          value={siteDetails.country}
                          onChange={(e) =>
                            setSiteDetails({ ...siteDetails, country: e.target.value })
                          }
                          disabled={selectedSiteId && selectedSiteId !== 'new'}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="contactName" className="text-sm">Contact Name</Label>
                      <Input
                        id="contactName"
                        placeholder="Site contact person"
                        value={siteDetails.contactName}
                        onChange={(e) =>
                          setSiteDetails({ ...siteDetails, contactName: e.target.value })
                        }
                        disabled={selectedSiteId && selectedSiteId !== 'new'}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contactPhone" className="text-sm">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        placeholder="+44 ..."
                        value={siteDetails.contactPhone}
                        onChange={(e) =>
                          setSiteDetails({ ...siteDetails, contactPhone: e.target.value })
                        }
                        disabled={selectedSiteId && selectedSiteId !== 'new'}
                        className="h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>

              {/* Right Column - Map */}
              <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Search Address or Select on Map
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Search or click on the map to auto-fill address fields
                  </p>
                </CardHeader>
                <CardContent>
                  <MapPicker
                    position={siteLocation}
                    onPositionChange={(position) => {
                      // Allow position change always (don't check for existing address)
                      setSiteLocation(position);
                    }}
                    onAddressDetailsChange={(details) => {
                      // Only auto-fill if creating new site
                      if (selectedSiteId === 'new' || !selectedSiteId) {
                        setSiteDetails({
                          ...siteDetails,
                          street: details.street || siteDetails.street,
                          city: details.city || siteDetails.city,
                          county: details.county || siteDetails.county,
                          postcode: details.postcode || siteDetails.postcode,
                          country: details.country || siteDetails.country,
                        });
                      }
                    }}
                    height="450px"
                  />
                  {siteLocation && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location set at {siteLocation.lat.toFixed(4)}, {siteLocation.lng.toFixed(4)}
                    </p>
                  )}
                </CardContent>
              </Card>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Select Assets for Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {assetCategories.map((category) => {
                    const qty = getAssetQuantity(category.id);
                    const isSelected = qty > 0;
                    return (
                      <div
                        key={category.id}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="text-center mb-3">
                          <span className="text-3xl">{category.icon}</span>
                          <p className="font-medium mt-1">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ~{category.co2ePerUnit}kg CO₂e/unit
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateAssetQuantity(category.id, -5)}
                            disabled={qty === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setSelectedAssets((prev) => {
                                const filtered = prev.filter(
                                  (a) => a.categoryId !== category.id
                                );
                                if (val > 0) {
                                  return [...filtered, { categoryId: category.id, quantity: val }];
                                }
                                return filtered;
                              });
                            }}
                            className="w-20 text-center h-8"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateAssetQuantity(category.id, 5)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CO2e Preview */}
                {totalAssets > 0 && (
                  <motion.div
                    key="co2-preview"
                    layoutId="co2-preview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "mt-6 p-4 rounded-xl bg-gradient-eco border border-primary/20 transition-opacity duration-200",
                      isFetchingCO2 && "opacity-75"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Leaf className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Environmental Impact Preview</span>
                      {isFetchingCO2 && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-success">
                          {co2eSaved >= 1000 
                            ? `${(co2eSaved / 1000).toFixed(1)}t` 
                            : `${co2eSaved.toFixed(1)}kg`}
                        </p>
                        <p className="text-xs text-muted-foreground">CO₂e Saved</p>
                      </div>
                      <div>
                        <p className={cn(
                          "text-2xl font-bold",
                          selectedVehicleType === 'electric' ? "text-success" : "text-destructive"
                        )}>
                          {selectedVehicleType === 'electric' ? '0kg' : `-${travelEmissions.toFixed(1)}kg`}
                        </p>
                        <p className="text-xs text-muted-foreground">Travel Emissions ({selectedVehicleType.charAt(0).toUpperCase() + selectedVehicleType.slice(1)})</p>
                      </div>
                      <div className={cn(
                        netCO2e > 0 && "relative"
                      )}>
                        <p className={cn(
                          "text-2xl font-bold transition-colors",
                          netCO2e > 0 ? "text-success text-3xl" : netCO2e < 0 ? "text-destructive" : "text-primary"
                        )}>
                          {netCO2e > 0 && "+"}
                          {Math.abs(netCO2e) >= 1000 
                            ? `${(netCO2e / 1000).toFixed(1)}t` 
                            : `${netCO2e.toFixed(1)}kg`}
                        </p>
                        <p className={cn(
                          "text-xs font-medium",
                          netCO2e > 0 ? "text-success/80" : "text-muted-foreground"
                        )}>
                          Net Benefit
                          {netCO2e > 0 && " ✓"}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm text-center mt-3 font-medium",
                      netCO2e > 0 ? "text-success" : "text-muted-foreground"
                    )}>
                      {netCO2e > 0 && "✓ "}
                      ≈ {co2eEquivalencies.treesPlanted(netCO2e)} trees planted equivalent
                      {netCO2e > 0 && " - Great environmental impact!"}
                    </p>
                  </motion.div>
                )}

                {/* Travel Distance & Emissions Box */}
                {totalAssets > 0 && (distanceKm > 0 || isCalculatingCO2) && (
                  <motion.div
                    key="travel-emissions"
                    layoutId="travel-emissions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "mt-6 p-4 rounded-xl border bg-card transition-opacity duration-200",
                      isFetchingCO2 && "opacity-75"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Truck className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Travel Distance & Emissions</span>
                      {isFetchingCO2 && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Total Mileage (Round Trip)</span>
                        </div>
                        <span className="text-lg font-bold">
                          {distanceMiles > 0 ? `${distanceMiles.toFixed(1)} miles (${distanceKm.toFixed(1)} km)` : 'Calculating...'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        From collection site to warehouse (RM13 8BT) and return
                        {!siteLocation && (
                          <span className="ml-2 text-warning">(Estimated - Location not set)</span>
                        )}
                      </div>
                      <div className="text-sm font-medium mb-2">
                        Select vehicle type to see emissions:
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedVehicleType('petrol')}
                          className={cn(
                            "p-3 rounded-lg border bg-background transition-all cursor-pointer text-left",
                            selectedVehicleType === 'petrol' 
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                              : "hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Fuel className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-semibold text-muted-foreground">Petrol</span>
                            {selectedVehicleType === 'petrol' && (
                              <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />
                            )}
                          </div>
                          <p className={cn(
                            "text-xl font-bold",
                            selectedVehicleType === 'petrol' ? "text-primary" : "text-foreground"
                          )}>
                            {distanceKm > 0 ? `${vehicleEmissions.petrol.toFixed(2)}kg` : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">CO₂e</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVehicleType('diesel')}
                          className={cn(
                            "p-3 rounded-lg border bg-background transition-all cursor-pointer text-left",
                            selectedVehicleType === 'diesel' 
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                              : "hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Fuel className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-semibold text-muted-foreground">Diesel</span>
                            {selectedVehicleType === 'diesel' && (
                              <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />
                            )}
                          </div>
                          <p className={cn(
                            "text-xl font-bold",
                            selectedVehicleType === 'diesel' ? "text-primary" : "text-foreground"
                          )}>
                            {distanceKm > 0 ? `${vehicleEmissions.diesel.toFixed(2)}kg` : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">CO₂e</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVehicleType('electric')}
                          className={cn(
                            "p-3 rounded-lg border bg-background transition-all cursor-pointer text-left",
                            selectedVehicleType === 'electric' 
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                              : "hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-green-500" />
                            <span className="text-xs font-semibold text-muted-foreground">Electric</span>
                            {selectedVehicleType === 'electric' && (
                              <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />
                            )}
                          </div>
                          <p className={cn(
                            "text-xl font-bold",
                            selectedVehicleType === 'electric' ? "text-success" : "text-foreground"
                          )}>
                            {distanceKm > 0 ? '0kg' : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">CO₂e</p>
                        </button>
                      </div>
                      {selectedVehicleType && distanceKm > 0 && vehicleEmissions && (
                        <div className="mt-3 p-2 rounded-lg bg-muted/50 text-sm text-center">
                          Selected: <span className="font-semibold capitalize">{selectedVehicleType}</span> vehicle ({selectedVehicleType === 'electric' ? '0kg' : (vehicleEmissions[selectedVehicleType as keyof typeof vehicleEmissions] || 0).toFixed(2) + 'kg'} CO₂e)
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Collection Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Site</span>
                    <span className="font-semibold text-foreground">{siteDetails.siteName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-semibold text-foreground">{siteDetails.postcode}</span>
                  </div>
                  {scheduledDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled Date</span>
                      <span className="font-semibold text-foreground">
                        {scheduledDate.toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Assets</span>
                    <span className="font-semibold text-foreground">{totalAssets} units</span>
                  </div>
                  <div className="pt-3 border-t">
                    {selectedAssets.map((asset) => {
                      const cat = assetCategories.find((c) => c.id === asset.categoryId);
                      return (
                        <div key={asset.categoryId} className="flex justify-between text-sm py-1">
                          <span className="text-muted-foreground">{cat?.icon} {cat?.name}</span>
                          <span className="font-semibold text-foreground">{asset.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-eco border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    Impact & Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estimated Buyback</span>
                    <span className="text-xl font-bold text-foreground">£{buybackEstimate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Net CO₂e Benefit</span>
                    <span className={cn(
                      "text-xl font-bold transition-colors",
                      netCO2e > 0 ? "text-success text-2xl" : netCO2e < 0 ? "text-destructive" : "text-foreground"
                    )}>
                      {netCO2e > 0 && "+"}
                      {(netCO2e / 1000).toFixed(1)}t
                      {netCO2e > 0 && (
                        <span className="ml-2 text-lg">✓</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <TreeDeciduous className="h-4 w-4" />
                      {co2eEquivalencies.treesPlanted(netCO2e)} trees
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      {co2eEquivalencies.carMiles(netCO2e)} miles saved
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charity Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-destructive" />
                  Charity Donation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Donate a percentage of your buyback to charity
                    </span>
                    <span className="text-xl font-bold text-foreground">{charityPercent}%</span>
                  </div>
                  <Slider
                    value={[charityPercent]}
                    onValueChange={([val]) => setCharityPercent(val)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Charity: <span className="font-semibold text-foreground">£{Math.round(buybackEstimate * (charityPercent / 100)).toLocaleString()}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Your Return: <span className="font-semibold text-foreground">£{Math.round(buybackEstimate * (1 - charityPercent / 100)).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Cost */}
            {estimatedCost > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PoundSterling className="h-4 w-4 text-accent" />
                    Estimated Collection & Processing Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Estimated Cost
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        £{estimatedCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      This includes collection from your site to our warehouse (RM13 8BT) and processing fees.
                      Final cost may vary based on actual distance and processing requirements.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        {currentStep === 1 && <div />}

        {currentStep < 3 ? (
          <Button
          variant="outline"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={createBooking.isPending || !canProceed()}
          >
            {createBooking.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 />
                Submit Booking
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Booking;
