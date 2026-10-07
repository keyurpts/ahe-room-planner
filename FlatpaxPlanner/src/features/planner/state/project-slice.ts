import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PlannerDraft } from '@/features/planner/types';

interface ProjectState {
  draft: PlannerDraft | null;
}
const initialState: ProjectState = { draft: null };
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    startProject(state, action: PayloadAction<PlannerDraft>) {
      state.draft = action.payload;
    },
    discardProject(state) {
      state.draft = null;
    },
  },
});
export const { startProject, discardProject } = projectSlice.actions;
export const projectReducer = projectSlice.reducer;
