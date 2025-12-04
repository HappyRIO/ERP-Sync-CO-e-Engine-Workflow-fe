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
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowTimeline } from "@/components/jobs/WorkflowTimeline";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { mockJobs, assetCategories, co2eEquivalencies } from "@/lib/mock-data";

const JobDetail = () => {
  const { id } = useParams();
  const job = mockJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Job not found</p>
        <Button asChild>
          <Link to="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const totalAssets = job.assets.reduce((sum, a) => sum + a.quantity, 0);
  const netCO2e = job.co2eSaved - job.travelEmissions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/jobs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Jobs
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-foreground">{job.clientName}</h2>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
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

              {job.driver && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Driver Assignment</p>
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
                    {job.driver.eta && (
                      <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                        ETA: {job.driver.eta}
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
                  const category = assetCategories.find((c) => c.id === asset.category);
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category?.icon}</span>
                        <div>
                          <p className="font-medium">{category?.name || asset.category}</p>
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
        <div className="space-y-6">
          {/* CO2e Impact */}
          <Card className="bg-gradient-eco border-primary/20">
            <CardHeader>
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
          <Card>
            <CardHeader>
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

          {/* Certificates */}
          <Card>
            <CardHeader>
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
      </div>
    </div>
  );
};

export default JobDetail;
