import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, FileText, Calendar, PoundSterling, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useInvoices } from "@/hooks/useInvoices";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  draft: { label: "Draft", icon: FileText, color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", icon: Clock, color: "bg-info/10 text-info" },
  paid: { label: "Paid", icon: CheckCircle2, color: "bg-success/10 text-success" },
  overdue: { label: "Overdue", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-destructive/10 text-destructive" },
};

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices = [], isLoading, error } = useInvoices({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

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
          <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
          <p className="text-muted-foreground">View and download your invoices</p>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices represent the buyback amount we pay you for your assets, not collection or processing costs.
          </p>
        </div>
      </motion.div>

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
                    <Button variant="outline" size="sm" asChild>
                      <a href={invoice.downloadUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
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

export default Invoices;

