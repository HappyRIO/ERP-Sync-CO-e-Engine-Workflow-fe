import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Building2, Mail, Phone, Package, PoundSterling, Loader2, CheckCircle2, Clock, XCircle, MoreVertical, UserPlus, X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useClients, useUpdateClientStatus } from "@/hooks/useClients";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  active: { label: "Active", icon: CheckCircle2, color: "bg-success/10 text-success" },
  inactive: { label: "Inactive", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  pending: { label: "Pending", icon: Clock, color: "bg-warning/10 text-warning" },
};

const Clients = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const updateStatus = useUpdateClientStatus();
  const isReseller = user?.role === 'reseller';
  const isAdmin = user?.role === 'admin';

  // Create invite mutation
  const createInvite = useMutation({
    mutationFn: async (email: string) => {
      // For admin: use platform tenant, for reseller: use their tenant
      const tenantId = isAdmin ? 'tenant-1' : user?.tenantId; // tenant-1 is platform/admin tenant
      const tenantName = isAdmin ? 'Reuse ITAD Platform' : user?.tenantName;
      
      if (!tenantId || !tenantName) {
        throw new Error('Tenant information not found');
      }
      return authService.createInvite(
        email,
        'client',
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
      // Invalidate clients query to refresh list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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

  const { data: clients = [], isLoading, error } = useClients({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Show error state first
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load clients. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleStatusChange = (clientId: string, clientName: string, newStatus: 'active' | 'inactive' | 'pending') => {
    updateStatus.mutate(
      { clientId, status: newStatus },
      {
        onSuccess: () => {
          toast.success("Client status updated", {
            description: `${clientName} is now ${newStatus}`,
          });
        },
        onError: (error) => {
          toast.error("Failed to update client status", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Client Management</h2>
          <p className="text-muted-foreground">
            {user?.role === "admin" ? "Manage all platform clients" : "Manage your clients"}
          </p>
        </div>
        {(isReseller || isAdmin) && (
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Client
          </Button>
        )}
      </motion.div>

      {/* Client Invitation Info Banner - for Resellers and Admin */}
      {(isReseller || isAdmin) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Alert className="bg-info/10 border-info/20 text-foreground">
            <AlertCircle className="h-4 w-4 text-info" />
            <AlertDescription className="flex flex-col gap-2">
              <strong className="text-info">Client Invitation Flow:</strong>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Who can invite:</strong> {isAdmin ? 'Admin and resellers can invite clients to join the platform.' : 'Only resellers can invite clients to join the platform.'}
                </p>
                <p>
                  <strong>How to invite:</strong> Click the "Invite Client" button above, enter the client's email address, and send the invitation.
                </p>
                <p>
                  <strong>What happens next:</strong> 
                </p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>The client receives an email invitation with a secure link</li>
                  <li>They click the link and are taken to the invitation acceptance page</li>
                  <li>They set up their account (name and password)</li>
                  <li>Once registered, they appear in your client list and can access the platform</li>
                </ol>
                <p className="text-xs mt-2 text-muted-foreground">
                  💡 Invitations expire after 14 days. Clients must accept the invitation within this period.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Invite Client Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Client</DialogTitle>
            <DialogDescription>
              {isAdmin 
                ? "Send an invitation to a new client. They will receive an email with instructions to join the platform."
                : "Send an invitation to a new client. They will receive an email with instructions to join your platform."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="client@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isSendingInvite}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The client will receive an invitation email with a link to create their account.
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
            placeholder="Search by name, email, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Clients List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No clients found matching your criteria</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client, index) => {
            const statusInfo = statusConfig[client.status] || statusConfig.active;
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", statusInfo.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        {user?.role === 'admin' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(client.id, client.name, 'active')}
                                disabled={client.status === 'active'}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                                Set Active
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(client.id, client.name, 'inactive')}
                                disabled={client.status === 'inactive'}
                              >
                                <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                Set Inactive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(client.id, client.name, 'pending')}
                                disabled={client.status === 'pending'}
                              >
                                <Clock className="h-4 w-4 mr-2 text-warning" />
                                Set Pending
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{client.name}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{client.contactPhone}</span>
                      </div>
                      <div className="text-xs">
                        Contact: {client.contactName}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{client.totalBookings}</p>
                        <p className="text-xs text-muted-foreground">Bookings</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{client.totalJobs}</p>
                        <p className="text-xs text-muted-foreground">Jobs</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">£{(client.totalValue / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-muted-foreground">Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Clients;

