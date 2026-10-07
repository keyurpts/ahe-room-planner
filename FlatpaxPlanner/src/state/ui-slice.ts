import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { env } from '@/config/env';

type ColorScheme = 'system' | 'light' | 'dark';
interface UiState {
  regionId: string | null;
  colorScheme: ColorScheme;
}
const initialState: UiState = { colorScheme: 'system', regionId: env.regionId };
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setRegionId(state, action: PayloadAction<string | null>) {
      state.regionId = action.payload;
    },
    setColorScheme(state, action: PayloadAction<ColorScheme>) {
      state.colorScheme = action.payload;
    },
  },
});
export const { setColorScheme, setRegionId } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
