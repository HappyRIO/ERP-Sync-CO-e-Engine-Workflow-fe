import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Truck, 
  Phone,
  FileText,
  Download,
  Leaf,
  Scale,
  Smartphone,
  Loader2,
  Camera,
  PenTool,
  Lock,
  FileCheck,
  CheckCircle2,
  Package,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WorkflowTimeline } from "@/components/jobs/WorkflowTimeline";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { co2eEquivalencies } from "@/lib/constants";
import { useJob } from "@/hooks/useJobs";
import { useAssetCategories } from "@/hooks/useAssets";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { canDriverEditJob } from "@/utils/job-helpers";
import { getAuthenticatedFileUrl } from "@/utils/file-url";

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: job, isLoading, error } = useJob(id);
  const { data: assetCategories } = useAssetCategories();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {error ? "Failed to load job details." : "Job not found"}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/jobs" className="text-inherit no-underline">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const totalAssets = job.assets.reduce((sum, a) => sum + a.quantity, 0);
  const netCO2e = job.co2eSaved - job.travelEmissions;
  
  // Use actual round trip distance from booking if available
  // Do not use travelEmissions / emissionsPerKm as fallback - this is inaccurate
  let roundTripDistanceKm = 0;
  let roundTripDistanceMiles = 0;
  
  if (job.roundTripDistanceKm && job.roundTripDistanceKm > 0) {
    // Use actual distance from booking (calculated at booking creation)
    roundTripDistanceKm = job.roundTripDistanceKm;
    roundTripDistanceMiles = job.roundTripDistanceMiles || (roundTripDistanceKm * 0.621371);
  }
  // If distance is not available, leave it as 0 to show error/warning in UI

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <Button variant="ghost" size="sm" asChild className="-ml-2 self-start sm:self-auto">
          <Link to="/jobs" className="text-inherit no-underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Jobs
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-foreground">{job.organisationName || job.clientName}</h2>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="text-muted-foreground font-mono">{job.erpJobNumber}</p>
        </div>
      </motion.div>

      {/* Workflow Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowTimeline currentStatus={job.status} />
        </CardContent>
      </Card>

      <div className={`grid gap-6 ${user?.role === 'driver' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
            {/* Left Column - Details */}
            <div className={`${user?.role === 'driver' ? '' : 'lg:col-span-2'} space-y-6 flex flex-col`}>
          {/* Collection Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Site</p>
                    <p className="font-medium">{job.siteName}</p>
                    <p className="text-sm text-muted-foreground">{job.siteAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium">
                      {new Date(job.scheduledDate).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Round Trip Mileage</p>
                  </div>
                  {roundTripDistanceKm > 0 ? (
                    <p className="text-lg font-bold">
                      {roundTripDistanceMiles.toFixed(1)} miles ({roundTripDistanceKm.toFixed(1)} km)
                    </p>
                  ) : (
                    <p className="text-lg font-bold text-warning">0 km</p>
                  )}
                </div>
                {roundTripDistanceKm > 0 ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    From collection site to warehouse and return
                  </p>
                ) : (
                  <p className="text-xs text-warning mt-1">
                    ⚠️ Distance data unavailable. Distance calculation may have failed.
                  </p>
                )}
              </div>

              {job.driver && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Driver Assignment</p>
                    {/* Only show Driver View button to driver role, and only if job is editable */}
                    {user?.role === 'driver' && canDriverEditJob(job) && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/driver/jobs/${job.id}`} className="text-inherit no-underline">
                          <Smartphone className="h-4 w-4 mr-2" />
                          Driver View
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{job.driver.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{job.driver.vehicleReg}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{job.driver.phone}</span>
                    </div>
                    {job.driver.vehicleType && (
                      <Badge variant="outline" className="text-xs">
                        {job.driver.vehicleType}
                        {job.driver.vehicleFuelType && ` • ${job.driver.vehicleFuelType}`}
                      </Badge>
                    )}
                    {(job.status === "routed" || job.status === "en-route") && (
                      <Badge 
                        variant="secondary" 
                        className={job.driver.isEtaDelayed 
                          ? "bg-destructive/20 text-destructive border-destructive/50" 
                          : "bg-warning/20 text-warning-foreground"
                        }
                      >
                        ETA: {job.driver.eta || "--:--"}
                        {job.driver.isEtaDelayed && " (Delayed)"}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assets ({totalAssets})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {job.assets.map((asset) => {
                  // Try to find category by ID first, then by name
                  const category = assetCategories?.find(
                    (c) => c.id === (asset.categoryId || asset.category) || c.name === (asset.categoryName || asset.category)
                  );
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category?.icon || '📦'}</span>
                        <div>
                          <p className="font-medium">{category?.name || asset.categoryName || asset.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {asset.quantity} units
                            {asset.weight && ` • ${asset.weight}kg`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {asset.grade && (
                          <Badge variant="outline">Grade {asset.grade}</Badge>
                        )}
                        {asset.sanitised && (
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            Sanitised
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        {user?.role !== 'driver' && (
          <div className="space-y-6 flex flex-col">
            {/* CO2e Impact */}
            <Card className="bg-gradient-eco border-primary/20 flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-primary" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">CO₂e Saved</p>
                  <p className="text-2xl font-bold text-success">
                    {(job.co2eSaved / 1000).toFixed(2)}t
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Travel Emissions</p>
                  <p className="text-lg font-semibold text-destructive">
                    -{job.travelEmissions}kg
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Net Benefit</p>
                  <p className="text-2xl font-bold text-primary">
                    {(netCO2e / 1000).toFixed(2)}t
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ {co2eEquivalencies.treesPlanted(netCO2e)} trees planted
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyback Value</span>
                  <span className="font-semibold">£{job.buybackValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charity Donation</span>
                  <span className="font-semibold">{job.charityPercent}%</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-muted-foreground">Your Return</span>
                  <span className="font-bold text-lg">
                    £{Math.round(job.buybackValue * (1 - job.charityPercent / 100)).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

          {/* Evidence Review (Admin only) */}
          {user?.role === 'admin' && (
            <Card className="border-border/50 flex flex-col h-full">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2 min-w-0">
                    <FileCheck className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate">Collection Evidence</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-normal flex-shrink-0">
                    <Lock className="h-3 w-3 mr-1" />
                    Immutable
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                {(() => {
                  // Handle both array and single evidence (backward compatibility)
                  // Also handle null/undefined cases
                  let evidenceList: any[] = [];
                  
                  if (job.evidence) {
                    if (Array.isArray(job.evidence)) {
                      evidenceList = job.evidence;
                    } else if (typeof job.evidence === 'object') {
                      // Single evidence object (backward compatibility)
                      evidenceList = [{ ...job.evidence, status: job.evidence.status || job.status }];
                    }
                  }

                  // Sort evidence by workflow order for better UX
                  const workflowOrder: Record<string, number> = {
                    'en-route': 1,
                    'en_route': 1,
                    'arrived': 2,
                    'collected': 3,
                    'warehouse': 4,
                    'sanitised': 5,
                    'graded': 6,
                    'completed': 7,
                    'booked': 0,
                    'routed': 0,
                  };
                  
                  evidenceList.sort((a, b) => {
                    const orderA = workflowOrder[a.status] ?? 999;
                    const orderB = workflowOrder[b.status] ?? 999;
                    return orderA - orderB;
                  });

                  // Status labels
                  const statusLabels: Record<string, string> = {
                    'en-route': 'En Route',
                    'en_route': 'En Route',
                    'arrived': 'Arrived',
                    'collected': 'Collected',
                    'warehouse': 'Warehouse',
                    'sanitised': 'Sanitised',
                    'graded': 'Graded',
                    'completed': 'Completed',
                    'booked': 'Booked',
                    'routed': 'Routed',
                  };
                  
                  // Normalize status for comparison (handle both en-route and en_route)
                  const normalizeStatus = (status: string) => status === 'en_route' ? 'en-route' : status;
                  const statusesWithEvidence = new Set(
                    evidenceList.map((ev: any) => normalizeStatus(ev.status || ''))
                  );
                  
                  const requiredStatuses = ['en-route', 'arrived', 'collected', 'warehouse'];

                  if (evidenceList.length === 0) {
                    return (
                      <div className="py-8 text-center">
                        <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No evidence submitted yet
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col h-full min-h-0 space-y-3">
                      {/* Compact Summary */}
                      <div className="p-3 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-border/50 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-foreground">Status Summary</p>
                          <Badge variant="secondary" className="text-xs">
                            {evidenceList.length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {requiredStatuses.map((status) => {
                            const hasEvidence = statusesWithEvidence.has(status);
                            return (
                              <div
                                key={status}
                                className={`flex items-center gap-1.5 p-1.5 rounded border transition-colors ${
                                  hasEvidence
                                    ? 'bg-success/10 border-success/20 text-success'
                                    : 'bg-muted/30 border-border/50 text-muted-foreground'
                                }`}
                              >
                                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${hasEvidence ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                                <span className="text-xs font-medium truncate">{statusLabels[status] || status}</span>
                                {hasEvidence && (
                                  <CheckCircle2 className="h-3 w-3 ml-auto flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Compact Accordion with scroll */}
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <Accordion type="single" collapsible className="w-full space-y-1.5">
                        {evidenceList.map((evidence: any, idx: number) => {
                          const statusLabel = statusLabels[evidence.status] || evidence.status || 'Unknown';
                          const evidenceKey = `${job.id}-${evidence.status}-${idx}`;
                          
                          // Check if this evidence is for the current job status
                          const normalizeStatus = (status: string) => status === 'en_route' ? 'en-route' : status;
                          const isCurrentStatusEvidence = normalizeStatus(evidence.status || '') === normalizeStatus(job.status);
                          
                          // Count evidence items
                          const hasPhotos = evidence.photos && evidence.photos.length > 0;
                          const hasSignature = !!evidence.signature;
                          const hasSealNumbers = evidence.sealNumbers && evidence.sealNumbers.length > 0;
                          const hasNotes = !!evidence.notes;
                          const itemCount = [hasPhotos, hasSignature, hasSealNumbers, hasNotes].filter(Boolean).length;
                          
                          const submissionDate = evidence.createdAt 
                            ? new Date(evidence.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : null;
                          
                          return (
                            <AccordionItem 
                              key={evidenceKey} 
                              value={evidenceKey} 
                              className={`border rounded-md overflow-hidden transition-colors ${
                                isCurrentStatusEvidence 
                                  ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' 
                                  : 'border-border/50 bg-card hover:bg-muted/30'
                              }`}
                            >
                              <AccordionTrigger className="hover:no-underline px-3 py-2.5">
                                <div className="flex items-center justify-between w-full pr-2 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isCurrentStatusEvidence ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                    <Badge 
                                      variant={isCurrentStatusEvidence ? "default" : "secondary"} 
                                      className="font-medium text-xs flex-shrink-0"
                                    >
                                      {statusLabel}
                                      {isCurrentStatusEvidence && (
                                        <span className="ml-1 text-xs">(Current)</span>
                                      )}
                                    </Badge>
                                    {submissionDate && (
                                      <span className="text-xs text-muted-foreground truncate hidden lg:inline">
                                        {submissionDate}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-2">
                                    {hasPhotos && (
                                      <span className="flex items-center gap-0.5 text-muted-foreground" title={`${evidence.photos.length} photos`}>
                                        <Camera className="h-3 w-3" />
                                        <span className="font-medium hidden sm:inline">{evidence.photos.length}</span>
                                      </span>
                                    )}
                                    {hasSignature && (
                                      <span className="text-muted-foreground" title="Signature">
                                        <PenTool className="h-3 w-3" />
                                      </span>
                                    )}
                                    {hasSealNumbers && (
                                      <span className="text-muted-foreground hidden sm:inline" title={`${evidence.sealNumbers.length} seals`}>
                                        {evidence.sealNumbers.length}
                                      </span>
                                    )}
                                    {hasNotes && (
                                      <span className="text-muted-foreground hidden sm:inline" title="Notes">N</span>
                                    )}
                                    {itemCount === 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        Empty
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3 pt-2 max-h-[400px] overflow-y-auto">
                                <div className="space-y-3 border-t border-border/50 pt-3">
                                  {/* Photos */}
                                  {hasPhotos && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs font-semibold">Photos</p>
                                        <Badge variant="outline" className="text-xs ml-auto">
                                          {evidence.photos.length}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {evidence.photos.map((photo: string, photoIdx: number) => {
                                          // Use regular URL for img src (data URLs work fine here)
                                          const imgUrl = getAuthenticatedFileUrl(photo, false);
                                          // Use blob URL for new tab opening (data URLs are blocked)
                                          const handleClick = () => {
                                            const newTabUrl = getAuthenticatedFileUrl(photo, true);
                                            if (newTabUrl && newTabUrl !== '#') {
                                              window.open(newTabUrl, '_blank');
                                            } else {
                                              console.error('Invalid photo URL:', photo);
                                            }
                                          };
                                          return (
                                            <div
                                              key={photoIdx}
                                              className="relative group cursor-pointer rounded overflow-hidden border border-border/50 hover:border-primary/50 transition-all"
                                              onClick={handleClick}
                                            >
                                              <img
                                                src={imgUrl}
                                                alt={`Photo ${photoIdx + 1}`}
                                                className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-200"
                                              />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FileCheck className="h-4 w-4 text-white drop-shadow-lg" />
                                              </div>
                                            </div>
                                          </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Signature */}
                                  {hasSignature && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <PenTool className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs font-semibold">Signature</p>
                                      </div>
                                      <div 
                                        className="inline-block border border-border rounded p-1.5 bg-white cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => {
                                          // Use blob URL for new tab opening (data URLs are blocked)
                                          const newTabUrl = getAuthenticatedFileUrl(evidence.signature, true);
                                          if (newTabUrl && newTabUrl !== '#') {
                                            window.open(newTabUrl, '_blank');
                                          } else {
                                            console.error('Invalid signature URL:', evidence.signature);
                                          }
                                        }}
                                      >
                                        <img
                                          src={getAuthenticatedFileUrl(evidence.signature, false)}
                                          alt="Signature"
                                          className="h-16 w-auto object-contain"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Seal Numbers */}
                                  {hasSealNumbers && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs font-semibold">Seals</p>
                                        <Badge variant="outline" className="text-xs ml-auto">
                                          {evidence.sealNumbers.length}
                                        </Badge>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {evidence.sealNumbers.map((seal: string, sealIdx: number) => (
                                          <Badge 
                                            key={sealIdx} 
                                            variant="secondary" 
                                            className="text-xs py-1 px-2 font-mono bg-muted hover:bg-muted/80 transition-colors"
                                          >
                                            {seal}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {hasNotes && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs font-semibold">Notes</p>
                                      </div>
                                      <div className="bg-muted/50 p-2 rounded border border-border/50">
                                        <p className="text-xs whitespace-pre-wrap text-foreground leading-relaxed break-words">
                                          {evidence.notes}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {itemCount === 0 && (
                                    <div className="text-center py-4 space-y-1.5">
                                      <AlertCircle className="h-6 w-6 mx-auto text-muted-foreground/50" />
                                      <p className="text-xs font-medium text-muted-foreground">
                                        No data available
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                        </Accordion>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Certificates */}
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.certificates.length > 0 ? (
                <div className="space-y-2">
                  {job.certificates.map((cert, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-between"
                      asChild
                    >
                      <a href={cert.downloadUrl} download>
                        <span className="capitalize">
                          {cert.type.replace(/-/g, " ")}
                        </span>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Certificates will be available once processing is complete
                </p>
              )}
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
