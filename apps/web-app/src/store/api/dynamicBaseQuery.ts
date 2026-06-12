import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

export const dynamicBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = (args, api, extraOptions) => {
  const baseUrl = (api.getState() as { config: { apiBaseUrl: string } }).config.apiBaseUrl;
  return fetchBaseQuery({ baseUrl })(args, api, extraOptions);
};
