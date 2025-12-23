import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Truck, 
  Phone,
  Camera,
  PenTool,
  Save,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoCapture } from "@/components/driver/PhotoCapture";
import { SignatureCapture } from "@/components/driver/SignatureCapture";
import { toast } from "sonner";
import { useJob, useUpdateJobEvidence, useUpdateJobStatus } from "@/hooks/useJobs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { WorkflowStatus } from "@/types/jobs";

const DriverJobView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id);
  const updateEvidence = useUpdateJobEvidence();
  const updateStatus = useUpdateJobStatus();

  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [sealNumbers, setSealNumbers] = useState<string[]>([]);
  const [newSealNumber, setNewSealNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Initialize state from job data
  useEffect(() => {
    if (job?.evidence) {
      setPhotos(job.evidence.photos || []);
      setSignature(
        job.evidence.signature && job.evidence.signature !== "collected"
          ? job.evidence.signature
          : null
      );
      setSealNumbers(job.evidence.sealNumbers || []);
      setNotes(job.evidence.notes || "");
    }
  }, [job]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>Job not found</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  // Check if driver can access this job (only before/at collection stage)
  const canAccess = job.status === 'booked' ||
    job.status === 'en-route' ||
    job.status === 'arrived' ||
    job.status === 'collected';

  // Access restriction: Drivers can only access jobs before/at collection
  if (!canAccess) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Access Restricted</strong>
            <p className="mt-2">
              This job has progressed beyond the collection stage. Drivers can only access jobs that are booked, en-route, or recently collected.
              Current status: {job.status}
            </p>
            <p className="mt-2 text-sm">
              For post-collection information, please contact your supervisor.
            </p>
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/jobs" className="text-inherit no-underline">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const handleAddSealNumber = () => {
    if (newSealNumber.trim()) {
      setSealNumbers([...sealNumbers, newSealNumber.trim()]);
      setNewSealNumber("");
    }
  };

  const handleRemoveSealNumber = (index: number) => {
    setSealNumbers(sealNumbers.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!id) return;

    updateEvidence.mutate(
      {
        jobId: id,
        evidence: {
          photos,
          signature: signature || undefined,
          sealNumbers,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Evidence saved successfully!", {
            description: "Photos, signature, and notes have been recorded.",
          });
        },
        onError: (error) => {
          toast.error("Failed to save evidence", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  const canSave = photos.length > 0 || signature || sealNumbers.length > 0;

  // Get next valid status for driver workflow
  const getNextStatus = (): WorkflowStatus | null => {
    if (!job) return null;
    const statusTransitions: Record<string, WorkflowStatus> = {
      'booked': 'en-route',      // Accept job (can go directly from booked to en-route)
      'routed': 'en-route',      // Accept routed job
      'en-route': 'arrived',     // Mark as arrived at site
      'arrived': 'collected',    // Mark as collected
      'collected': 'warehouse',  // Mark as delivered to warehouse
    };
    return statusTransitions[job.status] || null;
  };

  const nextStatus = getNextStatus();

  const handleStatusUpdate = async (newStatus: WorkflowStatus) => {
    if (!id) return;

    updateStatus.mutate(
      { jobId: id, status: newStatus },
      {
        onSuccess: () => {
          toast.success("Job status updated successfully!", {
            description: `Job status changed to ${newStatus}.`,
          });
        },
        onError: (error) => {
          toast.error("Failed to update job status", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/jobs/${id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{job.clientName}</h1>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {job.erpJobNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-4 max-w-2xl mx-auto">
        {/* Job Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{job.siteName}</p>
                <p className="text-xs text-muted-foreground">{job.siteAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                {new Date(job.scheduledDate).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {job.driver && (
              <>
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-mono">{job.driver.vehicleReg}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{job.driver.phone}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Photo Capture */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Evidence Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoCapture
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={10}
            />
          </CardContent>
        </Card>

        {/* Signature Capture */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Customer Signature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureCapture
              signature={signature}
              onSignatureChange={setSignature}
            />
          </CardContent>
        </Card>

        {/* Seal Numbers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seal Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter seal number"
                value={newSealNumber}
                onChange={(e) => setNewSealNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSealNumber();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddSealNumber}
                disabled={!newSealNumber.trim()}
              >
                Add
              </Button>
            </div>
            {sealNumbers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sealNumbers.map((seal, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm py-1 px-3"
                  >
                    {seal}
                    <button
                      onClick={() => handleRemoveSealNumber(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {sealNumbers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No seal numbers added yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any additional notes or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Status Update (if applicable) */}
        {nextStatus && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground mb-1">Update Job Status</p>
                  <p className="text-sm text-muted-foreground">
                    Mark this job as {nextStatus} to progress the workflow
                  </p>
                </div>
                <Button
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updateStatus.isPending}
                  size="lg"
                >
                  {updateStatus.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 />
                      Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button - Fixed at bottom on mobile */}
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-4 -mx-4 px-4">
          <Button
            onClick={handleSave}
            disabled={!canSave || updateEvidence.isPending}
            className="w-full"
            size="lg"
          >
            {updateEvidence.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save />
                Save Evidence
              </>
            )}
          </Button>
          {!canSave && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Add at least one photo, signature, or seal number to save
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverJobView;

