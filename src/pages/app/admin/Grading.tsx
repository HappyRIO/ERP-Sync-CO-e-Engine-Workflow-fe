import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Loader2, Plus, PoundSterling, CheckCircle2, FileCheck, ArrowRight, X } from "lucide-react";
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
import { categoryRequiresImei, getUnderlyingAssetCategoryNameForJml } from "@/lib/jml-assets";
import { buildJmlDeviceDetailsMapFromBooking } from "@/lib/jml-booking-device-details";

const grades: { value: 'A' | 'B' | 'C' | 'D' | 'Q'; label: string; color: string }[] = [
  { value: 'A', label: 'Grade A', color: 'bg-success/10 text-success' },
  { value: 'B', label: 'Grade B', color: 'bg-info/10 text-info' },
  { value: 'C', label: 'Grade C', color: 'bg-warning/10 text-warning' },
  { value: 'D', label: 'Grade D', color: 'bg-destructive/10 text-destructive' },
  { value: 'Q', label: 'Grade Q', color: 'bg-destructive/10 text-destructive' },
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
  const [condition, setCondition] = useState<string>(""); // conditionCode
  const [notes, setNotes] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [serialNumbersText, setSerialNumbersText] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [serialInput, setSerialInput] = useState<string>("");
  const [imeiNumbersText, setImeiNumbersText] = useState<string>("");
  const [imeiInput, setImeiInput] = useState<string>("");

  const selectedAsset = booking?.assets.find(a => a.categoryId === selectedAssetId);

  const selectedCategoryRequiresImei = useMemo(() => {
    if (!selectedAsset) return false;
    return categoryRequiresImei(selectedAsset.categoryName || "");
  }, [selectedAsset]);

  // Pull device make/model from booking status history (JML creates these notes).
  const deviceDetailsMap = useMemo(() => {
    const map = new Map<string, { make?: string; model?: string; deviceType?: string }>();
    if (!booking) return map;

    const statusHistory = (booking as any).statusHistory as Array<{ notes?: string }> | undefined;
    if (!statusHistory?.length) return map;

    const isBreakfix = booking?.jmlSubType === 'breakfix';
    const creationHistory = statusHistory.find(h =>
      h.notes &&
      (isBreakfix
        ? h.notes.includes('Replacement Device details:')
        : h.notes.includes('Device details:'))
    );
    if (!creationHistory?.notes) return map;

    try {
      // Prefer extracting the broken-device "Device details" block when breakfix notes contain both:
      // "... Device details: <brokenArray>. Replacement Device details: <replacementArray>"
            const deviceDetailsMatch =
              creationHistory.notes.match(
                /Device details:\s*(\[[\s\S]*?\])(?=\s*\.?\s*Replacement Device details:|$)/i
              ) || creationHistory.notes.match(/Device details:\s*(\[[\s\S]*?\])/i);
      if (!deviceDetailsMatch) return map;

      const deviceDetails = JSON.parse(deviceDetailsMatch[1]);
      deviceDetails.forEach((device: any) => {
        if (!device?.category) return;

        const rawCategory = String(device.category).trim();
        const normalizedKey = rawCategory.toLowerCase();

        // Store under lowercased UI category key (e.g. "Phone")
        map.set(normalizedKey, {
          make: device.make,
          model: device.model,
          deviceType: device.deviceType,
        });

        // Also store under underlying DB category name when possible
        // Example: UI "Phone" -> DB "Smart Phones"
        const underlyingCategory = getUnderlyingAssetCategoryNameForJml(rawCategory);
        if (underlyingCategory) {
          map.set(underlyingCategory.toLowerCase(), {
            make: device.make,
            model: device.model,
            deviceType: device.deviceType,
          });
        }
      });
    } catch {
      // Ignore parse errors; grading can still proceed without device details.
    }

    return map;
  }, [booking]);

  const selectedAssetDevice = useMemo(() => {
    if (!selectedAsset) return undefined;
    const categoryNameKey = selectedAsset.categoryName
      ? String(selectedAsset.categoryName).trim().toLowerCase()
      : "";
    const categoryIdKey = selectedAsset.categoryId
      ? String(selectedAsset.categoryId).trim().toLowerCase()
      : "";

    const byName = categoryNameKey ? deviceDetailsMap.get(categoryNameKey) : undefined;
    if (byName) return byName;

    const byId = categoryIdKey ? deviceDetailsMap.get(categoryIdKey) : undefined;
    if (byId) return byId;

    return undefined;
  }, [deviceDetailsMap, selectedAsset]);

  const autoConditionCode = useMemo(() => {
    const g = (grade || '').trim().toUpperCase();
    if (!g) return '';

    const make = (selectedAssetDevice?.make || '').trim();
    if (!make) return '';

    const prefix = make.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
    if (!prefix) return '';
    return `${prefix}${g.slice(0, 1)}`;
  }, [grade, selectedAssetDevice?.make]);

  useEffect(() => {
    if (autoConditionCode) setCondition(autoConditionCode);
  }, [autoConditionCode]);
  const alreadyGradedQtyForSelected = useMemo(() => {
    if (!selectedAssetId) return 0;
    return records
      .filter(r => r.assetId === selectedAssetId)
      .reduce((sum, r) => sum + (r.quantity || 0), 0);
  }, [records, selectedAssetId]);
  const remainingQtyForSelected = Math.max(0, (selectedAsset?.quantity || 0) - alreadyGradedQtyForSelected);

  const parsedSerialNumbers = useMemo(() => {
    return serialNumbersText
      .split(/[\n,]+/g)
      .map(s => s.trim())
      .filter(Boolean);
  }, [serialNumbersText]);

  const parsedImeiNumbers = useMemo(() => {
    return imeiNumbersText
      .split(/[\n,]+/g)
      .map(s => s.trim())
      .filter(Boolean);
  }, [imeiNumbersText]);

  const { data: estimatedResaleValue = 0 } = useCalculateResaleValue(
    selectedAsset?.categoryName || selectedAsset?.categoryId,
    grade as any,
    quantity || 0
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

    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Quantity must be a positive whole number");
      return;
    }
    if (quantity > remainingQtyForSelected) {
      toast.error("Quantity exceeds remaining ungraded units", {
        description: `Remaining: ${remainingQtyForSelected}`,
      });
      return;
    }
    const finalCondition = (autoConditionCode || condition).trim();
    if (!finalCondition) {
      toast.error("Condition code is required", {
        description: "Device make is missing, so condition code could not be auto-generated.",
      });
      return;
    }
    if (['A', 'B', 'C'].includes(grade)) {
      if (parsedSerialNumbers.length !== quantity) {
        toast.error("Serial numbers required for inventory grades", {
          description: `Enter exactly ${quantity} serial number(s) for Grade ${grade}.`,
        });
        return;
      }
      if (categoryRequiresImei(asset.categoryName || "")) {
        if (parsedImeiNumbers.length !== quantity) {
          toast.error("IMEI required for this category", {
            description: `Enter exactly ${quantity} IMEI(s) for ${asset.categoryName}.`,
          });
          return;
        }
      }
    }

    const resaleValue = await calculateResaleValueFn(asset.categoryName || asset.categoryId, grade as any, quantity);

    createRecord.mutate(
      {
        bookingId: id,
        assetId: selectedAssetId,
        assetCategory: asset.categoryName || asset.categoryId, // Use category name, fallback to ID
        grade: grade as any,
        gradedBy: user.id,
        condition: finalCondition || undefined,
        notes: notes || undefined,
        quantity,
        serialNumbers: ['A', 'B', 'C'].includes(grade) ? parsedSerialNumbers : [],
        imeiNumbers:
          ['A', 'B', 'C'].includes(grade) && categoryRequiresImei(asset.categoryName || "")
            ? parsedImeiNumbers
            : undefined,
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
          setQuantity(1);
          setSerialNumbersText("");
          setImeiNumbersText("");
          setImeiInput("");
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

  const isMoverAtWarehouse =
    booking.bookingType === 'jml' &&
    booking.jmlSubType === 'mover' &&
    booking.status === 'warehouse';

  if (
    booking.status !== 'sanitised' &&
    booking.status !== 'graded' &&
    booking.status !== 'completed' &&
    !isMoverAtWarehouse
  ) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Grading can only be performed on sanitised or graded bookings (JML mover: at warehouse). Current status:{' '}
            {booking.status}
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

  const totalResaleValue = records.reduce((sum, r) => sum + (r.resaleValue * (r.quantity || 1)), 0);

  // Require at least one job asset; `[].every(...)` is vacuously true and would show the button too early (e.g. some mover payloads).
  const allAssetsGraded =
    Array.isArray(booking?.assets) &&
    booking.assets.length > 0 &&
    booking.assets.every((asset) => {
      const gradedQty = records
        .filter((r) => r.assetId === asset.categoryId)
        .reduce((s, r) => s + (r.quantity || 0), 0);
      return gradedQty >= asset.quantity;
    });

  const isJmlInventoryAfterGrading =
    booking.bookingType === 'jml' &&
    (booking.jmlSubType === 'leaver' ||
      booking.jmlSubType === 'breakfix' ||
      booking.jmlSubType === 'mover');
  const isJmlMover = booking.bookingType === 'jml' && booking.jmlSubType === 'mover';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/bookings" className="text-inherit no-underline">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">Asset Grading</h2>
          <p className="text-muted-foreground">{booking.bookingNumber} - {booking.organisationName || booking.clientName}</p>
          </div>
        </div>
        {!showForm && (
          <Button variant="default" onClick={() => setShowForm(true)} className="w-full sm:w-auto">
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
          {allAssetsGraded &&
            (booking.status === 'sanitised' ||
              booking.status === 'graded' ||
              isMoverAtWarehouse) && (
            <div className="mt-4 pt-4 border-t border-accent/20">
              <Button 
                variant="success" 
                size="lg"
                className="w-full" 
                onClick={() => {
                  if (!id) return;
                  // Mover at warehouse → graded (same as sanitised → graded). Then graded → inventory for JML inventory leg or completed for ITAD.
                  const nextStatus =
                    booking.status === 'sanitised' || isMoverAtWarehouse
                      ? 'graded'
                      : isJmlInventoryAfterGrading
                        ? 'inventory'
                        : 'completed';
                  const targetPath = isJmlMover
                    ? `/admin/device-allocation?booking=${id}`
                    : isJmlInventoryAfterGrading
                      ? `/admin/booking-inventory/${id}`
                      : `/admin/booking-approval/${id}`;
                  updateBookingStatus.mutate(
                    { bookingId: id, status: nextStatus as any },
                    {
                      onSuccess: () => {
                        toast.success(`Booking moved to ${nextStatus} status`, {
                          description: nextStatus === 'graded' ? "All assets have been graded. Proceeding to next step." : "All assets have been graded.",
                        });
                        navigate(targetPath);
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
                    {booking.status === 'sanitised' || isMoverAtWarehouse
                      ? 'Approve & Mark Graded'
                      : isJmlMover
                        ? 'Approve & Allocate Devices'
                        : isJmlInventoryAfterGrading
                        ? 'Approve & Move to Inventory'
                        : 'Approve & Complete'}
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
                <Select value={selectedAssetId} onValueChange={(v) => {
                  setSelectedAssetId(v);
                  setQuantity(1);
                  setSerialNumbersText("");
                  setImeiNumbersText("");
                  setImeiInput("");
                }}>
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Select asset category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {booking.assets.map((asset) => (
                      <SelectItem key={asset.categoryId} value={asset.categoryId}>
                        {asset.categoryName} ({asset.quantity} units
                        {recordsByAsset[asset.categoryId]?.length
                          ? ` • ${recordsByAsset[asset.categoryId].reduce((s, r) => s + (r.quantity || 0), 0)}/${asset.quantity} graded`
                          : ''}
                        )
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
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={Math.max(1, remainingQtyForSelected || 1)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value || 1))))}
                  disabled={!selectedAssetId}
                />
                {selectedAssetId && (
                  <p className="text-xs text-muted-foreground">
                    Remaining ungraded: {remainingQtyForSelected}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition Code *</Label>
                <Input
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder={autoConditionCode ? autoConditionCode : "Auto-generated from device make + grade (e.g., DELA)"}
                  disabled={!!autoConditionCode}
                />
                {autoConditionCode ? (
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from device make + grade.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Rule: first 3 letters of device make + grade (e.g., DELL + A → DELA).
                  </p>
                )}
              </div>

              {['A', 'B', 'C'].includes(grade) && (
                <div className="space-y-2">
                  <Label htmlFor="serialInput">Serial Numbers *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="serialInput"
                      value={serialInput}
                      onChange={(e) => setSerialInput(e.target.value)}
                      placeholder={
                        parsedSerialNumbers.length >= quantity
                          ? `Maximum ${quantity} serial(s) added`
                          : "Enter serial and press Enter or Add"
                      }
                      className="font-mono"
                      disabled={parsedSerialNumbers.length >= quantity}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = serialInput.trim();
                          if (!value) return;
                          if (parsedSerialNumbers.length >= quantity) return;
                          if (!parsedSerialNumbers.includes(value)) {
                            setSerialNumbersText(prev =>
                              prev ? `${prev}\n${value}` : value
                            );
                          }
                          setSerialInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={parsedSerialNumbers.length >= quantity}
                      onClick={() => {
                        const value = serialInput.trim();
                        if (!value) return;
                        if (parsedSerialNumbers.length >= quantity) return;
                        if (!parsedSerialNumbers.includes(value)) {
                          setSerialNumbersText(prev =>
                            prev ? `${prev}\n${value}` : value
                          );
                        }
                        setSerialInput("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add up to {quantity} serial number{quantity !== 1 ? "s" : ""}: {parsedSerialNumbers.length}/{quantity}
                  </p>
                  {parsedSerialNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {parsedSerialNumbers.map((sn) => (
                        <span
                          key={sn}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-mono border"
                        >
                          {sn}
                          <button
                            type="button"
                            onClick={() => {
                              setSerialNumbersText(prev =>
                                prev
                                  .split(/[\n,]+/g)
                                  .map(s => s.trim())
                                  .filter(Boolean)
                                  .filter(s => s !== sn)
                                  .join("\n")
                              );
                            }}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                            aria-label={`Remove ${sn}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {['A', 'B', 'C'].includes(grade) && selectedCategoryRequiresImei && (
                <div className="space-y-2">
                  <Label htmlFor="imeiInput">IMEI *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="imeiInput"
                      value={imeiInput}
                      onChange={(e) => setImeiInput(e.target.value)}
                      placeholder={
                        parsedImeiNumbers.length >= quantity
                          ? `Maximum ${quantity} IMEI(s) added`
                          : "Enter IMEI and press Enter or Add"
                      }
                      className="font-mono"
                      disabled={parsedImeiNumbers.length >= quantity}
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = imeiInput.trim();
                          if (!value) return;
                          if (parsedImeiNumbers.length >= quantity) return;
                          if (!parsedImeiNumbers.includes(value)) {
                            setImeiNumbersText(prev =>
                              prev ? `${prev}\n${value}` : value
                            );
                          }
                          setImeiInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={parsedImeiNumbers.length >= quantity}
                      onClick={() => {
                        const value = imeiInput.trim();
                        if (!value) return;
                        if (parsedImeiNumbers.length >= quantity) return;
                        if (!parsedImeiNumbers.includes(value)) {
                          setImeiNumbersText(prev =>
                            prev ? `${prev}\n${value}` : value
                          );
                        }
                        setImeiInput("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add {quantity} IMEI{quantity !== 1 ? "s" : ""} (one per device): {parsedImeiNumbers.length}/{quantity}
                  </p>
                  {parsedImeiNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {parsedImeiNumbers.map((im) => (
                        <span
                          key={im}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-mono border"
                        >
                          {im}
                          <button
                            type="button"
                            onClick={() => {
                              setImeiNumbersText(prev =>
                                prev
                                  .split(/[\n,]+/g)
                                  .map(s => s.trim())
                                  .filter(Boolean)
                                  .filter(s => s !== im)
                                  .join("\n")
                              );
                            }}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                            aria-label={`Remove ${im}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
          const gradedQty = assetRecords.reduce((s, r) => s + (r.quantity || 0), 0);

          return (
            <Card key={asset.categoryId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{asset.categoryName}</CardTitle>
                  <Badge variant="secondary">{gradedQty}/{asset.quantity} units graded</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {assetRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Not yet graded
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assetRecords.map((r) => (
                      <div key={r.id} className="flex items-start justify-between p-4 rounded-lg border bg-muted/50">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <Badge className={cn("text-sm", grades.find(g => g.value === r.grade)?.color)}>
                              Grade {r.grade}
                            </Badge>
                            <Badge variant="outline">{r.quantity} unit{r.quantity === 1 ? '' : 's'}</Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="text-muted-foreground">Resale Value:</span>{" "}
                              <span className="font-semibold text-foreground">£{r.resaleValue.toLocaleString()} per unit</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Total Value:</span>{" "}
                              <span className="font-semibold text-foreground">£{(r.resaleValue * (r.quantity || 1)).toLocaleString()}</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Graded:</span>{" "}
                              <span className="text-foreground">{new Date(r.gradedAt).toLocaleString("en-GB")}</span>
                            </p>
                            {r.condition && (
                              <p><span className="text-muted-foreground">Condition:</span> <span className="text-foreground">{r.condition}</span></p>
                            )}
                            {r.serialNumbers?.length ? (
                              <p>
                                <span className="text-muted-foreground">Serials:</span>{" "}
                                <span className="text-foreground font-mono">{r.serialNumbers.join(", ")}</span>
                              </p>
                            ) : null}
                            {r.imeiNumbers?.length ? (
                              <p>
                                <span className="text-muted-foreground">IMEI:</span>{" "}
                                <span className="text-foreground font-mono">{r.imeiNumbers.join(", ")}</span>
                              </p>
                            ) : null}
                            {r.notes && (
                              <p><span className="text-muted-foreground">Notes:</span> <span className="text-foreground">{r.notes}</span></p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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

