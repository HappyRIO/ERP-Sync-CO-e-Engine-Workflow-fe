import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Shield,
  Trash2,
  Link as LinkIcon,
  HardDrive
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useJobs } from "@/hooks/useJobs";
import { useDocuments } from "@/hooks/useDocuments";
import { documentsService } from "@/services/documents.service";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Certificate } from "@/types/jobs";
import type { Document as DocumentType } from "@/services/documents.service";

const docTypeConfig = {
  "chain-of-custody": {
    label: "Chain of Custody",
    icon: LinkIcon,
    color: "bg-info/10 text-info",
  },
  "data-wipe": {
    label: "Data Wipe Certificate",
    icon: HardDrive,
    color: "bg-success/10 text-success",
  },
  "destruction": {
    label: "Destruction Certificate",
    icon: Trash2,
    color: "bg-destructive/10 text-destructive",
  },
  "recycling": {
    label: "Recycling Certificate",
    icon: Shield,
    color: "bg-primary/10 text-primary",
  },
};

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobs();
  const { data: apiDocuments = [], isLoading: isLoadingDocuments, error } = useDocuments();

  // Combine documents from API (Chain of Custody) and job certificates
  const jobCertificates = jobs.flatMap((job) =>
    job.certificates.map((cert, index) => ({
      id: `${job.id}-${cert.type}-${index}`,
      jobId: job.id,
      jobNumber: job.erpJobNumber,
      clientName: job.clientName,
      type: cert.type as string,
      generatedDate: cert.generatedDate,
      downloadUrl: cert.downloadUrl,
      isApiDocument: false, // Flag to identify job certificates
    }))
  );

  // Transform API documents to match the interface
  const apiDocs = apiDocuments.map((doc: DocumentType) => ({
    id: doc.id,
    jobId: doc.jobId || '',
    jobNumber: doc.job?.erpJobNumber || doc.booking?.bookingNumber || 'N/A',
    clientName: doc.job?.clientName || doc.booking?.client?.name || 'N/A',
    type: doc.type,
    generatedDate: doc.createdAt,
    downloadUrl: documentsService.getDownloadUrl(doc.id),
    isApiDocument: true, // Flag to identify API documents
  }));

  // Combine and deduplicate by ID
  const allDocuments = [...apiDocs, ...jobCertificates];
  const uniqueDocuments = Array.from(
    new Map(allDocuments.map(doc => [doc.id, doc])).values()
  );

  const isLoading = isLoadingJobs || isLoadingDocuments;

  const filters = [
    { value: "all", label: "All Documents" },
    { value: "chain-of-custody", label: "Chain of Custody" },
    { value: "data-wipe", label: "Data Wipe" },
    { value: "destruction", label: "Destruction" },
    { value: "recycling", label: "Recycling" },
  ];

  const filteredDocs = uniqueDocuments.filter((doc) => {
    const matchesSearch =
      doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.jobNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || doc.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load documents. Please try refreshing the page.
          </AlertDescription>
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
          <h2 className="text-2xl font-bold text-foreground">Compliance Documents</h2>
          <p className="text-muted-foreground">Download certificates and compliance records</p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or job number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        {/* Mobile: Dropdown Select for Filters */}
        <div className="sm:hidden w-full">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {filters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Desktop: Horizontal Buttons for Filters */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-1 px-1">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Document Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(docTypeConfig).map(([type, config], index) => {
              const count = uniqueDocuments.filter((d) => d.type === type).length;
              const Icon = config.icon;
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFilter(type)}>
                    <CardContent className="pt-4">
                      <div className={cn("inline-flex p-2 rounded-lg mb-2", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {filteredDocs.length > 0 ? (
          filteredDocs.map((doc, index) => {
            const config = docTypeConfig[doc.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={cn("p-3 rounded-xl", config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{config.label}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{doc.clientName}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{doc.jobNumber}</span>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">Generated</p>
                      <p className="text-sm font-medium">
                        {new Date(doc.generatedDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {doc.isApiDocument ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          try {
                            await documentsService.downloadDocument(doc.id, `${doc.type}-${doc.jobNumber}.pdf`);
                          } catch (error) {
                            console.error('Download failed:', error);
                            // You could add a toast notification here
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.downloadUrl} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No documents found</p>
            <p className="text-sm text-muted-foreground">
              Documents will appear here once jobs are processed
            </p>
          </div>
        )}
          </div>
        </>
      )}
    </div>
  );
};

export default Documents;
