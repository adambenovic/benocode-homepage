// lib/constants/index.ts

/**
 * Meeting-related constants
 */
export const MEETING_CONSTANTS = {
  /** Minimum meeting duration in minutes */
  MIN_DURATION: 15,
  /** Maximum meeting duration in minutes */
  MAX_DURATION: 120,
  /** Default meeting duration in minutes */
  DEFAULT_DURATION: 30,
  /** Available meeting duration options in minutes */
  DURATION_OPTIONS: [30, 60, 90] as const,
  /** Number of days to fetch availability for */
  AVAILABILITY_DAYS: 14,
  /** Maximum number of dates to display in the availability picker */
  MAX_DISPLAYED_DATES: 7,
  /** Default timezone */
  DEFAULT_TIMEZONE: 'UTC',
} as const;

/**
 * Form validation constants
 */
export const VALIDATION_CONSTANTS = {
  /** Minimum name length */
  MIN_NAME_LENGTH: 2,
} as const;

/**
 * React Query cache configuration
 */
export const QUERY_CONSTANTS = {
  /** Time in milliseconds before data is considered stale (30 minutes) */
  STALE_TIME: 30 * 60 * 1000,
  /** Time in milliseconds to keep data in cache (1 hour) */
  GC_TIME: 60 * 60 * 1000,
  /** Number of retry attempts for failed queries */
  RETRY_COUNT: 1,
} as const;

/**
 * API configuration
 */
export const API_CONSTANTS = {
  /** Default API base URL */
  DEFAULT_API_URL: 'http://localhost:3001/api/v1',
  /** API version prefix */
  API_VERSION: '/api/v1',
} as const;

/**
 * Pagination constants
 */
export const PAGINATION_CONSTANTS = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 10,
  /** Page size for stats/dashboard */
  STATS_PAGE_SIZE: 1,
} as const;

/**
 * Lead status values
 */
export const LEAD_STATUS = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  CLOSED: 'CLOSED',
} as const;

/**
 * Locale and formatting constants
 */
export const LOCALE_CONSTANTS = {
  /** Default locale for date/time formatting */
  DEFAULT_LOCALE: 'en-US',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  AVAILABILITY_LOAD_FAILED: 'Failed to load available time slots. Please try again later.',
} as const;

