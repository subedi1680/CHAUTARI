// Configuration file for environment variables and other settings

// API Base URL - use environment variable or fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Other configuration variables can be added here
export const APP_NAME = 'CHAUTARI';
export const FILE_UPLOAD_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif'];
export const DEFAULT_PAGINATION_LIMIT = 10;
