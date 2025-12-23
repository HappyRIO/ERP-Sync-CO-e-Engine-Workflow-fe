import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, DollarSign, Calendar, Package, Loader2, CheckCircle2, Clock, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCommissions, useCommissionSummary, useUpdateCommissionStatus } from "@/hooks/useCommission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "bg-warning/10 text-warning" },
  approved: { label: "Approved", icon: CheckCircle2, color: "bg-info/10 text-info" },
  paid: { label: "Paid", icon: CheckCircle2, color: "bg-success/10 text-success" },
};

const Commission = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const { data: commissions = [], isLoading, error } = useCommissions({
    status: statusFilter !== "all" ? statusFilter : undefined,
    period: periodFilter !== "all" ? periodFilter : undefined,
  });
  const { data: summary, isLoading: isLoadingSummary } = useCommissionSummary();
  const updateStatus = useUpdateCommissionStatus();

  const handleStatusChange = (commissionId: string, currentStatus: string, newStatus: 'pending' | 'approved' | 'paid') => {
    updateStatus.mutate({ commissionId, status: newStatus });
  };

  const filteredCommissions = commissions.filter((comm) => {
    const matchesSearch =
      comm.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load commission records. Please try refreshing the page.</AlertDescription>
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
          <h2 className="text-2xl font-bold text-foreground">
            {isAdmin ? "Commission Management" : "Commission & Earnings"}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage commission statuses for resellers" 
              : "Track your commission and earnings"}
          </p>
        </div>
      </motion.div>

      {/* Admin Info Banner */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Alert className="bg-info/10 border-info/20 text-foreground">
            <AlertCircle className="h-4 w-4 text-info" />
            <AlertDescription className="flex flex-col gap-2">
              <strong className="text-info">Commission Management Flow:</strong>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li><strong>Pending:</strong> Commission is calculated after job completion. Review and verify the commission amount.</li>
                <li><strong>Approved:</strong> Click the three-dot menu (⋮) next to a pending commission and select "Approve" to approve it for payment.</li>
                <li><strong>Paid:</strong> After approval, mark it as "Paid" when the payment has been processed. This is the final status.</li>
              </ol>
              <p className="text-xs mt-2 text-muted-foreground">
                💡 Use the three-dot menu (⋮) on the right side of each commission record to update the status.
              </p>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Reseller Info Banner */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Alert className="bg-info/10 border-info/20 text-foreground">
            <AlertCircle className="h-4 w-4 text-info" />
            <AlertDescription>
              <strong>Commission Status Flow:</strong> Commissions start as <strong>Pending</strong> after job completion, 
              then move to <strong>Approved</strong> by Reuse admin, and finally to <strong>Paid</strong> when payment is processed. 
              You can track all statuses here.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Summary Cards */}
      {!isLoadingSummary && summary && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                  <p className="text-2xl font-bold">£{summary.totalAmount.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">£{summary.totalPending.toLocaleString()}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-info">£{summary.totalApproved.toLocaleString()}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-info" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-success">£{summary.totalPaid.toLocaleString()}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            placeholder="Search by client, job number, or booking..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Periods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            <SelectItem value="2024-12">December 2024</SelectItem>
            <SelectItem value="2024-11">November 2024</SelectItem>
            <SelectItem value="2024-10">October 2024</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Commissions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCommissions.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No commission records found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCommissions.map((comm, index) => {
            const statusInfo = statusConfig[comm.status] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={comm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={cn("p-3 rounded-xl", statusInfo.color)}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{comm.clientName}</p>
                        <Badge className={cn("text-xs", statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{comm.jobNumber}</span>
                        <span>•</span>
                        <Link 
                          to={`/bookings/${comm.bookingId}`}
                          className="font-mono text-xs hover:text-primary transition-colors"
                        >
                          {comm.bookingNumber}
                        </Link>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {comm.period}
                        </span>
                        {comm.paidDate && (
                          <>
                            <span>•</span>
                            <span>Paid: {new Date(comm.paidDate).toLocaleDateString("en-GB")}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Resale Value: £{comm.jobValue.toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>Commission Rate: {comm.commissionPercent}%</span>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="text-2xl font-bold">£{comm.commissionAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {comm.commissionPercent}% of £{comm.jobValue.toLocaleString()} resale value
                      </p>
                      <div className="flex items-center gap-2 mt-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          asChild
                        >
                          <Link to={`/bookings/${comm.bookingId}`}>
                            <FileText className="h-3 w-3 mr-1" />
                            View Booking
                          </Link>
                        </Button>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {comm.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(comm.id, comm.status, 'approved')}
                                  disabled={updateStatus.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-info" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {comm.status === 'approved' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(comm.id, comm.status, 'paid')}
                                  disabled={updateStatus.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {comm.status === 'paid' && (
                                <DropdownMenuItem disabled>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Already Paid
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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

export default Commission;

