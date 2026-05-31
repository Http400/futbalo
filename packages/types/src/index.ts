export interface Stadium {
  id: string;
  name: string;
  fifaName: string | null;
  city: string;
  country: string | null;
  countryCode: string;
  timezone: string;
  capacity: number;
  coords: string | null;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Catalog types
export type Continent =
  | 'AFRICA'
  | 'ASIA'
  | 'EUROPE'
  | 'NORTH_AMERICA'
  | 'OCEANIA'
  | 'SOUTH_AMERICA';

export type Confederation = 'AFC' | 'CAF' | 'CONCACAF' | 'CONMEBOL' | 'OFC' | 'UEFA';

export interface Team {
  id: string;
  fifaCode: string;
  name: string;
  continent: Continent;
  confederation: Confederation;
  flagUrl: string | null;
  flagIcon: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Competition {
  id: string;
  name: string;
  edition: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  competitionId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSummary {
  id: string;
  fifaCode: string;
  name: string;
  continent: Continent;
  confederation: Confederation;
  flagUrl: string | null;
  flagIcon: string | null;
}

export interface GroupWithTeams extends Group {
  teams: TeamSummary[];
}

export interface Stage {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  competitionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Shared user types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user' | 'guest';

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
