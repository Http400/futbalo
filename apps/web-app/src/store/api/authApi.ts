import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiResponse, AuthTokens, LoginRequest } from '@futbalo/types';

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL }),
  endpoints: (build) => ({
    register: build.mutation<ApiResponse<AuthTokens>, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: build.mutation<ApiResponse<AuthTokens>, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    refresh: build.mutation<ApiResponse<Pick<AuthTokens, 'accessToken'>>, RefreshRequest>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useRefreshMutation } = authApi;
