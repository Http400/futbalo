import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface ConfigState {
  apiBaseUrl: string;
}

const initialState: ConfigState = {
  apiBaseUrl: '',
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig: (_state, action: PayloadAction<ConfigState>) => action.payload,
  },
});

export const { setConfig } = configSlice.actions;
export const selectApiBaseUrl = (state: RootState): string => state.config.apiBaseUrl;
export default configSlice.reducer;
