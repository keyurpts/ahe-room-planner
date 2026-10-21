import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FloorplanManagerWrapper, ConfiguratorCore } from 'wrapper';

interface ConfiguratorState {
  floorPlanManager: FloorplanManagerWrapper | null;
  configuratorCore: ConfiguratorCore | null;
}

const initialState: ConfiguratorState = {
  floorPlanManager: null,
  configuratorCore: null,
};

const configuratorSlice = createSlice({
  name: 'configurator',
  initialState,
  reducers: {
    setFloorPlanManager(state, action: PayloadAction<FloorplanManagerWrapper | null>) {
      state.floorPlanManager = action.payload;
    },

    setConfiguratorCore(state, action: PayloadAction<ConfiguratorCore | null>) {
      state.configuratorCore = action.payload;
    },
  },
});

export const { setFloorPlanManager, setConfiguratorCore } = configuratorSlice.actions;
export const configuratorReducer = configuratorSlice.reducer;
