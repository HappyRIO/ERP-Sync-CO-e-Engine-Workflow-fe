// Transform backend data to frontend format
import type { Job, Asset, Driver, Evidence, Certificate } from '@/types/jobs';
import type { WorkflowStatus } from '@/types/jobs';

// Backend job format (from Prisma)
interface BackendJob {
  id: string;
  erpJobNumber: string;
  bookingId?: string | null;
  clientName: string;
  organisationName?: string; // Organisation/company name
  siteName: string;
  siteAddress: string;
  status: string; // 'en_route' format
  scheduledDate: string | Date;
  completedDate?: string | Date | null;
  co2eSaved: number;
  travelEmissions: number;
  buybackValue: number;
  charityPercent: number;
  roundTripDistanceKm?: number | null; // From booking
  roundTripDistanceMiles?: number | null; // From booking
  assets?: BackendJobAsset[];
  driver?: BackendDriver | null;
  evidence?: BackendEvidence[] | BackendEvidence | null; // Can be array (new format) or single object (backward compatibility)
  certificates?: BackendCertificate[];
}

interface BackendJobAsset {
  id: string;
  categoryId: string;
  categoryName: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
  };
  quantity: number;
  serialNumbers?: string[];
  grade?: string | null;
  weight?: number | null;
  sanitised?: boolean;
  wipeMethod?: string | null;
  sanitisationRecordId?: string | null;
  gradingRecordId?: string | null;
  resaleValue?: number | null;
}

interface BackendDriver {
  id: string;
  name: string;
  email?: string;
  role?: string;
  vehicleReg?: string;
  vehicleType?: 'van' | 'truck' | 'car';
  vehicleFuelType?: 'petrol' | 'diesel' | 'electric';
  phone?: string;
}

interface BackendEvidence {
  status?: string; // Status for which this evidence was submitted
  photos: string[];
  signature?: string | null;
  sealNumbers: string[];
  notes?: string | null;
  createdAt?: string | Date;
}

interface BackendCertificate {
  id: string;
  type: string;
  generatedDate: string | Date;
  downloadUrl: string;
  externalUrl?: string | null;
}

/**
 * Transform backend job status to frontend format
 */
function transformStatus(status: string): WorkflowStatus {
  // Convert 'en_route' to 'en-route', etc.
  const statusMap: Record<string, WorkflowStatus> = {
    'booked': 'booked',
    'routed': 'routed',
    'en_route': 'en-route',
    'arrived': 'arrived',
    'collected': 'collected',
    'warehouse': 'warehouse',
    'sanitised': 'sanitised',
    'graded': 'graded',
    'completed': 'completed',
    'cancelled': 'cancelled',
  };
  
  return statusMap[status] || status as WorkflowStatus;
}

/**
 * Transform backend job asset to frontend format
 */
function transformAsset(asset: BackendJobAsset): Asset {
  return {
    id: asset.id,
    category: asset.categoryId || asset.category?.id || asset.categoryName, // Prefer categoryId, fallback to categoryName
    categoryId: asset.categoryId || asset.category?.id, // Include categoryId for matching
    categoryName: asset.categoryName || asset.category?.name, // Include categoryName for display
    quantity: asset.quantity,
    serialNumbers: asset.serialNumbers || [],
    grade: asset.grade as Asset['grade'] | undefined,
    weight: asset.weight || undefined,
    sanitised: asset.sanitised || false,
    wipeMethod: asset.wipeMethod || undefined,
    sanitisationRecordId: asset.sanitisationRecordId || undefined,
    gradingRecordId: asset.gradingRecordId || undefined,
    resaleValue: asset.resaleValue || undefined,
  };
}

/**
 * Transform backend driver to frontend format
 */
function transformDriver(driver: BackendDriver | null | undefined): Driver | undefined {
  if (!driver) return undefined;
  
  return {
    id: driver.id,
    name: driver.name,
    vehicleReg: driver.vehicleReg || 'N/A',
    vehicleType: driver.vehicleType || 'van',
    vehicleFuelType: driver.vehicleFuelType || 'diesel',
    phone: driver.phone || driver.email || 'N/A',
  };
}

/**
 * Transform backend evidence to frontend format
 * Handles both array (new format) and single object (backward compatibility)
 */
