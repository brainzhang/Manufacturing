// Shared types between frontend and backend

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  PRODUCT_MANAGER: 'product_manager',
  SALES: 'sales',
  PROCUREMENT: 'procurement',
  FINANCE: 'finance'
};

// Part categories
export const PART_CATEGORIES = {
  CPU: 'CPU',
  MEMORY: 'Memory',
  STORAGE: 'Storage',
  DISPLAY: 'Display',
  GPU: 'GPU',
  NETWORK: 'Network',
  CHASSIS: 'Chassis',
  POWER: 'Power',
  COOLING: 'Cooling',
  SERVER_COMPONENTS: 'Server Components'
};

// Status enums
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  DISCARDED: 'discarded',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Match strength
export const MATCH_STRENGTH = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Alignment priority
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};