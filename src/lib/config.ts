// Application configuration and environment flags

/**
 * Determines if the application should use mock API services.
 * Set VITE_MOCK_API=true in .env file to use mock services.
 * When false, services should connect to real backend API.
 * 
 * Defaults to true for Milestone 1 (frontend-only development).
 */
export const USE_MOCK_API = import.meta.env.VITE_MOCK_API === 'true';

/**
 * Base URL for the backend API (when not using mocks)
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

