import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FloorplanManager, ConfiguratorCore } from 'three-configurator';

interface ConfiguratorState {
  floorPlanManager: FloorplanManager | null;
  configuratorCore: ConfiguratorCore | null;
  itemCodeLookup: Record<string, string>;
}

const initialState: ConfiguratorState = {
  floorPlanManager: null,
  configuratorCore: null,
  itemCodeLookup: {},
};

const configuratorSlice = createSlice({
  name: 'configurator',
  initialState,
  reducers: {
    setFloorPlanManager(state, action: PayloadAction<FloorplanManager | null>) {
      state.floorPlanManager = action.payload;
    },

    setConfiguratorCore(state, action: PayloadAction<ConfiguratorCore | null>) {
      state.configuratorCore = action.payload;
    },

    registerItemCodes(state, action: PayloadAction<Record<string, string>>) {
      Object.assign(state.itemCodeLookup, action.payload);
    },
  },
});

export const { setFloorPlanManager, setConfiguratorCore, registerItemCodes } =
  configuratorSlice.actions;
export const configuratorReducer = configuratorSlice.reducer;
