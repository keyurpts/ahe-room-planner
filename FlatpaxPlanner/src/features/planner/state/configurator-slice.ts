import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { FloorplanManager, ConfiguratorCore } from "three-configurator";


interface ConfiguratorState {
    floorPlanManager: FloorplanManager | null;
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
        setFloorPlanManager(state, action: PayloadAction<FloorplanManager | null>) {
            state.floorPlanManager = action.payload;
        },

        setConfiguratorCore(state, action: PayloadAction<ConfiguratorCore | null>) {
            state.configuratorCore = action.payload;
        },
    },
});

export const {
    setFloorPlanManager,
    setConfiguratorCore,
} = configuratorSlice.actions;
export const configuratorReducer = configuratorSlice.reducer;