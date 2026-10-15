import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PlannerDraft, PlannerStep } from '@/features/planner/types';

interface ProjectState {
  draft: PlannerDraft | null;
  projectID: string | null;
  designCode: string | null;
  activeStep: PlannerStep;
}
const initialState: ProjectState = { draft: null, projectID: null, designCode: null, activeStep: 'Room setup' };
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setActiveStep(state, action: PayloadAction<PlannerStep>) {
      state.activeStep = action.payload;
    },
    setProjectID(state, action: PayloadAction<string>) {
      state.projectID = action.payload;
    },
    setDesignCode(state, action: PayloadAction<string>) {
      state.designCode = action.payload;
    },
    startProject(state, action: PayloadAction<PlannerDraft>) {
      state.draft = action.payload;
      state.projectID = null;
      state.designCode = null;
      state.activeStep = 'Room setup';
    },
    discardProject(state) {
      state.draft = null;
      state.projectID = null;
      state.designCode = null;
      state.activeStep = 'Room setup';
    },
  },
});
export const { startProject, discardProject, setActiveStep, setProjectID, setDesignCode } = projectSlice.actions;
export const projectReducer = projectSlice.reducer;
