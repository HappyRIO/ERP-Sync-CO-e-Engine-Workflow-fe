import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, FileText, Calendar, PoundSterling, Loader2, CheckCircle2, Clock, XCircle, Send, MoreVertical, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useInvoices, useSendInvoice, useMarkInvoiceAsPaid, useCancelInvoice } from "@/hooks/useInvoices";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  draft: { label: "Draft", icon: FileText, color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", icon: Clock, color: "bg-info/10 text-info" },
  paid: { label: "Paid", icon: CheckCircle2, color: "bg-success/10 text-success" },
  overdue: { label: "Overdue", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-destructive/10 text-destructive" },
};

const Invoices = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isReseller = user?.role === 'reseller';
  const isClient = user?.role === 'client';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cancelInvoiceId, setCancelInvoiceId] = useState<string | null>(null);

  const { data: invoices = [], isLoading, error } = useInvoices({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  
  const sendInvoice = useSendInvoice();
  const markAsPaid = useMarkInvoiceAsPaid();
  const cancelInvoice = useCancelInvoice();

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = filteredInvoices.filter(inv => ['sent', 'draft'].includes(inv.status)).reduce((sum, inv) => sum + inv.total, 0);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load invoices. Please try refreshing the page.</AlertDescription>
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
            {isAdmin ? "Invoice Management" : "Invoices"}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage and track all invoices" : "View and download your invoices"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices represent the buyback amount we pay you for your assets, not collection or processing costs.
          </p>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              Note: Invoices are generated and managed by Reuse (admin). Status updates are automatic when payments are processed.
            </p>
          )}
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
              <strong className="text-info">Invoice Management:</strong>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Draft:</strong> Invoices are automatically created when bookings are completed. Click the menu (⋮) to send.</li>
                <li><strong>Send:</strong> Click the menu (⋮) next to a draft invoice and select "Send Invoice" to send it to the client.</li>
                <li><strong>Mark as Paid:</strong> Click the menu (⋮) next to a sent/overdue invoice and select "Mark as Paid" when payment is received.</li>
                <li><strong>Cancel:</strong> You can cancel any invoice (except already cancelled) if needed.</li>
              </ul>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Reseller Info Banner */}
      {isReseller && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Alert className="bg-info/10 border-info/20 text-foreground">
            <AlertCircle className="h-4 w-4 text-info" />
            <AlertDescription>
              <strong className="text-info">Note:</strong> You can view invoices for your clients. These represent buyback amounts paid to your clients. Your commission is tracked separately on the Commission page.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Summary Cards */}
      {!isLoading && filteredInvoices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">£{totalAmount.toLocaleString()}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-success">£{paidAmount.toLocaleString()}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">£{pendingAmount.toLocaleString()}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
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
            placeholder="Search by invoice number, job number, or client..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Invoices List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No invoices found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice, index) => {
            const statusInfo = statusConfig[invoice.status] || statusConfig.draft;
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={invoice.id}
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
                        <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                        <Badge className={cn("text-xs", statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{invoice.clientName}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{invoice.jobNumber}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(invoice.dueDate).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-2xl font-bold">£{invoice.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {new Date(invoice.issueDate).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.downloadUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  sendInvoice.mutate(invoice.id, {
                                    onSuccess: () => {
                                      toast.success("Invoice sent successfully!", {
                                        description: `Invoice ${invoice.invoiceNumber} has been sent to ${invoice.clientName}.`,
                                      });
                                    },
                                    onError: (error) => {
                                      toast.error("Failed to send invoice", {
                                        description: error instanceof Error ? error.message : "Please try again.",
                                      });
                                    },
                                  });
                                }}
                                disabled={sendInvoice.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Invoice
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <DropdownMenuItem
                                onClick={() => {
                                  markAsPaid.mutate(invoice.id, {
                                    onSuccess: () => {
                                      toast.success("Invoice marked as paid!", {
                                        description: `Invoice ${invoice.invoiceNumber} has been marked as paid.`,
                                      });
                                    },
                                    onError: (error) => {
                                      toast.error("Failed to mark invoice as paid", {
                                        description: error instanceof Error ? error.message : "Please try again.",
                                      });
                                    },
                                  });
                                }}
                                disabled={markAsPaid.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== 'cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setCancelInvoiceId(invoice.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Invoice
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cancel Invoice Confirmation Dialog */}
      <AlertDialog open={!!cancelInvoiceId} onOpenChange={(open) => !open && setCancelInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invoice? This action cannot be undone.
              {cancelInvoiceId && (
                <span className="block mt-2 font-mono text-sm">
                  Invoice: {invoices.find(i => i.id === cancelInvoiceId)?.invoiceNumber}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelInvoiceId) {
                  cancelInvoice.mutate(cancelInvoiceId, {
                    onSuccess: () => {
                      toast.success("Invoice cancelled successfully!", {
                        description: `Invoice has been cancelled.`,
                      });
                      setCancelInvoiceId(null);
                    },
                    onError: (error) => {
                      toast.error("Failed to cancel invoice", {
                        description: error instanceof Error ? error.message : "Please try again.",
                      });
                    },
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelInvoice.isPending}
            >
              {cancelInvoice.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Invoice"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Invoices;

