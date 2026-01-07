import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Loader2, Plus, PoundSterling, CheckCircle2, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBooking, useUpdateBookingStatus } from "@/hooks/useBookings";
import { useGradingRecords, useCreateGradingRecord, useCalculateResaleValue, useCalculateResaleValueFn } from "@/hooks/useGrading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const grades: { value: 'A' | 'B' | 'C'; label: string; color: string }[] = [
  { value: 'A', label: 'Grade A', color: 'bg-success/10 text-success' },
  { value: 'B', label: 'Grade B', color: 'bg-info/10 text-info' },
  { value: 'C', label: 'Grade C', color: 'bg-warning/10 text-warning' },
];

const Grading = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: booking, isLoading: isLoadingBooking } = useBooking(id || null);
  const { data: records = [], isLoading: isLoadingRecords } = useGradingRecords(id);
  const createRecord = useCreateGradingRecord();
  const calculateResaleValueFn = useCalculateResaleValueFn();
  const updateBookingStatus = useUpdateBookingStatus();
  
  // State declarations must come before they're used
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  
  // Get selected asset for resale value calculation
  const selectedAsset = booking?.assets.find(a => a.categoryId === selectedAssetId);
  const { data: estimatedResaleValue = 0 } = useCalculateResaleValue(
    selectedAsset?.categoryName || selectedAsset?.categoryId,
    grade as any,
    selectedAsset?.quantity || 0
  );

  const handleCreateRecord = async () => {
    if (!id || !selectedAssetId || !grade || !user) {
      toast.error("Please fill in all required fields");
      return;
    }

    const asset = booking?.assets.find(a => a.categoryId === selectedAssetId);
    if (!asset) {
      toast.error("Asset not found");
      return;
    }

    const resaleValue = await calculateResaleValueFn(asset.categoryName || asset.categoryId, grade as any, asset.quantity);

    createRecord.mutate(
      {
        bookingId: id,
        assetId: selectedAssetId,
        assetCategory: asset.categoryName || asset.categoryId, // Use category name, fallback to ID
        grade: grade as any,
        gradedBy: user.id,
        condition: condition || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Grading record created successfully!", {
            description: `Resale value calculated: £${resaleValue.toLocaleString()}`,
          });
          setShowForm(false);
          setSelectedAssetId("");
          setGrade("");
          setCondition("");
          setNotes("");
        },
        onError: (error) => {
          toast.error("Failed to create grading record", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  if (isLoadingBooking || isLoadingRecords) {
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

  if (booking.status !== 'sanitised' && booking.status !== 'graded' && booking.status !== 'completed') {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Grading can only be performed on sanitised bookings. Current status: {booking.status}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/admin/bookings" className="text-inherit no-underline">Back to Booking Queue</Link>
        </Button>
      </div>
    );
  }

  // Group records by asset
  const recordsByAsset = records.reduce((acc, record) => {
    if (!acc[record.assetId]) {
      acc[record.assetId] = [];
    }
    acc[record.assetId].push(record);
    return acc;
  }, {} as Record<string, typeof records>);

  const totalResaleValue = records.reduce((sum, r) => sum + (r.resaleValue * (booking.assets.find(a => a.categoryId === r.assetId)?.quantity || 1)), 0);

  // Check if all assets are graded
  const allAssetsGraded = booking?.assets.every(asset => {
    return records.some(record => record.assetId === asset.categoryId);
  });

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
          <h2 className="text-2xl font-bold text-foreground">Asset Grading</h2>
          <p className="text-muted-foreground">{booking.bookingNumber} - {booking.organisationName || booking.clientName}</p>
        </div>
        {!showForm && (
          <Button variant="default" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Grade Asset
          </Button>
        )}
      </motion.div>

      {/* Summary Card */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Resale Value</p>
              <p className="text-3xl font-bold">£{totalResaleValue.toLocaleString()}</p>
            </div>
            <PoundSterling className="h-8 w-8 text-accent" />
          </div>
          {allAssetsGraded && booking.status === 'graded' && (
            <div className="mt-4 pt-4 border-t border-accent/20">
              <Button variant="success" className="w-full" onClick={() => navigate(`/admin/booking-approval/${id}`)}>
                <FileCheck className="h-4 w-4 mr-2" />
                Proceed to Final Approval
              </Button>
            </div>
          )}
          {allAssetsGraded && booking.status === 'sanitised' && (
            <div className="mt-4 pt-4 border-t border-accent/20">
              <Button 
                variant="success" 
                size="lg"
                className="w-full" 
                onClick={() => {
                  if (!id) return;
                  updateBookingStatus.mutate(
                    { bookingId: id, status: 'graded' },
                    {
                      onSuccess: () => {
                        toast.success("Booking moved to graded status", {
                          description: "All assets have been graded.",
                        });
                        navigate(`/admin/booking-approval/${id}`);
                      },
                      onError: (error) => {
                        toast.error("Failed to update booking status", {
                          description: error instanceof Error ? error.message : "Please try again.",
                        });
                      },
                    }
                  );
                }}
                disabled={updateBookingStatus.isPending}
              >
                {updateBookingStatus.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Approve & Move to Graded
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Record Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Grade Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset Category</Label>
                <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Select asset category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {booking.assets.map((asset) => (
                      <SelectItem key={asset.categoryId} value={asset.categoryId}>
                        {asset.categoryName} ({asset.quantity} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select grade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAssetId && grade && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Estimated Resale Value</p>
                  <p className="text-xl font-bold">
                    £{estimatedResaleValue.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="condition">Physical Condition</Label>
                <Input
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="Describe the physical condition..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about the grading..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handleCreateRecord}
                  disabled={!selectedAssetId || !grade || createRecord.isPending}
                >
                  {createRecord.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Award />
                      Create Grade
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Grading Records */}
      <div className="space-y-4">
        {booking.assets.map((asset) => {
          const assetRecords = recordsByAsset[asset.categoryId] || [];
          const assetRecord = assetRecords[0]; // Use first record if multiple

          return (
            <Card key={asset.categoryId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{asset.categoryName}</CardTitle>
                  <Badge variant="secondary">{asset.quantity} units</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!assetRecord ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Not yet graded
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <Badge className={cn("text-sm", grades.find(g => g.value === assetRecord.grade)?.color)}>
                            Grade {assetRecord.grade}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Resale Value:</span> <span className="font-semibold text-foreground">£{assetRecord.resaleValue.toLocaleString()} per unit</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Total Value:</span> <span className="font-semibold text-foreground">£{(assetRecord.resaleValue * asset.quantity).toLocaleString()}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Graded:</span> <span className="text-foreground">{new Date(assetRecord.gradedAt).toLocaleString("en-GB")}</span>
                          </p>
                          {assetRecord.condition && (
                            <p><span className="text-muted-foreground">Condition:</span> <span className="text-foreground">{assetRecord.condition}</span></p>
                          )}
                          {assetRecord.notes && (
                            <p><span className="text-muted-foreground">Notes:</span> <span className="text-foreground">{assetRecord.notes}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Grading;

