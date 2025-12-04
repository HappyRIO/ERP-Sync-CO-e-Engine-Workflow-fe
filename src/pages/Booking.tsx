import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Package, 
  Calculator, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Leaf,
  Truck,
  TreeDeciduous,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  assetCategories, 
  calculateReuseCO2e, 
  calculateBuybackEstimate,
  calculateTravelEmissions,
  co2eEquivalencies 
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Site Details", icon: Building2 },
  { id: 2, title: "Assets", icon: Package },
  { id: 3, title: "Review & Submit", icon: Calculator },
];

interface AssetSelection {
  categoryId: string;
  quantity: number;
}

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [siteDetails, setSiteDetails] = useState({
    siteName: "",
    address: "",
    postcode: "",
    contactName: "",
    contactPhone: "",
  });
  const [selectedAssets, setSelectedAssets] = useState<AssetSelection[]>([]);
  const [charityPercent, setCharityPercent] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateAssetQuantity = (categoryId: string, delta: number) => {
    setSelectedAssets((prev) => {
      const existing = prev.find((a) => a.categoryId === categoryId);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) {
          return prev.filter((a) => a.categoryId !== categoryId);
        }
        return prev.map((a) =>
          a.categoryId === categoryId ? { ...a, quantity: newQty } : a
        );
      } else if (delta > 0) {
        return [...prev, { categoryId, quantity: delta }];
      }
      return prev;
    });
  };

  const getAssetQuantity = (categoryId: string) => {
    return selectedAssets.find((a) => a.categoryId === categoryId)?.quantity || 0;
  };

  const totalAssets = selectedAssets.reduce((sum, a) => sum + a.quantity, 0);
  const co2eSaved = calculateReuseCO2e(selectedAssets);
  const buybackEstimate = calculateBuybackEstimate(selectedAssets);
  const travelEmissions = calculateTravelEmissions(80, "van"); // Assume 80km average
  const netCO2e = co2eSaved - travelEmissions;

  const canProceed = () => {
    if (currentStep === 1) {
      return siteDetails.siteName && siteDetails.address && siteDetails.postcode;
    }
    if (currentStep === 2) {
      return totalAssets > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 2000));
    toast.success("Booking submitted successfully!", {
      description: "You will receive a confirmation email shortly.",
    });
    setIsSubmitting(false);
    // Reset form
    setCurrentStep(1);
    setSiteDetails({ siteName: "", address: "", postcode: "", contactName: "", contactPhone: "" });
    setSelectedAssets([]);
    setCharityPercent(10);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                currentStep >= step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              <step.icon className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">{step.title}</span>
              <span className="font-medium sm:hidden">{step.id}</span>
            </motion.div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2",
                  currentStep > step.id ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Collection Site Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name *</Label>
                    <Input
                      id="siteName"
                      placeholder="e.g., London HQ"
                      value={siteDetails.siteName}
                      onChange={(e) =>
                        setSiteDetails({ ...siteDetails, siteName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input
                      id="postcode"
                      placeholder="e.g., EC1A 1BB"
                      value={siteDetails.postcode}
                      onChange={(e) =>
                        setSiteDetails({ ...siteDetails, postcode: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Input
                    id="address"
                    placeholder="Street address, city"
                    value={siteDetails.address}
                    onChange={(e) =>
                      setSiteDetails({ ...siteDetails, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      placeholder="Site contact person"
                      value={siteDetails.contactName}
                      onChange={(e) =>
                        setSiteDetails({ ...siteDetails, contactName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      placeholder="+44 ..."
                      value={siteDetails.contactPhone}
                      onChange={(e) =>
                        setSiteDetails({ ...siteDetails, contactPhone: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Select Assets for Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {assetCategories.map((category) => {
                    const qty = getAssetQuantity(category.id);
                    const isSelected = qty > 0;
                    return (
                      <div
                        key={category.id}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="text-center mb-3">
                          <span className="text-3xl">{category.icon}</span>
                          <p className="font-medium mt-1">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ~{category.co2ePerUnit}kg CO₂e/unit
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateAssetQuantity(category.id, -5)}
                            disabled={qty === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setSelectedAssets((prev) => {
                                const filtered = prev.filter(
                                  (a) => a.categoryId !== category.id
                                );
                                if (val > 0) {
                                  return [...filtered, { categoryId: category.id, quantity: val }];
                                }
                                return filtered;
                              });
                            }}
                            className="w-16 text-center h-8"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateAssetQuantity(category.id, 5)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CO2e Preview */}
                {totalAssets > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl bg-gradient-eco border border-primary/20"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Leaf className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Environmental Impact Preview</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-success">
                          {(co2eSaved / 1000).toFixed(1)}t
                        </p>
                        <p className="text-xs text-muted-foreground">CO₂e Saved</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-destructive">
                          -{travelEmissions}kg
                        </p>
                        <p className="text-xs text-muted-foreground">Travel Emissions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {(netCO2e / 1000).toFixed(1)}t
                        </p>
                        <p className="text-xs text-muted-foreground">Net Benefit</p>
                      </div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground mt-3">
                      ≈ {co2eEquivalencies.treesPlanted(netCO2e)} trees planted equivalent
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Collection Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Site</span>
                    <span className="font-medium">{siteDetails.siteName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{siteDetails.postcode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Assets</span>
                    <span className="font-medium">{totalAssets} units</span>
                  </div>
                  <div className="pt-3 border-t">
                    {selectedAssets.map((asset) => {
                      const cat = assetCategories.find((c) => c.id === asset.categoryId);
                      return (
                        <div key={asset.categoryId} className="flex justify-between text-sm py-1">
                          <span>{cat?.icon} {cat?.name}</span>
                          <span>{asset.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-eco border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    Impact & Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estimated Buyback</span>
                    <span className="text-xl font-bold">£{buybackEstimate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Net CO₂e Benefit</span>
                    <span className="text-xl font-bold text-success">
                      {(netCO2e / 1000).toFixed(1)}t
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <TreeDeciduous className="h-4 w-4" />
                      {co2eEquivalencies.treesPlanted(netCO2e)} trees
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      {co2eEquivalencies.carMiles(netCO2e)} miles saved
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charity Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-destructive" />
                  Charity Donation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Donate a percentage of your buyback to charity
                    </span>
                    <span className="text-xl font-bold">{charityPercent}%</span>
                  </div>
                  <Slider
                    value={[charityPercent]}
                    onValueChange={([val]) => setCharityPercent(val)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Charity: £{Math.round(buybackEstimate * (charityPercent / 100)).toLocaleString()}
                    </span>
                    <span className="font-medium">
                      Your Return: £{Math.round(buybackEstimate * (1 - charityPercent / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Booking
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Booking;
