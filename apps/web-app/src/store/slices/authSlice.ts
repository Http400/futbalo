import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  name: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  name: null,
};

function decodeJwtPayload<T>(token: string): T {
  const part = token.split('.')[1] ?? '';
  return JSON.parse(atob(part)) as T;
}

interface AccessPayload {
  name: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: () => initialState,
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.register.matchFulfilled, (state, action) => {
        const { accessToken, refreshToken } = action.payload.data;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.name = decodeJwtPayload<AccessPayload>(accessToken).name;
      })
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        const { accessToken, refreshToken } = action.payload.data;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.name = decodeJwtPayload<AccessPayload>(accessToken).name;
      })
      .addMatcher(authApi.endpoints.refresh.matchFulfilled, (state, action) => {
        const { accessToken } = action.payload.data;
        state.accessToken = accessToken;
        state.name = decodeJwtPayload<AccessPayload>(accessToken).name;
      });
  },
});

export const { logout, setTokens } = authSlice.actions;
export default authSlice.reducer;
