import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  FileCheck,
  Package,
  XCircle,
  MapPin,
  Calendar,
  PoundSterling,
  Leaf,
  AlertCircle,
  Shield,
  Award,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBooking, useApproveBooking, useUpdateBookingStatus, useCompleteBooking } from "@/hooks/useBookings";
import { useGradingRecords } from "@/hooks/useGrading";
import { useSanitisationRecords } from "@/hooks/useSanitisation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

const BookingApproval = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading: isLoadingBooking } = useBooking(id || null);
  const { data: gradingRecords = [] } = useGradingRecords(id);
  const { data: sanitisationRecords = [] } = useSanitisationRecords(id);
  const approveBooking = useApproveBooking();
  const cancelBooking = useUpdateBookingStatus();
  const completeBooking = useCompleteBooking();
  const [approvalNotes, setApprovalNotes] = useState("");
  const [erpJobNumber, setErpJobNumber] = useState("");
  const [cancellationNotes, setCancellationNotes] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  
  const isGraded = booking?.status === 'graded';
  const isPending = booking?.status === 'pending';

  const handleApprove = () => {
    if (!id) return;

    if (!erpJobNumber.trim()) {
      toast.error("Job ID is required", {
        description: "Please enter a unique Job ID before approving the booking.",
      });
      return;
    }

    approveBooking.mutate(
      { bookingId: id, erpJobNumber: erpJobNumber.trim(), notes: approvalNotes || undefined },
      {
        onSuccess: () => {
          toast.success("Booking approved successfully!", {
            description: "The booking has been approved and is now active.",
          });
          navigate("/admin/bookings");
        },
        onError: (error) => {
          toast.error("Failed to approve booking", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  const handleCancel = () => {
    if (!id) return;

    if (!cancellationNotes.trim()) {
      toast.error("Cancellation reason required", {
        description: "Please provide a reason for cancelling this booking.",
      });
      return;
    }

    cancelBooking.mutate(
      { bookingId: id, status: 'cancelled', notes: cancellationNotes },
      {
        onSuccess: () => {
          toast.success("Booking cancelled", {
            description: "The booking has been cancelled.",
          });
          navigate("/admin/bookings");
        },
        onError: (error) => {
          toast.error("Failed to cancel booking", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  if (isLoadingBooking) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Booking not found</AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/admin/bookings" className="text-inherit no-underline">Back to Booking Queue</Link>
        </Button>
      </div>
    );
  }

  // Handle bookings that are not in pending or graded status
  if (!isPending && !isGraded) {
    const statusMessages: Record<string, { message: string; variant: 'default' | 'destructive' | 'success' }> = {
      'created': {
        message: 'This booking has already been approved and is now active.',
        variant: 'success',
      },
      'completed': {
        message: 'This booking has already been completed.',
        variant: 'success',
      },
      'cancelled': {
        message: 'This booking has been cancelled.',
        variant: 'destructive',
      },
      'scheduled': {
        message: 'This booking has been scheduled and assigned to a driver.',
        variant: 'default',
      },
    };

    const statusInfo = statusMessages[booking.status] || {
      message: `This booking is in "${booking.status}" status and cannot be approved from this page.`,
      variant: 'default' as const,
    };

    return (
      <div className="space-y-6">
        <Alert variant={statusInfo.variant}>
          <AlertDescription>
            {statusInfo.message}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/admin/bookings" className="text-inherit no-underline">Back to Booking Queue</Link>
        </Button>
      </div>
    );
  }
  
  // For graded bookings, calculate completion data
  const allAssetsGraded = isGraded ? booking?.assets.every(asset => {
    return gradingRecords.some(record => record.assetId === asset.categoryId);
  }) : false;
  
  const allAssetsSanitised = isGraded ? booking?.assets.every(asset => {
    return sanitisationRecords.some(record => record.assetId === asset.categoryId);
  }) : false;
  
  const totalResaleValue = isGraded ? gradingRecords.reduce((sum, record) => {
    const asset = booking?.assets.find(a => a.categoryId === record.assetId);
    return sum + (record.resaleValue * (asset?.quantity || 1));
  }, 0) : 0;
  
  const uniqueGradedAssets = isGraded ? new Set(gradingRecords.map(r => r.assetId)).size : 0;
  const uniqueSanitisedAssets = isGraded ? new Set(sanitisationRecords.map(r => r.assetId)).size : 0;
  
  const verifiedAssetsCount = isGraded ? booking?.assets.filter(asset => {
    const assetRecords = sanitisationRecords.filter(r => r.assetId === asset.categoryId);
    return assetRecords.length > 0 && assetRecords.every(r => r.verified);
  }).length || 0 : 0;
  
  const completionChecklist = isGraded ? [
    {
      id: 'graded',
      label: 'All assets graded',
      completed: allAssetsGraded || false,
      count: `${uniqueGradedAssets}/${booking?.assets.length || 0} assets`,
    },
    {
      id: 'sanitised',
      label: 'All assets sanitised',
      completed: allAssetsSanitised || false,
      count: `${uniqueSanitisedAssets}/${booking?.assets.length || 0} assets`,
    },
    {
      id: 'verified',
      label: 'All sanitisation verified',
      completed: uniqueSanitisedAssets > 0 && verifiedAssetsCount === uniqueSanitisedAssets,
      count: `${verifiedAssetsCount}/${uniqueSanitisedAssets} assets verified`,
    },
  ] : [];
  
  const allProcessesComplete = isGraded ? completionChecklist.every(item => item.completed) : true;
  
  const handleComplete = () => {
    if (!id) return;
    
    if (!allProcessesComplete) {
      toast.error("Cannot approve booking", {
        description: "Some required processes appear incomplete. Please verify all steps have been completed.",
      });
      return;
    }
    
    completeBooking.mutate(id, {
      onSuccess: () => {
        toast.success("Booking approved and completed successfully!", {
          description: "The booking has been marked as completed.",
        });
        navigate("/admin/bookings");
      },
      onError: (error) => {
        toast.error("Failed to complete booking", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      },
    });
  };

  const totalAssets = booking.assets.reduce((sum, a) => sum + a.quantity, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/bookings" className="text-inherit no-underline">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">
            {isGraded ? 'Final Approval' : 'Booking Approval'}
          </h2>
          <p className="text-muted-foreground">{booking.bookingNumber} - {booking.organisationName || booking.clientName}</p>
        </div>
        <Badge className={isGraded ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
          {isGraded ? 'Ready for Final Approval' : 'Pending Approval'}
        </Badge>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{totalAssets}</p>
              </div>
              <Package className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isGraded ? 'Resale Value' : 'Estimated Buyback'}
                </p>
                <p className="text-2xl font-bold">
                  £{isGraded ? totalResaleValue.toLocaleString() : booking.estimatedBuyback.toLocaleString()}
                </p>
              </div>
              <PoundSterling className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CO₂e Saved</p>
                <p className="text-2xl font-bold">{(booking.estimatedCO2e / 1000).toFixed(1)}t</p>
              </div>
              <Leaf className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Collection Site</p>
                <p className="text-muted-foreground">{booking.siteName}</p>
                <p className="text-muted-foreground text-xs">{booking.siteAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Scheduled Date</p>
                <p className="text-muted-foreground">
                  {new Date(booking.scheduledDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {booking.preferredVehicleType && (
            <div className="flex items-center gap-2 text-sm">
              <p className="font-medium">Preferred Vehicle Type:</p>
              <Badge variant="outline">
                {booking.preferredVehicleType.charAt(0).toUpperCase() + booking.preferredVehicleType.slice(1)}
              </Badge>
            </div>
          )}

          {booking.charityPercent > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <p className="font-medium">Charity Donation:</p>
              <Badge variant="outline">{booking.charityPercent}%</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Verification Summary - Only for graded bookings */}
      {isGraded && (
        <Card className="bg-success/5 border-success/20 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Process Verification Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              All required processes have been completed. This booking is ready for final approval.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {completionChecklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background border border-success/10"
              >
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-success">
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.count}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Grading Summary - Only for graded bookings */}
      {isGraded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Grading Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.assets.map((asset) => {
                const records = gradingRecords.filter(r => r.assetId === asset.categoryId);
                const totalValue = records.reduce((sum, r) => sum + (r.resaleValue * asset.quantity), 0);
                
                return (
                  <div key={asset.categoryId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">{asset.categoryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.quantity} units • {records.length > 0 ? `Grade: ${records[0].grade}` : 'Not graded'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">£{totalValue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Resale value</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sanitisation Summary - Only for graded bookings */}
      {isGraded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sanitisation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.assets.map((asset) => {
                const records = sanitisationRecords.filter(r => r.assetId === asset.categoryId);
                
                return (
                  <div key={asset.categoryId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">{asset.categoryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {records.length > 0 
                          ? `Method: ${records[0].method.replace('-', ' ')}`
                          : 'Not sanitised'}
                      </p>
                    </div>
                    <div className="text-right">
                      {records.length > 0 && records[0].verified ? (
                        <Badge className="bg-success/10 text-success">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets List - Only for pending bookings */}
      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.assets.map((asset) => (
                <div key={asset.categoryId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{asset.categoryName}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {asset.quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Actions */}
      {!showCancelForm ? (
        <Card className={isGraded ? "border-2 border-success/20 bg-success/5" : "border-2 border-warning/20 bg-warning/5"}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className={`flex items-center gap-2 ${isGraded ? 'text-success' : 'text-warning'}`}>
                {isGraded ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <p className="font-medium">
                  {isGraded 
                    ? 'All requirements met. Ready for final approval.'
                    : 'Review booking details before approval'}
                </p>
              </div>
              
              {isPending && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="erp-job-number" className="text-sm font-medium">
                      Job ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="erp-job-number"
                      placeholder="Enter unique Job ID from ERP system"
                      value={erpJobNumber}
                      onChange={(e) => setErpJobNumber(e.target.value)}
                      required
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the unique Job ID from the ERP system. This will be used to link the booking to the ERP job.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approval-notes" className="text-sm font-medium">
                      Approval Notes (Optional)
                    </Label>
                    <Textarea
                      id="approval-notes"
                      placeholder="Add any notes about this approval..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                {isGraded ? (
                  <>
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleComplete}
                      disabled={completeBooking.isPending || !allProcessesComplete}
                      className="w-auto"
                    >
                      {completeBooking.isPending ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <FileCheck />
                          Approve & Complete Booking
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                    >
                      <Link to={`/bookings/${id}/grading`}>
                        <Download />
                        View Full Report
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleApprove}
                      disabled={approveBooking.isPending || !erpJobNumber.trim()}
                    >
                      {approveBooking.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve Booking
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => setShowCancelForm(true)}
                      disabled={approveBooking.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isPending ? (
        <Card className="border-2 border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Cancel Booking</p>
              </div>
              
              <Alert variant="destructive">
                <AlertDescription>
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label htmlFor="cancellation-notes" className="text-sm font-medium">
                  Cancellation Reason <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="cancellation-notes"
                  placeholder="Please provide a reason for cancelling this booking..."
                  value={cancellationNotes}
                  onChange={(e) => setCancellationNotes(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleCancel}
                  disabled={cancelBooking.isPending}
                >
                  {cancelBooking.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Confirm Cancellation
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowCancelForm(false);
                    setCancellationNotes("");
                  }}
                  disabled={cancelBooking.isPending}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default BookingApproval;

