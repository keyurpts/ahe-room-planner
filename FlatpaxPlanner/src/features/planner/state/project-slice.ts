import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PlannerDraft, PlannerStep } from '@/features/planner/types';

interface ProjectState {
  draft: PlannerDraft | null;
  activeStep: PlannerStep;
}
const initialState: ProjectState = { draft: null, activeStep: 'Room setup' };
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setActiveStep(state, action: PayloadAction<PlannerStep>) {
      state.activeStep = action.payload;
    },
    startProject(state, action: PayloadAction<PlannerDraft>) {
      state.draft = action.payload;
      state.activeStep = 'Room setup';
    },
    discardProject(state) {
      state.draft = null;
      state.activeStep = 'Room setup';
    },
  },
});
export const { startProject, discardProject, setActiveStep } = projectSlice.actions;
export const projectReducer = projectSlice.reducer;
