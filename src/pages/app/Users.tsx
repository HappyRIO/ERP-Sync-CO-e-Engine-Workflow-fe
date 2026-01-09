import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users as UsersIcon, Mail, Building2, Shield, UserCheck, UserX, Loader2, Clock, CheckCircle2, UserPlus, Trash2, Copy, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUsers, useUpdateUserStatus, useApproveUser } from "@/hooks/useUsers";
import { useInvites, useCancelInvite } from "@/hooks/useInvites";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { UserRole } from "@/types/auth";
import type { Invite } from "@/types/auth";

const roleColors: Record<UserRole, string> = {
  admin: "bg-primary/10 text-primary",
  client: "bg-info/10 text-info",
  reseller: "bg-accent/10 text-accent",
  driver: "bg-warning/10 text-warning",
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'reseller'>('reseller'); // Only resellers can be invited from Users page
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteStatusFilter, setInviteStatusFilter] = useState<string>("all");

  const { data: users = [], isLoading, error } = useUsers({
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const updateStatus = useUpdateUserStatus();
  const approveUser = useApproveUser();
  const cancelInvite = useCancelInvite();

  // Fetch reseller invitations only
  const { data: resellerInvites = [], isLoading: isLoadingInvites } = useInvites(
    inviteStatusFilter !== "all" ? inviteStatusFilter as 'pending' | 'accepted' | 'expired' : undefined,
    'reseller' // Only fetch reseller invitations
  );

  // Create invite mutation
  const createInvite = useMutation({
    mutationFn: async (data: { email: string; role: 'client' | 'reseller' }) => {
      if (!currentUser?.tenantId || !currentUser?.tenantName || !currentUser?.id) {
        throw new Error('User information not found');
      }
      return authService.createInvite(
        data.email,
        data.role,
        currentUser.id,
        currentUser.tenantId,
        currentUser.tenantName
      );
    },
    onSuccess: (invite) => {
      toast.success('Invitation sent successfully!', {
        description: `An invitation has been sent to ${invite.email} as a ${invite.role}`,
      });
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole('reseller');
      // Invalidate users and invites queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
      await createInvite.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    updateStatus.mutate(
      { id: userId, isActive: !currentStatus },
      {
        onSuccess: () => {
          toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
        },
        onError: (error) => {
          toast.error("Failed to update user status", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  const handleApproveUser = async (userId: string) => {
    approveUser.mutate(userId, {
      onSuccess: () => {
        toast.success("User approved successfully");
      },
      onError: (error) => {
        toast.error("Failed to approve user", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      },
    });
  };

  const getUserStatus = (user: typeof users[0]) => {
    return user.status || (user.isActive ? 'active' : 'inactive');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load users. Please try refreshing the page.</AlertDescription>
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage platform users and access</p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Reseller
        </Button>
      </motion.div>

      {/* Invite Reseller Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Reseller</DialogTitle>
            <DialogDescription>
              Send an invitation to a new reseller. They will receive an email with instructions to join the platform and can then invite and manage clients.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="reseller@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isSendingInvite}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email address of the reseller you want to invite. Resellers can invite and manage clients, and create bookings on their behalf.
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
                  setInviteRole('reseller');
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

      {/* Tabs Interface */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            Users
            {filteredUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Reseller Invitations
            {resellerInvites.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {resellerInvites.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
              <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or organisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="reseller">Reseller</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
          </motion.div>

          {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No users found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <UsersIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground break-words">{user.name}</p>
                        <Badge className={cn("text-xs flex-shrink-0", roleColors[user.role])}>
                        {user.role}
                      </Badge>
                      {getUserStatus(user) === 'pending' ? (
                          <Badge variant="secondary" className="bg-warning/10 text-warning flex-shrink-0">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      ) : getUserStatus(user) === 'active' ? (
                          <Badge variant="secondary" className="bg-success/10 text-success flex-shrink-0">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                          <Badge variant="secondary" className="bg-destructive/10 text-destructive flex-shrink-0">
                          <UserX className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 min-w-0">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                      </span>
                        <span className="flex items-center gap-1 min-w-0">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.tenantName}</span>
                      </span>
                      {user.lastLogin && (
                        <span className="text-xs">
                          Last login: {new Date(user.lastLogin).toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 sm:flex-shrink-0">
                    {getUserStatus(user) === 'pending' ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                        disabled={approveUser.isPending}
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    ) : (
                      <Button
                        variant={getUserStatus(user) === 'active' ? "destructive" : "success"}
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        disabled={
                          updateStatus.isPending || 
                          (user.id === currentUser?.id && getUserStatus(user) === 'active')
                        }
                        title={
                          user.id === currentUser?.id && getUserStatus(user) === 'active'
                            ? "You cannot deactivate your own account"
                            : undefined
                        }
                        className="w-full sm:w-auto"
                      >
                        {getUserStatus(user) === 'active' ? "Deactivate" : "Activate"}
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

        {/* Reseller Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Reseller Invitations</h3>
              <p className="text-sm text-muted-foreground">
                Manage and track reseller invitations
              </p>
            </div>
            <Select value={inviteStatusFilter} onValueChange={setInviteStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invitations</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingInvites ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : resellerInvites.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No reseller invitations found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resellerInvites.map((invite: Invite) => {
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
                              onClick={() => {
                                if (confirm(`Are you sure you want to cancel the invitation to ${invite.email}?`)) {
                                  cancelInvite.mutate(invite.id);
                                }
                              }}
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
    </div>
  );
};

export default Users;

