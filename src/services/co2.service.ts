// Mock CO₂ Calculation Service
import { assetCategories } from '@/mocks/mock-data';
import { 
  calculateReuseCO2e, 
  calculateTravelEmissions,
  calculateRoundTripDistance,
  calculateAllVehicleEmissions,
  kmToMiles,
  WAREHOUSE_POSTCODE
} from '@/lib/calculations';
import { delay, shouldSimulateError, ApiError, ApiErrorType } from './api-error';
import { USE_MOCK_API } from '@/lib/config';
import { apiClient } from './api-client';

const SERVICE_NAME = 'co2';

export interface CO2CalculationRequest {
  assets: Array<{
    categoryId: string;
    quantity: number;
  }>;
  distanceKm?: number;
  vehicleType?: 'car' | 'van' | 'truck' | 'petrol' | 'diesel' | 'electric';
  collectionCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CO2CalculationResponse {
  reuseSavings: number; // kg CO2e
  travelEmissions: number; // kg CO2e (for selected/default vehicle type)
  netImpact: number; // kg CO2e
  distanceKm: number; // Total round trip distance
  distanceMiles: number; // Total round trip distance in miles
  vehicleEmissions: {
    petrol: number; // kg CO2e
    diesel: number; // kg CO2e
    electric: number; // kg CO2e
  };
  equivalencies: {
    treesPlanted: number;
    householdDays: number;
    carMiles: number;
    flightHours: number;
  };
}

// CO2e equivalencies
const co2eEquivalencies = {
  treesPlanted: (kg: number) => Math.round(kg / 21), // 1 tree absorbs ~21kg CO2/year
  householdDays: (kg: number) => Math.round(kg / 27), // UK household ~27kg CO2/day
  carMiles: (kg: number) => Math.round(kg / 0.21), // ~0.21kg CO2 per mile
  flightHours: (kg: number) => Math.round(kg / 250), // ~250kg CO2 per flight hour
};

class CO2Service {
  async calculateCO2e(request: CO2CalculationRequest): Promise<CO2CalculationResponse> {
    // Use real API if not using mocks
    if (!USE_MOCK_API) {
      return this.calculateCO2eAPI(request);
    }

    return this.calculateCO2eMock(request);
  }

  private async calculateCO2eAPI(request: CO2CalculationRequest): Promise<CO2CalculationResponse> {
    const payload: any = {
      assets: request.assets,
    };

    // Add optional fields if provided
    if (request.distanceKm !== undefined) {
      payload.distanceKm = request.distanceKm;
    }
    if (request.collectionCoordinates) {
      payload.collectionLat = request.collectionCoordinates.lat;
      payload.collectionLng = request.collectionCoordinates.lng;
    }
    if (request.vehicleType) {
      payload.vehicleType = request.vehicleType;
    }

    const response = await apiClient.post<CO2CalculationResponse>('/co2/calculate', payload);
    return response;
  }

  private async calculateCO2eMock(request: CO2CalculationRequest): Promise<CO2CalculationResponse> {
    await delay(500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      throw new ApiError(
        config.errorType || ApiErrorType.SERVER_ERROR,
        'Failed to calculate CO₂e. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // Calculate reuse savings
    const reuseSavings = calculateReuseCO2e(request.assets, assetCategories);

    // Calculate distance using road distance (async)
    let distance: number;
    if (request.distanceKm !== undefined) {
      // Use provided distance
      distance = request.distanceKm;
    } else if (request.collectionCoordinates) {
      // Calculate road distance from collection site to warehouse (round trip)
      try {
        distance = await calculateRoundTripDistance(
          request.collectionCoordinates.lat,
          request.collectionCoordinates.lng
        );
      } catch (error) {
        console.error('Error calculating road distance in mock:', error);
        // Fallback to default distance if routing API fails
        distance = 80;
      }
    } else {
      // Default fallback
      distance = 80;
    }

    // Calculate emissions for all vehicle types
    const vehicleEmissions = calculateAllVehicleEmissions(distance);
    
    // Use selected vehicle type or default to petrol
    const vehicleType = request.vehicleType || 'petrol';
    // Handle electric vehicles explicitly (0 is falsy, so we need to check the key exists)
    const travelEmissions = vehicleType === 'electric' 
      ? 0 
      : (vehicleEmissions[vehicleType as keyof typeof vehicleEmissions] ?? vehicleEmissions.petrol);

    // Calculate net impact using selected vehicle type
    const netImpact = reuseSavings - travelEmissions;

    // Calculate equivalencies
    const equivalencies = {
      treesPlanted: co2eEquivalencies.treesPlanted(netImpact),
      householdDays: co2eEquivalencies.householdDays(netImpact),
      carMiles: co2eEquivalencies.carMiles(netImpact),
      flightHours: co2eEquivalencies.flightHours(netImpact),
    };

    return {
      reuseSavings,
      travelEmissions,
      netImpact,
      distanceKm: distance,
      distanceMiles: kmToMiles(distance),
      vehicleEmissions,
      equivalencies,
    };
  }

  async getJobCO2e(jobId: string): Promise<CO2CalculationResponse | null> {
    await delay(500);

    // Simulate errors
    if (shouldSimulateError(SERVICE_NAME)) {
      const config = JSON.parse(localStorage.getItem(`error_sim_${SERVICE_NAME}`) || '{}');
      if (config.errorType === ApiErrorType.NOT_FOUND) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND,
          `CO₂e data for job "${jobId}" was not found.`,
          404,
          { jobId }
        );
      }
      throw new ApiError(
        config.errorType || ApiErrorType.NETWORK_ERROR,
        'Failed to fetch CO₂e data. Please try again.',
        config.errorType === ApiErrorType.NETWORK_ERROR ? 0 : 500
      );
    }

    // This would fetch from backend in real implementation
    // For now, return mock data
    return {
      reuseSavings: 50000,
      travelEmissions: 100,
      netImpact: 49900,
      equivalencies: {
        treesPlanted: 2376,
        householdDays: 1848,
        carMiles: 237619,
        flightHours: 199,
      },
    };
  }
}

export const co2Service = new CO2Service();

