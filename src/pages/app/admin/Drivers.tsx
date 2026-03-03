import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Truck, Trash2, Loader2, CheckCircle2, XCircle, AlertCircle, Phone, Mail, UserPlus, Clock, Copy, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDrivers, useDeleteDriverProfile } from "@/hooks/useDrivers";
import { useInvites, useCancelInvite } from "@/hooks/useInvites";
import { useVehicles, useAllocateVehicle } from "@/hooks/useVehicles";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Invite } from "@/types/auth";

const Drivers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);
  const [isCancelInviteDialogOpen, setIsCancelInviteDialogOpen] = useState(false);
  const [inviteToCancel, setInviteToCancel] = useState<Invite | null>(null);

  const { data: drivers = [], isLoading, error } = useDrivers();
  const { data: invites = [], isLoading: isLoadingInvites } = useInvites(undefined, 'driver');
  const { data: vehicles = [] } = useVehicles();
  const deleteProfile = useDeleteDriverProfile();
  const cancelInvite = useCancelInvite();
  const allocateVehicle = useAllocateVehicle();

  // Create invite mutation
  const createInvite = useMutation({
    mutationFn: async (email: string) => {
      const tenantId = user?.tenantId;
      const tenantName = user?.tenantName;
      
      if (!tenantId || !tenantName || !user?.id) {
        throw new Error('User information not found');
      }
      return authService.createInvite(
        email,
        'driver',
        user.id,
        tenantId,
        tenantName
      );
    },
    onSuccess: (invite) => {
      toast.success('Invitation sent successfully!', {
        description: `An invitation has been sent to ${invite.email}`,
      });
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error) => {
      toast.error('Failed to send invitation', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    setIsSendingInvite(true);
    try {
      await createInvite.mutateAsync(inviteEmail.trim());
    } finally {
      setIsSendingInvite(false);
    }
  };

  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [driverToAllocate, setDriverToAllocate] = useState<string | null>(null);

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.vehicleReg?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const handleAllocateVehicle = (driverId: string) => {
    setDriverToAllocate(driverId);
    setIsAllocateDialogOpen(true);
  };

  const handleAllocateConfirm = (vehicleId: string | null) => {
    if (!driverToAllocate) return;

    const currentDriver = drivers.find(d => d.id === driverToAllocate);
    
    // If unallocating (vehicleId is null), we need the current vehicle's ID
    if (vehicleId === null) {
      if (!currentDriver?.vehicleId) {
        toast.error("No vehicle allocated to unallocate");
        return;
      }
      
      // Unallocate: use current vehicle ID, set driverId to null
      allocateVehicle.mutate(
        { vehicleId: currentDriver.vehicleId, driverId: null },
        {
          onSuccess: () => {
            toast.success("Vehicle unallocated successfully");
            setIsAllocateDialogOpen(false);
            setDriverToAllocate(null);
          },
          onError: (error) => {
            toast.error("Failed to unallocate vehicle", {
              description: error instanceof Error ? error.message : "Please try again.",
            });
          },
        }
      );
      return;
    }

    // Allocating or changing vehicle
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    const isSwitching = selectedVehicle?.driverId && selectedVehicle.driverId !== driverToAllocate;
    const isChangingVehicle = currentDriver?.hasVehicle && currentDriver.vehicleId !== vehicleId;

    allocateVehicle.mutate(
      { vehicleId, driverId: driverToAllocate },
      {
        onSuccess: () => {
          if (isSwitching) {
            toast.success("Vehicle switched successfully");
          } else if (isChangingVehicle) {
            toast.success("Vehicle changed successfully");
          } else {
            toast.success("Vehicle allocated successfully");
          }
          setIsAllocateDialogOpen(false);
          setDriverToAllocate(null);
        },
        onError: (error) => {
          toast.error("Failed to allocate vehicle", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  const handleUnallocateVehicle = (driverId: string, vehicleId: string) => {
    allocateVehicle.mutate(
      { vehicleId, driverId: null },
      {
        onSuccess: () => {
          toast.success("Vehicle unallocated successfully");
        },
        onError: (error) => {
          toast.error("Failed to unallocate vehicle", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };


  const handleDeleteClick = (driverId: string) => {
    setDriverToDelete(driverId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!driverToDelete) return;

    deleteProfile.mutate(driverToDelete, {
      onSuccess: () => {
        toast.success("Driver deleted successfully");
        setIsDeleteDialogOpen(false);
        setDriverToDelete(null);
      },
      onError: (error) => {
        toast.error("Failed to delete driver", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      },
    });
  };

  const handleCancelInviteClick = (invite: Invite) => {
    setInviteToCancel(invite);
    setIsCancelInviteDialogOpen(true);
  };

  const handleCancelInviteConfirm = () => {
    if (!inviteToCancel) return;

    cancelInvite.mutate(inviteToCancel.id, {
      onSuccess: () => {
        setIsCancelInviteDialogOpen(false);
        setInviteToCancel(null);
      },
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load drivers. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Driver Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Driver</DialogTitle>
            <DialogDescription>
              Send an invitation to a new driver. They will receive an email with instructions to join the platform and can then set up their vehicle profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="driver@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isSendingInvite}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email address of the driver you want to invite. Only invited drivers can join the platform.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInviteDialogOpen(false);
                  setInviteEmail("");
                }}
                disabled={isSendingInvite}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSendingInvite || !inviteEmail.trim()}>
                {isSendingInvite ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Driver Management</h2>
          <p className="text-muted-foreground">Manage drivers and their vehicle information</p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Driver
        </Button>
      </motion.div>

      {/* Tabs Interface */}
      <Tabs defaultValue="drivers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drivers">
            Drivers
            {filteredDrivers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredDrivers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Driver Invitations
            {invites.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {invites.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-4">

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drivers by name, email, or vehicle registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </motion.div>

          {/* Drivers List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDrivers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No drivers found matching your search." : "No drivers with profiles found."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Invite Driver" to send an invitation. After the driver accepts, you can allocate a vehicle to them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDrivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{driver.name}</CardTitle>
                    <Badge
                      variant={driver.status === "active" ? "default" : "secondary"}
                      className={cn(
                        driver.status === "active" && "bg-success/10 text-success",
                        driver.status === "pending" && "bg-warning/10 text-warning border-warning/20",
                        driver.status === "inactive" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {driver.status === "active" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : driver.status === "pending" ? (
                        <Clock className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {driver.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{driver.email}</span>
                    </div>
                    {driver.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{driver.phone}</span>
                      </div>
                    )}
                  </div>

                  {driver.hasVehicle ? (
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm font-mono">{driver.vehicleReg}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {driver.vehicleType} • {driver.vehicleFuelType}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert className="bg-warning/10 border-warning/20">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <AlertDescription className="text-xs">
                        No vehicle allocated. Allocate a vehicle to enable job assignment.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-2">
                    {driver.hasVehicle && driver.vehicleId ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAllocateVehicle(driver.id)}
                          disabled={allocateVehicle.isPending || driver.status !== 'active'}
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          Change Vehicle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnallocateVehicle(driver.id, driver.vehicleId!)}
                          disabled={allocateVehicle.isPending || driver.status !== 'active'}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAllocateVehicle(driver.id)}
                        disabled={allocateVehicle.isPending || driver.status !== 'active'}
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        Allocate Vehicle
                      </Button>
                    )}
                    {driver.hasProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(driver.id)}
                        disabled={deleteProfile.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        )}
        </TabsContent>

        {/* Driver Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          {isLoadingInvites ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No driver invitations found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invites.map((invite: Invite) => {
                const isPending = invite.status === 'pending';
                const isAccepted = invite.status === 'accepted';
                const isExpired = invite.status === 'expired';
                const expiresDate = new Date(invite.expiresAt);
                const isExpiringSoon = isPending && expiresDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000; // 3 days

                return (
                  <Card key={invite.id} className={cn(
                    "transition-all",
                    isExpiringSoon && "border-warning/50 bg-warning/5"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium break-words">{invite.email}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "flex-shrink-0",
                                isPending && "bg-warning/10 text-warning border-warning/20",
                                isAccepted && "bg-success/10 text-success border-success/20",
                                isExpired && "bg-destructive/10 text-destructive border-destructive/20"
                              )}
                            >
                              {isPending && <Clock className="h-3 w-3 mr-1" />}
                              {isAccepted && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {isExpired && <XCircle className="h-3 w-3 mr-1" />}
                              {invite.status || 'pending'}
                            </Badge>
                            {isExpiringSoon && isPending && (
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 flex-shrink-0">
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Role: <span className="font-medium capitalize">{invite.role}</span>
                            </p>
                            <p className="break-words">
                              Sent: {new Date(invite.invitedAt).toLocaleDateString()} at {new Date(invite.invitedAt).toLocaleTimeString()}
                            </p>
                            {isPending && (
                              <p className={cn(isExpiringSoon && "text-warning font-medium", "break-words")}>
                                Expires: {expiresDate.toLocaleDateString()} ({Math.ceil((expiresDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days left)
                              </p>
                            )}
                            {isAccepted && invite.acceptedAt && (
                              <p className="text-success break-words">
                                Accepted: {new Date(invite.acceptedAt).toLocaleDateString()} at {new Date(invite.acceptedAt).toLocaleTimeString()}
                              </p>
                            )}
                            {isExpired && (
                              <p className="text-destructive break-words">
                                Expired: {expiresDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                          {isPending && invite.token && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const inviteUrl = `${window.location.origin}/invite?token=${invite.token}`;
                                navigator.clipboard.writeText(inviteUrl);
                                toast.success('Invitation link copied to clipboard');
                              }}
                              className="w-full sm:w-auto"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Link
                            </Button>
                          )}
                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInviteClick(invite)}
                              disabled={cancelInvite.isPending}
                              className="w-full sm:w-auto"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Allocate Vehicle Dialog */}
      <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Vehicle</DialogTitle>
            <DialogDescription>
              Select a vehicle to allocate to this driver. If the vehicle is already allocated to another driver, it will be automatically switched. Select "Unallocated" to remove the current vehicle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select
                value={drivers.find(d => d.id === driverToAllocate)?.vehicleId || "unallocated"}
                onValueChange={(value) => {
                  if (value === "unallocated") {
                    handleAllocateConfirm(null);
                  } else {
                    handleAllocateConfirm(value);
                  }
                }}
                disabled={allocateVehicle.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unallocated">Unallocated</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicleReg} ({vehicle.vehicleType} • {vehicle.vehicleFuelType})
                      {vehicle.driverId && vehicle.driverId !== driverToAllocate && (
                        <span className="text-muted-foreground"> - Allocated to {vehicle.driver?.name || 'another driver'}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAllocateDialogOpen(false);
                setDriverToAllocate(null);
              }}
              disabled={allocateVehicle.isPending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Driver Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this driver? This will permanently remove the driver account and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDriverToDelete(null);
              }}
              disabled={deleteProfile.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteProfile.isPending}
            >
              {deleteProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Driver
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Invite Confirmation Dialog */}
      <Dialog open={isCancelInviteDialogOpen} onOpenChange={setIsCancelInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the invitation to {inviteToCancel?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelInviteDialogOpen(false);
                setInviteToCancel(null);
              }}
              disabled={cancelInvite.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelInviteConfirm}
              disabled={cancelInvite.isPending}
            >
              {cancelInvite.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Drivers;

