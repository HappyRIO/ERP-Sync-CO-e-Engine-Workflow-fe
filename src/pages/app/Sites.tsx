import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  X, 
  Building2,
  Phone,
  Mail,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useSites, useCreateSite, useUpdateSite, useDeleteSite } from "@/hooks/useSites";
import { useClients } from "@/hooks/useClients";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { geocodePostcode } from "@/lib/calculations";
import type { CreateSiteRequest, UpdateSiteRequest } from "@/services/site.service";

const Sites = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  
  // Form state - separate address fields to match booking form
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    county: "",
    country: "United Kingdom",
    postcode: "",
    contactName: "",
    contactPhone: "",
    clientId: undefined,
    lat: undefined,
    lng: undefined,
  });

  // Fetch sites - admin can filter by client, client sees only their own
  const { data: sites = [], isLoading, error } = useSites(
    isAdmin && clientFilter !== "all" ? clientFilter : undefined
  );

  // Fetch clients for admin dropdown
  const { data: clients = [] } = useClients({});

  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load sites. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter sites by search query
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.postcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.contactName && site.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (site.contactPhone && site.contactPhone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const handleCreate = () => {
      setFormData({
        name: "",
        street: "",
        city: "",
        county: "",
        country: "United Kingdom",
        postcode: "",
        contactName: "",
        contactPhone: "",
        clientId: undefined,
        lat: undefined,
        lng: undefined,
      });
      setValidationError(null);
      setIsValid(false);
      setSelectedSite(null);
      setIsCreateDialogOpen(true);
  };

  const handleEdit = (site: any) => {
    // Parse address from saved site
    // Format can be: "street, city, county, country" OR "street, city, country" (if county was empty)
    const addressParts = site.address.split(',').map((s: string) => s.trim());
    
    // Smart parsing: if last part is "United Kingdom" or a known country, it's the country
    // Otherwise, assume 4-part format: street, city, county, country
    const knownCountries = ['United Kingdom', 'UK', 'England', 'Scotland', 'Wales', 'Northern Ireland'];
    const lastPart = addressParts[addressParts.length - 1] || "";
    const isCountryInLastPart = knownCountries.some(country => 
      lastPart.toLowerCase().includes(country.toLowerCase()) || 
      country.toLowerCase().includes(lastPart.toLowerCase())
    );
    
    let street = "";
    let city = "";
    let county = "";
    let country = "United Kingdom";
    
    if (addressParts.length === 3 && isCountryInLastPart) {
      // Format: "street, city, country" (county was empty)
      street = addressParts[0] || "";
      city = addressParts[1] || "";
      county = ""; // County was empty
      country = addressParts[2] || "United Kingdom";
    } else if (addressParts.length === 4) {
      // Format: "street, city, county, country"
      street = addressParts[0] || "";
      city = addressParts[1] || "";
      county = addressParts[2] || "";
      country = addressParts[3] || "United Kingdom";
    } else if (addressParts.length >= 2) {
      // Fallback: try to parse intelligently
      street = addressParts[0] || "";
      city = addressParts[1] || "";
      if (addressParts.length > 2) {
        // Check if second-to-last is county or country
        const secondLast = addressParts[addressParts.length - 2] || "";
        if (isCountryInLastPart && addressParts.length === 3) {
          county = "";
          country = lastPart;
        } else {
          county = secondLast;
          country = lastPart;
        }
      }
    }
    
    setFormData({
      name: site.name,
      street,
      city,
      county,
      country,
      postcode: site.postcode,
      contactName: site.contactName || "",
      contactPhone: site.contactPhone || "",
      clientId: site.clientId,
      lat: site.lat,
      lng: site.lng,
    });
    setValidationError(null);
    setIsValid(false);
    setSelectedSite(site);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (site: any) => {
    setSelectedSite(site);
    setIsDeleteDialogOpen(true);
  };

  // UK Postcode validation regex
  const validateUKPostcode = (postcode: string): boolean => {
    // UK postcode format: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
  };

  // Auto-verify when postcode or address fields change
  useEffect(() => {
    if (!formData.postcode.trim() || !validateUKPostcode(formData.postcode)) {
      setIsValid(false);
      setValidationError(null);
      return;
    }

    // Always verify if country is entered (required field)
    // Also verify if city is entered (required field)
    if (!formData.city.trim() && !formData.country.trim()) {
      setIsValid(false);
      setValidationError(null);
      return;
    }

    // Debounce verification
    const timeoutId = setTimeout(async () => {
      await verifyAddressFields();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData.postcode, formData.street, formData.city, formData.county, formData.country]);

  const verifyAddressFields = async () => {
    if (!formData.postcode.trim() || !validateUKPostcode(formData.postcode)) {
      setIsValid(false);
      setValidationError(null);
      return;
    }

    setIsVerifying(true);
    setValidationError(null);

    try {
      const verification = await verifyPostcodeMatch(
        formData.postcode,
        formData.street,
        formData.city,
        formData.county,
        formData.country
      );

      if (verification.error) {
        setIsValid(false);
        setValidationError("Postcode not found. Please check it's correct.");
        return;
      }

      if (!verification.match && verification.suggestions) {
        setIsValid(false);
        setValidationError(
          `Postcode doesn't match: ${verification.suggestions.join(', ')}`
        );
        // Auto-update coordinates if available
        if (verification.coordinates) {
          setFormData(prev => ({
            ...prev,
            lat: verification.coordinates!.lat,
            lng: verification.coordinates!.lng,
          }));
        }
        return;
      }

      // All good!
      setIsValid(true);
      setValidationError(null);
      if (verification.coordinates) {
        setFormData(prev => ({
          ...prev,
          lat: verification.coordinates!.lat,
          lng: verification.coordinates!.lng,
        }));
      }
    } catch (error) {
      console.error("Verification error:", error);
      setIsValid(false);
      setValidationError("Could not verify address. Please check your connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify postcode matches all address fields by geocoding
  const verifyPostcodeMatch = async (postcode: string, street: string, city: string, county: string, country: string) => {
    if (!postcode.trim() || !validateUKPostcode(postcode)) {
      return { match: true };
    }

    try {
      // Geocode postcode to get actual address details
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postcode)}&limit=1&addressdetails=1&countrycodes=gb`
      );
      const data = await response.json();
      
      if (data.length === 0) {
        return { match: true, error: "Postcode not found" };
      }

      const result = data[0];
      const geocodedCity = (result.address?.city || result.address?.town || result.address?.village || "").toLowerCase();
      const geocodedCounty = (result.address?.county || result.address?.state || "").toLowerCase();
      const geocodedCountry = (result.address?.country || "").toLowerCase();
      const geocodedStreet = (result.address?.road || "").toLowerCase();
      
      const enteredCity = city.trim().toLowerCase();
      const enteredCounty = county.trim().toLowerCase();
      const enteredCountry = country.trim().toLowerCase();
      const enteredStreet = street.trim().toLowerCase();

      // Check for mismatches
      const cityMismatch = enteredCity && geocodedCity && !geocodedCity.includes(enteredCity) && !enteredCity.includes(geocodedCity);
      const countyMismatch = enteredCounty && geocodedCounty && !geocodedCounty.includes(enteredCounty) && !enteredCounty.includes(geocodedCounty);
      
      // Country verification: check if entered country matches geocoded country
      // Normalize country names to handle common variations
      const normalizeCountry = (c: string): string => {
        const normalized = c.toLowerCase().trim();
        // Handle UK variations - must be complete words/phrases, not partial matches
        if (normalized === 'united kingdom' || normalized === 'uk' || normalized === 'great britain' || normalized === 'britain' || normalized === 'england' || normalized === 'scotland' || normalized === 'wales') {
          return 'united kingdom';
        }
        // Check if it's a valid UK country name (full match, not partial)
        const ukVariations = ['united kingdom', 'uk', 'great britain', 'britain'];
        for (const variation of ukVariations) {
          if (normalized === variation || normalized === `the ${variation}`) {
            return 'united kingdom';
          }
        }
        return normalized;
      };
      
      const normalizedEnteredCountry = normalizeCountry(enteredCountry);
      const normalizedGeocodedCountry = normalizeCountry(geocodedCountry);
      
      // Country mismatch: must be exact match after normalization, or clearly different countries
      // Reject partial matches like "U" or "United" - they must be full valid country names
      const isValidUKCountry = (country: string): boolean => {
        const normalized = country.toLowerCase().trim();
        const validUKNames = ['united kingdom', 'uk', 'great britain', 'britain', 'england', 'scotland', 'wales', 'northern ireland'];
        return validUKNames.some(name => normalized === name || normalized === `the ${name}`);
      };
      
      // If entered country is not a valid/complete UK country name, it's a mismatch
      const countryMismatch = enteredCountry && geocodedCountry && (
        !isValidUKCountry(enteredCountry) || // Entered country is not a valid complete name
        (normalizedEnteredCountry !== normalizedGeocodedCountry && 
         !normalizedGeocodedCountry.includes(normalizedEnteredCountry) && 
         !normalizedEnteredCountry.includes(normalizedGeocodedCountry))
      );
      // Street is harder to verify exactly, so we'll be lenient - only check if street name is clearly wrong
      const streetMismatch = enteredStreet && geocodedStreet && 
        !geocodedStreet.includes(enteredStreet.split(' ')[0]) && 
        !enteredStreet.includes(geocodedStreet.split(' ')[0]);

      if (cityMismatch || countyMismatch || countryMismatch || streetMismatch) {
        const suggestions: string[] = [];
        if (cityMismatch) suggestions.push(`City: ${result.address?.city || result.address?.town || result.address?.village || city}`);
        if (countyMismatch) suggestions.push(`County: ${result.address?.county || result.address?.state || county}`);
        if (countryMismatch) suggestions.push(`Country: ${result.address?.country || country}`);
        if (streetMismatch) suggestions.push(`Street: ${result.address?.road || street}`);

        return {
          match: false,
          suggestedCity: result.address?.city || result.address?.town || result.address?.village || city,
          suggestedCounty: result.address?.county || result.address?.state || county,
          suggestedCountry: result.address?.country || country,
          suggestedStreet: result.address?.road || street,
          suggestions: suggestions,
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
          },
        };
      }

      return {
        match: true,
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        },
      };
    } catch (error) {
      console.error("Postcode verification error:", error);
      return { match: true, error: "Verification failed" };
    }
  };


  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim() || !formData.street.trim() || !formData.city.trim() || !formData.postcode.trim()) {
      toast.error("Please fill in all required fields (Site Name, Street, City, Postcode)");
      return;
    }

    // Validate postcode format
    if (!validateUKPostcode(formData.postcode)) {
      toast.error("Please enter a valid UK postcode (e.g., M1 1AA, SW1A 1AA)");
      return;
    }

    // Check if address is valid
    if (!isValid && validationError) {
      toast.error(validationError);
      return;
    }

    // For clients, clientId is automatically set by backend
    // For admins, clientId must be provided
    if (isAdmin && !formData.clientId) {
      toast.error("Please select a client for this site");
      return;
    }

    // Combine address fields into single address string
    // Always include all 4 parts (even if county is empty) for consistent parsing
    const addressParts = [
      formData.street,
      formData.city,
      formData.county || "", // Include empty county to maintain 4-part format
      formData.country
    ].join(', ');

    // Prepare data for API (combine address fields)
    const createData: CreateSiteRequest = {
      name: formData.name,
      address: addressParts,
      postcode: formData.postcode,
      contactName: formData.contactName || undefined,
      contactPhone: formData.contactPhone || undefined,
      clientId: formData.clientId,
      lat: formData.lat,
      lng: formData.lng,
    };

    // Geocode postcode if coordinates are not set
    if (!createData.lat || !createData.lng) {
      setIsVerifying(true);
      try {
        const coordinates = await geocodePostcode(createData.postcode);
        if (coordinates) {
          createData.lat = coordinates.lat;
          createData.lng = coordinates.lng;
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setIsVerifying(false);
      }
    }

    try {
      await createSite.mutateAsync(createData);
      toast.success("Site created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        street: "",
        city: "",
        county: "",
        country: "United Kingdom",
        postcode: "",
        contactName: "",
        contactPhone: "",
        clientId: undefined,
        lat: undefined,
        lng: undefined,
      });
    } catch (error) {
      toast.error("Failed to create site", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim() || !formData.street.trim() || !formData.city.trim() || !formData.postcode.trim() || !formData.country.trim()) {
      toast.error("Please fill in all required fields (Site Name, Street, City, Postcode, Country)");
      return;
    }

    // Validate postcode format
    if (!validateUKPostcode(formData.postcode)) {
      toast.error("Please enter a valid UK postcode (e.g., M1 1AA, SW1A 1AA)");
      return;
    }

    // Check if address is valid
    if (!isValid && validationError) {
      toast.error(validationError);
      return;
    }

    if (!selectedSite) return;

    // Combine address fields into single address string
    // Always include all 4 parts (even if county is empty) for consistent parsing
    const addressParts = [
      formData.street,
      formData.city,
      formData.county || "", // Include empty county to maintain 4-part format
      formData.country
    ].join(', ');

    // Geocode postcode if it changed or coordinates are missing
    let updateData: UpdateSiteRequest = {
      name: formData.name,
      address: addressParts,
      postcode: formData.postcode,
      contactName: formData.contactName || undefined,
      contactPhone: formData.contactPhone || undefined,
    };

    const postcodeChanged = selectedSite.postcode !== formData.postcode;
    const needsGeocoding = postcodeChanged || !formData.lat || !formData.lng;

    if (needsGeocoding && (!updateData.lat || !updateData.lng)) {
      setIsVerifying(true);
      try {
        const coordinates = await geocodePostcode(formData.postcode);
        if (coordinates) {
          updateData.lat = coordinates.lat;
          updateData.lng = coordinates.lng;
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setIsVerifying(false);
      }
    } else if (formData.lat && formData.lng) {
      // Keep existing coordinates if postcode didn't change
      updateData.lat = formData.lat;
      updateData.lng = formData.lng;
    }

    try {
      await updateSite.mutateAsync({ id: selectedSite.id, data: updateData });
      toast.success("Site updated successfully");
      setIsEditDialogOpen(false);
      setSelectedSite(null);
    } catch (error) {
      toast.error("Failed to update site", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSite) return;

    try {
      await deleteSite.mutateAsync(selectedSite.id);
      toast.success("Site deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedSite(null);
    } catch (error) {
      toast.error("Failed to delete site", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Site Management</h2>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage all site addresses across clients" 
              : "Manage your site addresses"}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, address, postcode, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.organisationName || client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Sites List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No sites found matching your criteria</p>
          {isClient && (
            <p className="text-sm text-muted-foreground mt-2">
              Create your first site address to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site, index) => (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="truncate">{site.name}</span>
                      </CardTitle>
                      {isAdmin && site.client && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {site.client.organisationName || site.client.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(site)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(site)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{site.address}</p>
                    <p className="text-sm text-muted-foreground">{site.postcode}</p>
                  </div>
                  
                  {(site.contactName || site.contactPhone) && (
                    <div className="pt-2 border-t space-y-1">
                      {site.contactName && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{site.contactName}</span>
                        </div>
                      )}
                      {site.contactPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{site.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Site Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Site</DialogTitle>
            <DialogDescription>
              {isAdmin 
                ? "Create a new site address. Select which client this site belongs to."
                : "Create a new site address for your bookings."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <div className="space-y-4 py-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <Select
                    value={formData.clientId || ""}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.organisationName || client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select which client this site belongs to
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Site Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Manchester Office"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street *</Label>
                <Input
                  id="street"
                  placeholder="123 High Street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="London"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    placeholder="Greater London"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode *</Label>
                  <div className="space-y-1">
                    <Input
                      id="postcode"
                      placeholder="e.g., M1 1AA"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      required
                      className={cn(
                        formData.postcode && !validateUKPostcode(formData.postcode) && "border-warning",
                        validationError && "border-destructive",
                        isValid && "border-success"
                      )}
                    />
                    {isVerifying && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Verifying address...
                      </p>
                    )}
                    {formData.postcode && !validateUKPostcode(formData.postcode) && !isVerifying && (
                      <p className="text-xs text-warning">
                        ⚠️ Postcode format may be incorrect
                      </p>
                    )}
                    {validationError && !isVerifying && (
                      <p className="text-xs text-destructive">
                        {validationError}
                      </p>
                    )}
                    {isValid && !isVerifying && (
                      <p className="text-xs text-success">
                        ✓ Address verified
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="United Kingdom"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    placeholder="Optional"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    placeholder="Optional"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormData({
                    name: "",
                    street: "",
                    city: "",
                    county: "",
                    country: "United Kingdom",
                    postcode: "",
                    contactName: "",
                    contactPhone: "",
                    clientId: undefined,
                    lat: undefined,
                    lng: undefined,
                  });
                  setValidationError(null);
                  setIsValid(false);
                }}
                disabled={createSite.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  createSite.isPending || 
                  isVerifying ||
                  !formData.name.trim() ||
                  !formData.street.trim() ||
                  !formData.city.trim() ||
                  !formData.postcode.trim() ||
                  !formData.country.trim() ||
                  !validateUKPostcode(formData.postcode) ||
                  (isAdmin && !formData.clientId) ||
                  (formData.postcode.trim() && validateUKPostcode(formData.postcode) && !isValid && validationError)
                }
              >
                {createSite.isPending || isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isVerifying ? "Verifying..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Site
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
            <DialogDescription>
              Update the site address information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Site Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Manchester Office"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-street">Street *</Label>
                <Input
                  id="edit-street"
                  placeholder="123 High Street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City *</Label>
                  <Input
                    id="edit-city"
                    placeholder="London"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-county">County</Label>
                  <Input
                    id="edit-county"
                    placeholder="Greater London"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-postcode">Postcode *</Label>
                  <div className="space-y-1">
                    <Input
                      id="edit-postcode"
                      placeholder="e.g., M1 1AA"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      required
                      className={cn(
                        formData.postcode && !validateUKPostcode(formData.postcode) && "border-warning",
                        validationError && "border-destructive",
                        isValid && "border-success"
                      )}
                    />
                    {isVerifying && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Verifying address...
                      </p>
                    )}
                    {formData.postcode && !validateUKPostcode(formData.postcode) && !isVerifying && (
                      <p className="text-xs text-warning">
                        ⚠️ Postcode format may be incorrect
                      </p>
                    )}
                    {validationError && !isVerifying && (
                      <p className="text-xs text-destructive">
                        {validationError}
                      </p>
                    )}
                    {isValid && !isVerifying && (
                      <p className="text-xs text-success">
                        ✓ Address verified
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country *</Label>
                  <Input
                    id="edit-country"
                    placeholder="United Kingdom"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contactName">Contact Name</Label>
                  <Input
                    id="edit-contactName"
                    placeholder="Optional"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                  <Input
                    id="edit-contactPhone"
                    placeholder="Optional"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedSite(null);
                  setValidationError(null);
                  setIsValid(false);
                }}
                disabled={updateSite.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  updateSite.isPending || 
                  isVerifying ||
                  !formData.name.trim() ||
                  !formData.street.trim() ||
                  !formData.city.trim() ||
                  !formData.postcode.trim() ||
                  !formData.country.trim() ||
                  !validateUKPostcode(formData.postcode) ||
                  (formData.postcode.trim() && validateUKPostcode(formData.postcode) && !isValid && validationError)
                }
              >
                {updateSite.isPending || isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isVerifying ? "Verifying..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Site
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSite?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedSite(null);
              }}
              disabled={deleteSite.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteSite.isPending}
            >
              {deleteSite.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sites;
