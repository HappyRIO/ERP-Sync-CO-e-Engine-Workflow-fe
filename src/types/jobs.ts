// Job and Workflow Types

export type WorkflowStatus = 
  | 'booked' 
  | 'routed' 
  | 'en-route' 
  | 'arrived'    // Driver has arrived at collection site
  | 'collected' 
  | 'warehouse' 
  | 'sanitised' 
  | 'graded' 
  | 'completed';

export interface Job {
  id: string;
  erpJobNumber: string;
  bookingId?: string; // Link to booking
  clientName: string;
  organisationName?: string; // Organisation/company name
  siteName: string;
  siteAddress: string;
  status: WorkflowStatus;
  scheduledDate: string;
  completedDate?: string;
  assets: Asset[];
  driver?: Driver;
  co2eSaved: number;
  travelEmissions: number;
  buybackValue: number;
  charityPercent: number;
  roundTripDistanceKm?: number | null; // From booking (actual calculated distance)
  roundTripDistanceMiles?: number | null; // From booking (actual calculated distance)
  // Driver journey fields (entered before starting journey in routed status)
  dial2Collection?: string | null;
  securityRequirements?: string | null;
  idRequired?: string | null;
  loadingBayLocation?: string | null;
  vehicleHeightRestrictions?: string | null;
  doorLiftSize?: string | null;
  roadWorksPublicEvents?: string | null;
  manualHandlingRequirements?: string | null;
  evidence?: Evidence | Evidence[]; // Can be single evidence (backward compat) or array of evidence per status
  certificates: Certificate[];
}

export interface Asset {
  id: string;
  category: string; // Category ID or name (for backward compatibility)
  categoryId?: string; // Category ID for matching with AssetCategory
  categoryName?: string; // Category name for display
  quantity: number;
  serialNumbers?: string[];
  grade?: 'A' | 'B' | 'C' | 'D' | 'Recycled';
  weight?: number;
  sanitised?: boolean;
  wipeMethod?: string;
  sanitisationRecordId?: string; // Link to sanitisation record
  gradingRecordId?: string; // Link to grading record
  resaleValue?: number; // Per-unit resale value
}

export interface Driver {
  id?: string; // Optional user ID to link driver to user
  name: string;
  vehicleReg: string;
  vehicleType: 'van' | 'truck' | 'car';
  vehicleFuelType?: 'petrol' | 'diesel' | 'electric'; // Fuel type of the vehicle
  eta?: string;
  isEtaDelayed?: boolean; // True if calculated ETA is in the past (driver should have arrived)
  phone: string;
}

export interface Evidence {
  status?: string; // Status for which this evidence was submitted
  photos: string[];
  signature?: string;
  sealNumbers: string[];
  notes?: string;
  createdAt?: string;
}

export interface Certificate {
  type: 'chain-of-custody' | 'data-wipe' | 'destruction' | 'recycling';
  generatedDate: string;
  downloadUrl: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  icon: string;
  co2ePerUnit: number; // kg CO2e saved per unit reused
  avgWeight: number; // kg
  avgBuybackValue: number; // £
}

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalCO2eSaved: number;
  totalBuyback: number;
  totalAssets: number;
  avgCharityPercent: number;
  // Travel emissions breakdown by vehicle type
  travelEmissions?: {
    petrol: number; // kg CO2e
    diesel: number; // kg CO2e
    electric: number; // kg CO2e
    totalDistanceKm: number; // Total round trip distance
    totalDistanceMiles: number; // Total round trip distance in miles
  };
  // For client dashboard: actual vs estimated
  completedJobsCount?: number;
  bookedJobsCount?: number;
  completedCO2eSaved?: number;
  estimatedCO2eSaved?: number;
}

export interface JobsFilter {
  status?: WorkflowStatus | 'all';
  clientName?: string;
  clientId?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

