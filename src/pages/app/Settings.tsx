import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Bell, 
  Link2, 
  Shield,
  Save,
  User,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantTheme } from "@/contexts/TenantThemeContext";
import { authService } from "@/services/auth.service";
import { useQueryClient } from "@tanstack/react-query";
import { useDriver, useUpdateDriverProfile } from "@/hooks/useDrivers";
import { useClientProfile, useUpdateClientProfile } from "@/hooks/useClients";
import { useOrganisationProfile, useUpdateOrganisationProfile } from "@/hooks/useOrganisationProfile";

// Default notification preferences used for initial state and "unsaved changes" checks
const defaultNotifications = {
  email: true,
  jobAssignments: true,
  routeUpdates: true,
  collectionReminders: true,
  certificateAvailability: true,
  esgReports: false,
  clientActivity: true,
};

const Settings = () => {
  const { user, login } = useAuth();
  const { tenantName } = useTenantTheme();
  const queryClient = useQueryClient();
  const isReseller = user?.role === 'reseller';
  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isDriver = user?.role === 'driver';

  // Driver profile data
  const { data: driverProfile, isLoading: isLoadingDriver } = useDriver(isDriver ? user?.id || null : null);
  const updateDriverProfile = useUpdateDriverProfile();

  // Client profile data
  const { data: clientProfile, isLoading: isLoadingClient } = useClientProfile();
  const updateClientProfile = useUpdateClientProfile();

  // Organisation profile data (for reseller/admin)
  const { data: organisationProfile, isLoading: isLoadingOrgProfile } = useOrganisationProfile();
  const updateOrganisationProfile = useUpdateOrganisationProfile();

  // Driver profile form state
  const [driverFormData, setDriverFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleReg: '',
    vehicleType: 'van' as 'van' | 'truck' | 'car',
    vehicleFuelType: 'diesel' as 'petrol' | 'diesel' | 'electric',
  });
  const [driverInitialFormData, setDriverInitialFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleReg: '',
    vehicleType: 'van' as 'van' | 'truck' | 'car',
    vehicleFuelType: 'diesel' as 'petrol' | 'diesel' | 'electric',
  });

  // Client profile form state
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organisationName: '',
    registrationNumber: '',
    address: '',
  });
  const [clientInitialFormData, setClientInitialFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organisationName: '',
    registrationNumber: '',
    address: '',
  });

  // Reseller / Admin organisation details state
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    organisationName: '',
    registrationNumber: '',
    address: '',
    email: '',
    phone: '',
  });
  const [orgInitialFormData, setOrgInitialFormData] = useState({
    name: '',
    organisationName: '',
    registrationNumber: '',
    address: '',
    email: '',
    phone: '',
  });

  // Load driver profile data when available
  useEffect(() => {
    if (driverProfile && isDriver) {
      const next = {
        name: user?.name || '',
        email: user?.email || '',
        phone: driverProfile.phone || '',
        vehicleReg: driverProfile.vehicleReg || '',
        vehicleType: driverProfile.vehicleType || 'van',
        vehicleFuelType: driverProfile.vehicleFuelType || 'diesel',
      };
      setDriverFormData(next);
      setDriverInitialFormData(next);
    } else if (isDriver && !driverProfile && !isLoadingDriver) {
      // Initialize with defaults if no profile exists
      const next = {
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        vehicleReg: '',
        vehicleType: 'van' as 'van' | 'truck' | 'car',
        vehicleFuelType: 'diesel' as 'petrol' | 'diesel' | 'electric',
      };
      setDriverFormData(next);
      setDriverInitialFormData(next);
    }
  }, [driverProfile, isDriver, isLoadingDriver, user?.name, user?.email]);

  // Load client profile data when available
  useEffect(() => {
    if (clientProfile && isClient) {
      const next = {
        name: user?.name || '',
        email: clientProfile.email || '',
        phone: clientProfile.phone || '',
        // When a real client profile exists, use its organisationName (no mock fallback)
        organisationName: clientProfile.organisationName || '',
        registrationNumber: clientProfile.registrationNumber || '',
        address: clientProfile.address || '',
      };
      setClientFormData(next);
      setClientInitialFormData(next);
    } else if (isClient && !clientProfile && !isLoadingClient) {
      // Initialize with empty values if no profile exists
      const next = {
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        // After accept invitation, organisation name should be empty for client role
        organisationName: '',
        registrationNumber: '',
        address: '',
      };
      setClientFormData(next);
      setClientInitialFormData(next);
    }
  }, [clientProfile, isClient, isLoadingClient, user?.email, user?.name, tenantName]);

  // Load organisation details for admin / reseller from API
  useEffect(() => {
    if (!isAdmin && !isReseller) return;
    if (isLoadingOrgProfile) return;

    if (organisationProfile) {
      // Load from API
      const next = {
        name: user?.name || '',
        organisationName: organisationProfile.organisationName || '',
        registrationNumber: organisationProfile.registrationNumber || '',
        address: organisationProfile.address || '',
        email: organisationProfile.email || user?.email || '',
        phone: organisationProfile.phone || '',
      };
      setOrgFormData(next);
      setOrgInitialFormData(next);
    } else {
      // No profile exists yet - initialize with defaults
      const next = {
        name: user?.name || '',
        organisationName: isAdmin ? (tenantName || user?.tenantName || '') : '',
        registrationNumber: '',
        address: '',
        email: user?.email || '',
        phone: '',
      };
      setOrgFormData(next);
      setOrgInitialFormData(next);
    }
  }, [organisationProfile, isLoadingOrgProfile, isAdmin, isReseller, tenantName, user?.tenantName, user?.email, user?.name]);

  const isResellerProfileComplete = isReseller && !!(
    organisationProfile &&
    organisationProfile.organisationName?.trim() &&
    organisationProfile.registrationNumber?.trim() &&
    organisationProfile.address?.trim() &&
    organisationProfile.email?.trim() &&
    organisationProfile.phone?.trim()
  );

  // Notification state management
  const [notifications, setNotifications] = useState(defaultNotifications);

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast.success(`Notification ${value ? 'enabled' : 'disabled'}`);
  };

  // Change detection for profile sections
  const hasDriverProfileChanges =
    isDriver &&
    (
      driverFormData.name.trim() !== driverInitialFormData.name.trim() ||
      driverFormData.email.trim() !== driverInitialFormData.email.trim() ||
      driverFormData.phone.trim() !== driverInitialFormData.phone.trim() ||
      driverFormData.vehicleReg.trim() !== driverInitialFormData.vehicleReg.trim() ||
      driverFormData.vehicleType !== driverInitialFormData.vehicleType ||
      driverFormData.vehicleFuelType !== driverInitialFormData.vehicleFuelType
    );

  const hasClientProfileChanges =
    isClient &&
    (
      clientFormData.name.trim() !== clientInitialFormData.name.trim() ||
      clientFormData.email.trim() !== clientInitialFormData.email.trim() ||
      clientFormData.phone.trim() !== clientInitialFormData.phone.trim() ||
      clientFormData.organisationName.trim() !== clientInitialFormData.organisationName.trim() ||
      clientFormData.registrationNumber.trim() !== clientInitialFormData.registrationNumber.trim() ||
      clientFormData.address.trim() !== clientInitialFormData.address.trim()
    );

  const handleSaveDriverProfile = () => {
    if (!user?.id) return;

    if (!driverFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!driverFormData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(driverFormData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!driverFormData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!driverFormData.vehicleReg.trim()) {
      toast.error("Vehicle registration number is required");
      return;
    }

    updateDriverProfile.mutate(
      {
        driverId: user.id,
        data: {
          name: driverFormData.name.trim(),
          email: driverFormData.email.trim(),
          phone: driverFormData.phone.trim(),
          vehicleReg: driverFormData.vehicleReg,
          vehicleType: driverFormData.vehicleType,
          vehicleFuelType: driverFormData.vehicleFuelType,
        },
      },
      {
        onSuccess: async () => {
          const updatedData = {
            name: driverFormData.name.trim(),
            email: driverFormData.email.trim(),
            phone: driverFormData.phone.trim(),
            vehicleReg: driverFormData.vehicleReg.trim(),
            vehicleType: driverFormData.vehicleType,
            vehicleFuelType: driverFormData.vehicleFuelType,
          };
          setDriverInitialFormData(updatedData);
          toast.success("Driver profile updated successfully");
          queryClient.invalidateQueries({ queryKey: ['drivers', user.id] });
          // Refresh auth to get updated user name and email
          const auth = await authService.getCurrentAuth();
          if (auth && auth.user) {
            // Update user in context by reloading page to refresh all user data
            setTimeout(() => {
              window.location.reload();
            }, 500); // Small delay to ensure toast is visible
          }
        },
        onError: (error) => {
          toast.error("Failed to update driver profile", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground">
            {isAdmin && "Manage platform settings, organisation details, and user access"}
            {isClient && "Manage your organisation details and preferences"}
            {isReseller && "Manage your organisation and client settings"}
            {isDriver && "Manage your profile and notification preferences"}
          </p>
      </motion.div>

      {/* Driver Profile Incomplete Notification */}
      {isDriver && !isLoadingDriver && (!driverProfile || !driverProfile.hasProfile) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Alert className="bg-warning/10 border-warning/20">
            <AlertCircle className="h-5 w-5 text-warning" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-warning-foreground">
                  Profile Completion Required
                </p>
                <p className="text-sm text-muted-foreground">
                  To access all features and begin working on jobs, please complete your driver profile by providing your vehicle registration number, vehicle type, and fuel type below. Once your profile is complete, you'll be able to view and work on assigned jobs.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Client Profile Incomplete Notification */}
      {isClient && !isLoadingClient && (!clientProfile || !clientProfile.hasProfile) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Alert className="bg-warning/10 border-warning/20">
            <AlertCircle className="h-5 w-5 text-warning" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-warning-foreground">
                  Profile Completion Required
                </p>
                <p className="text-sm text-muted-foreground">
                  To access all features and create bookings, please complete your client profile by providing your contact information (email and phone) and organisation details (organisation name, registration number, and address) below. Once your profile is complete, you'll be able to use all platform features.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Profile Settings - For Drivers */}
      {isDriver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Driver Profile Information
              </CardTitle>
              <CardDescription>
                Update your vehicle information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingDriver ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="driverName">Full Name</Label>
                      <Input 
                        id="driverName" 
                        value={driverFormData.name}
                        onChange={(e) => setDriverFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driverEmail">Email</Label>
                      <Input 
                        id="driverEmail" 
                        type="email"
                        placeholder="driver@example.com"
                        value={driverFormData.email}
                        onChange={(e) => setDriverFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="driverPhone">Phone Number</Label>
                      <Input 
                        id="driverPhone" 
                        type="tel"
                        placeholder="+44 7700 900123"
                        value={driverFormData.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numbers, spaces, hyphens, parentheses, and plus sign at the start
                          const phoneRegex = /^[+]?[0-9\s\-()]*$/;
                          if (phoneRegex.test(value) || value === '') {
                            setDriverFormData(prev => ({ ...prev, phone: value }));
                          }
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                      <Input 
                        id="vehicleReg" 
                        className="font-mono uppercase"
                        placeholder="AB12 CDE"
                        value={driverFormData.vehicleReg}
                        onChange={(e) => setDriverFormData(prev => ({ ...prev, vehicleReg: e.target.value.toUpperCase() }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleType">Vehicle Type *</Label>
                      <Select
                        value={driverFormData.vehicleType}
                        onValueChange={(value: 'van' | 'truck' | 'car') => 
                          setDriverFormData(prev => ({ ...prev, vehicleType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="van">Van</SelectItem>
                          <SelectItem value="truck">Truck</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleFuelType">Fuel Type *</Label>
                      <Select
                        value={driverFormData.vehicleFuelType}
                        onValueChange={(value: 'petrol' | 'diesel' | 'electric') => 
                          setDriverFormData(prev => ({ ...prev, vehicleFuelType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="petrol">Petrol</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      variant="default" 
                      onClick={handleSaveDriverProfile} 
                      size="lg"
                      disabled={
                        updateDriverProfile.isPending ||
                        !driverFormData.name.trim() ||
                        !driverFormData.email.trim() ||
                        !driverFormData.phone.trim() ||
                        !driverFormData.vehicleReg.trim() ||
                        !hasDriverProfileChanges
                      }
                    >
                      {updateDriverProfile.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Driver Profile
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Organisation Settings - For Clients (aligned with Admin/Reseller style) */}
      {isClient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5" />
                Organisation Details
              </CardTitle>
              <CardDescription>
                Your organisation information used for bookings, client-facing communications, reports, and certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingClient ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Contact Information</h4>
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientName">Contact Name</Label>
                          <Input 
                            id="clientName" 
                            value={clientFormData.name}
                            onChange={(e) => setClientFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientEmail">Email Address</Label>
                          <Input 
                            id="clientEmail" 
                            type="email"
                            placeholder="client@example.com"
                            value={clientFormData.email}
                            onChange={(e) => setClientFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientPhone">Phone Number</Label>
                          <Input 
                            id="clientPhone" 
                            type="tel"
                            placeholder="+44 20 1234 5678"
                            value={clientFormData.phone}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow numbers, spaces, hyphens, parentheses, and plus sign at the start
                              const phoneRegex = /^[+]?[0-9\s\-()]*$/;
                              if (phoneRegex.test(value) || value === '') {
                                setClientFormData(prev => ({ ...prev, phone: value }));
                              }
                            }}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-3">Organisation Information</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="orgName">Organisation Name</Label>
                          <Input 
                            id="orgName" 
                            value={clientFormData.organisationName}
                            onChange={(e) => setClientFormData(prev => ({ ...prev, organisationName: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="regNumber">Registration Number</Label>
                          <Input 
                            id="regNumber" 
                            value={clientFormData.registrationNumber}
                            onChange={(e) => setClientFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="address">Registered Address</Label>
                        <Input 
                          id="address" 
                          value={clientFormData.address}
                          onChange={(e) => setClientFormData(prev => ({ ...prev, address: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => {
                        if (!clientFormData.name.trim() || !clientFormData.email.trim() || !clientFormData.phone.trim()) {
                          toast.error("Contact name, email and phone number are required");
                          return;
                        }
                        if (!clientFormData.organisationName.trim() || !clientFormData.registrationNumber.trim() || !clientFormData.address.trim()) {
                          toast.error("All organisation details are required");
                          return;
                        }
                        updateClientProfile.mutate(
                          {
                            name: clientFormData.name.trim(),
                            email: clientFormData.email.trim(),
                            phone: clientFormData.phone.trim(),
                            organisationName: clientFormData.organisationName.trim(),
                            registrationNumber: clientFormData.registrationNumber.trim(),
                            address: clientFormData.address.trim(),
                          },
                          {
                            onSuccess: async () => {
                              setClientInitialFormData({
                                name: clientFormData.name.trim(),
                                email: clientFormData.email.trim(),
                                phone: clientFormData.phone.trim(),
                                organisationName: clientFormData.organisationName.trim(),
                                registrationNumber: clientFormData.registrationNumber.trim(),
                                address: clientFormData.address.trim(),
                              });
                              // Refresh auth to get updated user name
                              const auth = await authService.getCurrentAuth();
                              if (auth && auth.user) {
                                // Update user in context by reloading page to refresh all user data
                                window.location.reload();
                              }
                              toast.success("Client profile updated successfully");
                            },
                            onError: (error) => {
                              toast.error("Failed to update client profile", {
                                description: error instanceof Error ? error.message : "Please try again.",
                              });
                            },
                          }
                        );
                      }}
                      disabled={
                        updateClientProfile.isPending || 
                        !clientFormData.name.trim() ||
                        !clientFormData.email.trim() || 
                        !clientFormData.phone.trim() ||
                        !clientFormData.organisationName.trim() ||
                        !clientFormData.registrationNumber.trim() ||
                        !clientFormData.address.trim() ||
                        !hasClientProfileChanges
                      }
                    >
                      {updateClientProfile.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Organisation Details
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Organisation Settings - For Admin and Reseller */}
      {(isAdmin || isReseller) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5" />
                Organisation Details
              </CardTitle>
              <CardDescription>
                {isAdmin && "Platform-wide organisation information"}
                {isReseller && "Your company information used for client-facing communications, reports, and certificates"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Contact Information</h4>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="resellerFullName">Contact Name</Label>
                  <Input
                    id="resellerFullName"
                        value={orgFormData.name}
                        onChange={(e) =>
                          setOrgFormData(prev => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                </div>
              </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={orgFormData.email}
                        onChange={(e) =>
                          setOrgFormData(prev => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+44 20 1234 5678"
                        value={orgFormData.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numbers, spaces, hyphens, parentheses, and plus sign at the start
                          const phoneRegex = /^[+]?[0-9\s\-()]*$/;
                          if (phoneRegex.test(value) || value === '') {
                            setOrgFormData(prev => ({ ...prev, phone: value }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Organisation Details */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Organisation Information</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organisation Name</Label>
                  <Input
                    id="orgName"
                    value={orgFormData.organisationName}
                    onChange={(e) =>
                      setOrgFormData(prev => ({ ...prev, organisationName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regNumber">Registration Number</Label>
                  <Input
                    id="regNumber"
                    value={orgFormData.registrationNumber}
                    onChange={(e) =>
                      setOrgFormData(prev => ({ ...prev, registrationNumber: e.target.value }))
                    }
                  />
                </div>
              </div>
                  <div className="space-y-2 mt-4">
                <Label htmlFor="address">Registered Address</Label>
                <Input
                  id="address"
                  value={orgFormData.address}
                  onChange={(e) =>
                    setOrgFormData(prev => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>
                </div>
              </div>
              {(isAdmin || isReseller) && (
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => {
                      if (!orgFormData.name.trim() ||
                          !orgFormData.organisationName.trim() ||
                          !orgFormData.registrationNumber.trim() ||
                          !orgFormData.address.trim() ||
                          !orgFormData.email.trim() ||
                          !orgFormData.phone.trim()) {
                        toast.error("All fields are required");
                        return;
                      }

                      const payload = {
                        name: orgFormData.name.trim(),
                        organisationName: orgFormData.organisationName.trim(),
                        registrationNumber: orgFormData.registrationNumber.trim(),
                        address: orgFormData.address.trim(),
                        email: orgFormData.email.trim(),
                        phone: orgFormData.phone.trim(),
                      };

                      updateOrganisationProfile.mutate(payload, {
                        onSuccess: async () => {
                          setOrgInitialFormData(payload);
                          // Refresh auth to get updated user name
                          const auth = await authService.getCurrentAuth();
                          if (auth && auth.user) {
                            // Update user in context by reloading page to refresh all user data
                            window.location.reload();
                          }
                          toast.success("Organisation details saved successfully");
                        },
                        onError: (error) => {
                          toast.error("Failed to save organisation details", {
                            description: error instanceof Error ? error.message : "Please try again.",
                          });
                        },
                      });
                    }}
                    disabled={
                      updateOrganisationProfile.isPending ||
                      // Require all fields AND at least one has changed from last saved values
                      !orgFormData.name.trim() ||
                      !orgFormData.organisationName.trim() ||
                      !orgFormData.registrationNumber.trim() ||
                      !orgFormData.address.trim() ||
                      !orgFormData.email.trim() ||
                      !orgFormData.phone.trim() ||
                      (
                        orgFormData.name.trim() === orgInitialFormData.name.trim() &&
                        orgFormData.organisationName.trim() === orgInitialFormData.organisationName.trim() &&
                        orgFormData.registrationNumber.trim() === orgInitialFormData.registrationNumber.trim() &&
                        orgFormData.address.trim() === orgInitialFormData.address.trim() &&
                        orgFormData.email.trim() === orgInitialFormData.email.trim() &&
                        orgFormData.phone.trim() === orgInitialFormData.phone.trim()
                      )
                    }
                  >
                    {updateOrganisationProfile.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Organisation Details
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}


      {/* Notifications - All roles with functional toggles */}
      {/* Temporarily hidden */}
      {false && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isDriver ? 0.2 : 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how and when you receive updates. Toggle notifications on or off as needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Common notifications - Email */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium mb-1">Email notifications</p>
                  <p className="text-sm text-muted-foreground">
                    {isDriver && "Receive updates about assigned jobs"}
                    {!isDriver && "Receive updates about job status changes"}
                  </p>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  className="data-[state=checked]:bg-success"
                />
              </div>
              
              {/* Driver-specific notifications */}
              {isDriver && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium mb-1">Job assignments</p>
                      <p className="text-sm text-muted-foreground">Get notified when new jobs are assigned to you</p>
                    </div>
                    <Switch 
                      checked={notifications.jobAssignments}
                      onCheckedChange={(checked) => handleNotificationChange('jobAssignments', checked)}
                      className="data-[state=checked]:bg-success"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium mb-1">Route updates</p>
                      <p className="text-sm text-muted-foreground">Receive updates about route changes or delays</p>
                    </div>
                    <Switch 
                      checked={notifications.routeUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('routeUpdates', checked)}
                      className="data-[state=checked]:bg-success"
                    />
                  </div>
                </>
              )}
              
              {/* Client/Reseller/Admin notifications */}
              {!isDriver && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium mb-1">Collection reminders</p>
                      <p className="text-sm text-muted-foreground">Get notified 24h before scheduled collections</p>
                    </div>
                    <Switch 
                      checked={notifications.collectionReminders}
                      onCheckedChange={(checked) => handleNotificationChange('collectionReminders', checked)}
                      className="data-[state=checked]:bg-success"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium mb-1">Certificate availability</p>
                      <p className="text-sm text-muted-foreground">Notify when new certificates are ready</p>
                    </div>
                    <Switch 
                      checked={notifications.certificateAvailability}
                      onCheckedChange={(checked) => handleNotificationChange('certificateAvailability', checked)}
                      className="data-[state=checked]:bg-success"
                    />
                  </div>
                  {(isAdmin || isClient) && (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium mb-1">ESG report summaries</p>
                        <p className="text-sm text-muted-foreground">Weekly environmental impact digests</p>
                      </div>
                      <Switch 
                        checked={notifications.esgReports}
                        onCheckedChange={(checked) => handleNotificationChange('esgReports', checked)}
                        className="data-[state=checked]:bg-success"
                      />
                    </div>
                  )}
                  {isReseller && (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium mb-1">Client activity</p>
                        <p className="text-sm text-muted-foreground">Get notified about your clients' bookings and jobs</p>
                      </div>
                      <Switch 
                        checked={notifications.clientActivity}
                        onCheckedChange={(checked) => handleNotificationChange('clientActivity', checked)}
                        className="data-[state=checked]:bg-success"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Integrations - Admin only */}
      {/* Temporarily hidden */}
      {false && isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-5 w-5" />
                Integrations
              </CardTitle>
              <CardDescription>
                Manage platform-wide system integrations with external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <p className="font-medium">ERP System</p>
                    <p className="text-sm text-muted-foreground">
                      Platform ERP integration for automated data synchronization
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success">Connected</Badge>
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-lg">💾</span>
                  </div>
                  <div>
                    <p className="font-medium">Blancco Data Wipe</p>
                    <p className="text-sm text-muted-foreground">
                      Sanitisation system integration for automated certificate generation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success">Connected</Badge>
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Security - For all roles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isDriver ? 0.3 : 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              Security & Password
            </CardTitle>
            <CardDescription>
              Keep your account secure by updating your password regularly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-semibold">
                Current Password
              </Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showPasswords.current ? "text" : "password"} 
                  placeholder="Enter your current password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-3 block">New Password</Label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs text-muted-foreground">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="newPassword" 
                        type={showPasswords.new ? "text" : "password"} 
                        placeholder="Create a strong password"
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="confirmPassword" 
                        type={showPasswords.confirm ? "text" : "password"} 
                        placeholder="Re-enter your new password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2 mb-3">
                  <Shield className="h-4 w-4 text-primary mt-0.5" />
                  <p className="text-sm font-semibold text-foreground">Password Requirements</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {passwordForm.new.length >= 8 ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={passwordForm.new.length >= 8 ? "text-success font-medium" : "text-destructive"}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[A-Z]/.test(passwordForm.new) ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={/[A-Z]/.test(passwordForm.new) ? "text-success font-medium" : "text-destructive"}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[a-z]/.test(passwordForm.new) ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={/[a-z]/.test(passwordForm.new) ? "text-success font-medium" : "text-destructive"}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/\d/.test(passwordForm.new) ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={/\d/.test(passwordForm.new) ? "text-success font-medium" : "text-destructive"}>
                      One number
                    </span>
                  </div>
                  {passwordForm.confirm && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/10">
                      {passwordForm.new === passwordForm.confirm ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className={passwordForm.new === passwordForm.confirm ? "text-success font-medium" : "text-destructive"}>
                        Passwords match
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button 
                variant="default" 
                size="lg"
                disabled={
                  isChangingPassword ||
                  !passwordForm.current?.trim() || 
                  !passwordForm.new?.trim() || 
                  !passwordForm.confirm?.trim() ||
                  passwordForm.new !== passwordForm.confirm ||
                  passwordForm.new.length < 8 || 
                  !/[A-Z]/.test(passwordForm.new) || 
                  !/[a-z]/.test(passwordForm.new) || 
                  !/\d/.test(passwordForm.new)
                }
                onClick={async () => {
                  if (!passwordForm.current) {
                    toast.error("Please enter your current password");
                    return;
                  }
                  if (!passwordForm.new) {
                    toast.error("Please enter a new password");
                    return;
                  }
                  if (passwordForm.new !== passwordForm.confirm) {
                    toast.error("Passwords do not match");
                    return;
                  }
                  if (passwordForm.new.length < 8 || !/[A-Z]/.test(passwordForm.new) || !/[a-z]/.test(passwordForm.new) || !/\d/.test(passwordForm.new)) {
                    toast.error("Password does not meet requirements");
                    return;
                  }

                  setIsChangingPassword(true);
                  try {
                    await authService.changePassword(passwordForm.current, passwordForm.new);
                    toast.success("Password updated successfully", {
                      description: "Your password has been changed. Please use your new password for future logins.",
                    });
                    setPasswordForm({ current: '', new: '', confirm: '' });
                  } catch (error: any) {
                    const errorMessage = error?.message || "Failed to change password. Please try again.";
                    toast.error("Failed to change password", {
                      description: errorMessage,
                    });
                  } finally {
                    setIsChangingPassword(false);
                  }
                }}
                className="min-w-[160px]"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Settings;