function transformEvidence(evidence: BackendEvidence[] | BackendEvidence | null | undefined): Evidence[] | Evidence | undefined {
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Frontend Transform] transformEvidence input:', {
      isArray: Array.isArray(evidence),
      type: typeof evidence,
      length: Array.isArray(evidence) ? evidence.length : 'N/A',
      value: evidence,
    });
  }
  
  if (!evidence) return undefined;
  
  // If it's an array, transform each item
  if (Array.isArray(evidence)) {
    const transformed = evidence.map((ev) => ({
      status: ev.status,
      photos: ev.photos || [],
      signature: ev.signature || undefined,
      sealNumbers: ev.sealNumbers || [],
      notes: ev.notes || undefined,
      createdAt: ev.createdAt 
        ? (typeof ev.createdAt === 'string' ? ev.createdAt : ev.createdAt.toISOString())
        : undefined,
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Frontend Transform] transformEvidence output (array):', {
        count: transformed.length,
        items: transformed.map((ev, idx) => ({
          index: idx,
          status: ev.status,
          photosCount: ev.photos.length,
          hasSignature: !!ev.signature,
        })),
      });
    }
    
    return transformed;
  }
  
  // Single object (backward compatibility)
  const transformed = {
    status: evidence.status,
    photos: evidence.photos || [],
    signature: evidence.signature || undefined,
    sealNumbers: evidence.sealNumbers || [],
    notes: evidence.notes || undefined,
    createdAt: evidence.createdAt 
      ? (typeof evidence.createdAt === 'string' ? evidence.createdAt : evidence.createdAt.toISOString())
      : undefined,
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Frontend Transform] transformEvidence output (single object):', transformed);
  }
  
  return transformed;
}

/**
 * Transform backend certificate to frontend format
 */
function transformCertificate(cert: BackendCertificate): Certificate {
  const typeMap: Record<string, Certificate['type']> = {
    'chain_of_custody': 'chain-of-custody',
    'data_wipe': 'data-wipe',
    'destruction': 'destruction',
    'recycling': 'recycling',
    'esg_report': 'recycling', // Default
  };
  
  return {
    type: typeMap[cert.type] || 'chain-of-custody',
    generatedDate: typeof cert.generatedDate === 'string' 
      ? cert.generatedDate 
      : cert.generatedDate.toISOString(),
    downloadUrl: cert.downloadUrl,
  };
}

/**
 * Transform backend job to frontend format
 */
export function transformJob(backendJob: BackendJob): Job {
  // Debug logging for evidence
  if (process.env.NODE_ENV === 'development') {
    console.log('[Frontend Transform] transformJob - backendJob.evidence:', {
      isArray: Array.isArray(backendJob.evidence),
      type: typeof backendJob.evidence,
      length: Array.isArray(backendJob.evidence) ? backendJob.evidence.length : 'N/A',
      value: backendJob.evidence,
    });
  }
  
  const transformedEvidence = transformEvidence(backendJob.evidence);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Frontend Transform] transformJob - transformedEvidence:', {
      isArray: Array.isArray(transformedEvidence),
      type: typeof transformedEvidence,
      length: Array.isArray(transformedEvidence) ? transformedEvidence.length : 'N/A',
      value: transformedEvidence,
    });
  }
  
  return {
    id: backendJob.id,
    erpJobNumber: backendJob.erpJobNumber,
    bookingId: backendJob.bookingId || undefined,
    clientName: backendJob.clientName,
    organisationName: backendJob.organisationName,
    siteName: backendJob.siteName,
    siteAddress: backendJob.siteAddress,
    status: transformStatus(backendJob.status),
    scheduledDate: typeof backendJob.scheduledDate === 'string'
      ? backendJob.scheduledDate
      : backendJob.scheduledDate.toISOString(),
    completedDate: backendJob.completedDate
      ? (typeof backendJob.completedDate === 'string'
          ? backendJob.completedDate
          : backendJob.completedDate.toISOString())
      : undefined,
    assets: (backendJob.assets || []).map(transformAsset),
    driver: transformDriver(backendJob.driver),
    co2eSaved: backendJob.co2eSaved,
    travelEmissions: backendJob.travelEmissions,
    buybackValue: backendJob.buybackValue,
    charityPercent: backendJob.charityPercent,
    roundTripDistanceKm: backendJob.roundTripDistanceKm ?? undefined,
    roundTripDistanceMiles: backendJob.roundTripDistanceMiles ?? undefined,
    evidence: transformedEvidence as Evidence[] | Evidence | undefined,
    certificates: (backendJob.certificates || []).map(transformCertificate),
  };
}

/**
 * Transform array of backend jobs to frontend format
 */
export function transformJobs(backendJobs: BackendJob[]): Job[] {
  return backendJobs.map(transformJob);
}

