// shared/types/index.ts
// Shared TypeScript types between frontend and backend

export enum Locale {
  EN = 'EN',
  SK = 'SK',
  DE = 'DE',
  CZ = 'CZ',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  CLOSED = 'CLOSED',
}

export enum MeetingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum ContentType {
  TEXT = 'TEXT',
  RICH_TEXT = 'RICH_TEXT',
  HTML = 'HTML',
  JSON = 'JSON',
}

