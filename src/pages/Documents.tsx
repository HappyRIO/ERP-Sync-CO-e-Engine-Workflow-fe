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
import { mockJobs } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  jobId: string;
  jobNumber: string;
  clientName: string;
  type: "chain-of-custody" | "data-wipe" | "destruction" | "recycling";
  generatedDate: string;
  downloadUrl: string;
}

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

// Generate documents from mock jobs
const allDocuments: Document[] = mockJobs.flatMap((job) =>
  job.certificates.map((cert, index) => ({
    id: `${job.id}-${cert.type}-${index}`,
    jobId: job.id,
    jobNumber: job.erpJobNumber,
    clientName: job.clientName,
    type: cert.type,
    generatedDate: cert.generatedDate,
    downloadUrl: cert.downloadUrl,
  }))
);

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = [
    { value: "all", label: "All Documents" },
    { value: "chain-of-custody", label: "Chain of Custody" },
    { value: "data-wipe", label: "Data Wipe" },
    { value: "destruction", label: "Destruction" },
    { value: "recycling", label: "Recycling" },
  ];

  const filteredDocs = allDocuments.filter((doc) => {
    const matchesSearch =
      doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.jobNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || doc.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

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
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download All
        </Button>
      </motion.div>

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
            placeholder="Search by client or job number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Document Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(docTypeConfig).map(([type, config], index) => {
          const count = allDocuments.filter((d) => d.type === type).length;
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
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.downloadUrl} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
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
    </div>
  );
};

export default Documents;
