import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Truck, Car, Trash2, Loader2, CheckCircle2, XCircle, AlertCircle, Phone, Mail, UserPlus, Clock, Copy } from "lucide-react";
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

  const { data: drivers = [], isLoading, error } = useDrivers();
  const { data: invites = [], isLoading: isLoadingInvites } = useInvites(undefined, 'driver');
  const deleteProfile = useDeleteDriverProfile();
  const cancelInvite = useCancelInvite();

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

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.vehicleReg.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });


  const handleDelete = async (driverId: string) => {
    if (!confirm("Are you sure you want to delete this driver? This will permanently remove the driver account and all associated data.")) {
      return;
    }

    deleteProfile.mutate(driverId, {
      onSuccess: () => {
        toast.success("Driver deleted successfully");
      },
      onError: (error) => {
        toast.error("Failed to delete driver", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
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
        <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
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
              Click "Invite Driver" to send an invitation. After the driver accepts, they can add their vehicle profile.
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

                  {driver.hasProfile ? (
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{driver.vehicleReg}</p>
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
                        No vehicle profile. Add vehicle information to enable assignment.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-2">
                    {driver.hasProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(driver.id)}
                        disabled={deleteProfile.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
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
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{invite.email}</span>
                            <Badge
                              variant="outline"
                              className={cn(
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
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Role: <span className="font-medium capitalize">{invite.role}</span>
                            </p>
                            <p>
                              Sent: {new Date(invite.invitedAt).toLocaleDateString()} at {new Date(invite.invitedAt).toLocaleTimeString()}
                            </p>
                            {isPending && (
                              <p className={cn(isExpiringSoon && "text-warning font-medium")}>
                                Expires: {expiresDate.toLocaleDateString()} ({Math.ceil((expiresDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days left)
                              </p>
                            )}
                            {isAccepted && invite.acceptedAt && (
                              <p className="text-success">
                                Accepted: {new Date(invite.acceptedAt).toLocaleDateString()} at {new Date(invite.acceptedAt).toLocaleTimeString()}
                              </p>
                            )}
                            {isExpired && (
                              <p className="text-destructive">
                                Expired: {expiresDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPending && invite.token && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const inviteUrl = `${window.location.origin}/invite?token=${invite.token}`;
                                navigator.clipboard.writeText(inviteUrl);
                                toast.success('Invitation link copied to clipboard');
                              }}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Link
                            </Button>
                          )}
                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to cancel the invitation to ${invite.email}?`)) {
                                  cancelInvite.mutate(invite.id);
                                }
                              }}
                              disabled={cancelInvite.isPending}
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

    </div>
  );
};

export default Drivers;

