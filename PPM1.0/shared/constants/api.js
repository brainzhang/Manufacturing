// Shared API constants

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register'
  },
  PARTS: {
    BASE: '/api/v1/parts',
    LIST: '/api/v1/parts',
    CREATE: '/api/v1/parts',
    UPDATE: (id) => `/api/v1/parts/${id}`,
    DELETE: (id) => `/api/v1/parts/${id}`
  },
  BOMS: {
    BASE: '/api/v1/boms',
    LIST: '/api/v1/boms',
    CREATE: '/api/v1/boms',
    UPDATE: (id) => `/api/v1/boms/${id}`,
    DELETE: (id) => `/api/v1/boms/${id}`,
    ALIGN: (id) => `/api/v1/boms/${id}/align`
  },
  PN_MAPS: {
    BASE: '/api/v1/pn-maps',
    LIST: '/api/v1/pn-maps',
    CREATE: '/api/v1/pn-maps',
    UPDATE: (id) => `/api/v1/pn-maps/${id}`,
    DELETE: (id) => `/api/v1/pn-maps/${id}`
  },
  ALIGNMENTS: {
    BASE: '/api/v1/alignments',
    LIST: '/api/v1/alignments',
    CREATE: '/api/v1/alignments',
    UPDATE: (id) => `/api/v1/alignments/${id}`
  },
  DASHBOARD: {
    BASE: '/api/v1/dashboard',
    OVERVIEW: '/api/v1/dashboard'
  }
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};