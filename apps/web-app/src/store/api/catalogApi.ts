import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiResponse, Match, PaginatedResponse, Stadium, Stage, Team } from '@futbalo/types';

export interface GetMatchesParams {
  page: number;
  limit: number;
}

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL  }),
  endpoints: (build) => ({
    getMatches: build.query<PaginatedResponse<Match>, GetMatchesParams>({
      query: ({ page, limit }) => `/data/matches?page=${page}&limit=${limit}`,
    }),
    getTeams: build.query<Team[], void>({
      query: () => '/data/teams',
      transformResponse: (response: ApiResponse<Team[]>) => response.data,
    }),
    getStadiums: build.query<Stadium[], void>({
      query: () => '/data/stadiums',
      transformResponse: (response: ApiResponse<Stadium[]>) => response.data,
    }),
    getStages: build.query<Stage[], void>({
      query: () => '/data/stages',
      transformResponse: (response: ApiResponse<Stage[]>) => response.data,
    }),
  }),
});

export const { useGetMatchesQuery, useGetTeamsQuery, useGetStadiumsQuery, useGetStagesQuery } = catalogApi;
