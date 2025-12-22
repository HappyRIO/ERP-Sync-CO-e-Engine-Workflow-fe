import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Plus, 
  Search, 
  Loader2, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  User, 
  Star,
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSites, useCreateSite, useUpdateSite, useDeleteSite, useSetDefaultSite } from "@/hooks/useSites";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MapPicker } from "@/components/booking/MapPicker";
import type { Site } from "@/services/site.service";

const Sites = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  
  const { data: sites = [], isLoading, error } = useSites();
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const setDefaultSite = useSetDefaultSite();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postcode: "",
    city: "",
    contactName: "",
    contactPhone: "",
    coordinates: null as { lat: number; lng: number } | null,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      postcode: "",
      city: "",
      contactName: "",
      contactPhone: "",
      coordinates: null,
    });
    setEditingSite(null);
  };

  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      address: site.address,
      postcode: site.postcode,
      city: site.city,
      contactName: site.contactName || "",
      contactPhone: site.contactPhone || "",
      coordinates: site.coordinates || null,
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.postcode || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    const siteData = {
      name: formData.name,
      address: formData.address,
      postcode: formData.postcode,
      city: formData.city,
      contactName: formData.contactName || undefined,
      contactPhone: formData.contactPhone || undefined,
      coordinates: formData.coordinates || undefined,
      isDefault: editingSite?.isDefault || false,
    };

    if (editingSite) {
      updateSite.mutate(
        { id: editingSite.id, updates: siteData },
        {
          onSuccess: () => {
            toast.success("Site updated successfully");
            setShowCreateDialog(false);
            resetForm();
          },
          onError: (error) => {
            toast.error("Failed to update site", {
              description: error instanceof Error ? error.message : "Please try again.",
            });
          },
        }
      );
    } else {
      createSite.mutate(
        siteData,
        {
          onSuccess: () => {
            toast.success("Site created successfully");
            setShowCreateDialog(false);
            resetForm();
          },
          onError: (error) => {
            toast.error("Failed to create site", {
              description: error instanceof Error ? error.message : "Please try again.",
            });
          },
        }
      );
    }
  };

  const handleDelete = (site: Site) => {
    setDeletingSite(site);
  };

  const confirmDelete = () => {
    if (!deletingSite) return;

    deleteSite.mutate(deletingSite.id, {
      onSuccess: () => {
        toast.success("Site deleted successfully");
        setDeletingSite(null);
      },
      onError: (error) => {
        toast.error("Failed to delete site", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
        setDeletingSite(null);
      },
    });
  };

  const handleSetDefault = (siteId: string) => {
    setDefaultSite.mutate(siteId, {
      onSuccess: () => {
        toast.success("Default site updated");
      },
      onError: (error) => {
        toast.error("Failed to set default site", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      },
    });
  };

  const filteredSites = sites.filter((site) => {
    const query = searchQuery.toLowerCase();
    return (
      site.name.toLowerCase().includes(query) ||
      site.address.toLowerCase().includes(query) ||
      site.postcode.toLowerCase().includes(query) ||
      site.city.toLowerCase().includes(query)
    );
  });

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load sites. Please try refreshing the page.</AlertDescription>
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
          <h2 className="text-2xl font-bold text-foreground">Site Management</h2>
          <p className="text-muted-foreground">Manage your collection sites</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="header" size="lg" onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus />
              New Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSite ? "Edit Site" : "Create New Site"}</DialogTitle>
              <DialogDescription>
                {editingSite 
                  ? "Update the site details below"
                  : "Add a new collection site. All fields marked with * are required."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Left Column - Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Site Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., London HQ"
                      required
                      className="h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-sm">Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street address"
                        required
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        required
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="postcode" className="text-sm">Postcode *</Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      placeholder="e.g., EC1A 1BB"
                      required
                      className="h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="contactName" className="text-sm">Contact Name</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="Contact person name"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contactPhone" className="text-sm">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+44 20 1234 5678"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Map */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        Search Address or Select on Map
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Search or click on the map to auto-fill address fields
                      </p>
                    </CardHeader>
                    <CardContent>
                      <MapPicker
                        position={formData.coordinates}
                        onPositionChange={(position) => {
                          setFormData({ ...formData, coordinates: position });
                        }}
                        onAddressDetailsChange={(details) => {
                          // Always update address fields when map location is selected (even on subsequent clicks)
                          setFormData(prev => ({
                            ...prev,
                            address: details.street || prev.address,
                            city: details.city || prev.city,
                            postcode: details.postcode || prev.postcode,
                          }));
                        }}
                        height="350px"
                      />
                      {formData.coordinates && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Location set at {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="header" disabled={createSite.isPending || updateSite.isPending}>
                  {createSite.isPending || updateSite.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {editingSite ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 />
                      {editingSite ? "Update Site" : "Create Site"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sites by name, address, postcode, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </motion.div>

      {/* Sites List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? "No sites found matching your search" : "No sites yet. Create your first site to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site, index) => (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Building2 className="h-5 w-5 text-primary shrink-0" />
                      <CardTitle className="text-lg truncate">{site.name}</CardTitle>
                      {site.isDefault && (
                        <Badge variant="outline" className="bg-accent/10 text-accent shrink-0">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(site)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!site.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(site.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(site)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p>{site.address}</p>
                      <p>{site.city}, {site.postcode}</p>
                    </div>
                  </div>
                  {site.contactName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{site.contactName}</span>
                    </div>
                  )}
                  {site.contactPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{site.contactPhone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSite} onOpenChange={(open) => !open && setDeletingSite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deletingSite?.name}"</strong>? 
              This action cannot be undone and will remove the site from all future bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Site
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sites;

