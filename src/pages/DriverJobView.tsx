import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Truck, 
  Phone,
  Camera,
  PenTool,
  Save,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoCapture } from "@/components/driver/PhotoCapture";
import { SignatureCapture } from "@/components/driver/SignatureCapture";
import { mockJobs } from "@/lib/mock-data";
import { toast } from "sonner";

const DriverJobView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = mockJobs.find((j) => j.id === id);

  const [photos, setPhotos] = useState<string[]>(job?.evidence?.photos || []);
  const [signature, setSignature] = useState<string | null>(
    job?.evidence?.signature && job.evidence.signature !== "collected" 
      ? job.evidence.signature 
      : null
  );
  const [sealNumbers, setSealNumbers] = useState<string[]>(
    job?.evidence?.sealNumbers || []
  );
  const [newSealNumber, setNewSealNumber] = useState("");
  const [notes, setNotes] = useState(job?.evidence?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-muted-foreground mb-4">Job not found</p>
        <Button asChild>
          <button onClick={() => navigate("/jobs")}>Back to Jobs</button>
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
    setIsSaving(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // In a real app, this would update the job's evidence
    toast.success("Evidence saved successfully!", {
      description: "Photos, signature, and notes have been recorded.",
    });
    
    setIsSaving(false);
  };

  const canSave = photos.length > 0 || signature || sealNumbers.length > 0;

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

        {/* Save Button - Fixed at bottom on mobile */}
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-4 -mx-4 px-4">
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
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

