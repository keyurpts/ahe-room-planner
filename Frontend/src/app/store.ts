import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  projectReducer,
  startProject,
  discardProject,
  setProjectID,
  setDesignCode,
} from '@/features/planner/state/project-slice';
import {
  persistProjectState,
  restoreProjectState,
  type PersistedProjectState,
} from '@/features/planner/state/project-persistence';
import { uiReducer } from '@/state/ui-slice';
import { configuratorReducer } from '@/features/planner/state/configurator-slice';

import { env } from '@/config/env';
import { catalogueApi } from '@/features/planner/catalogue/catalogue-api';
import { setupListeners } from '@reduxjs/toolkit/query';

const persistence = createListenerMiddleware();
const restoredProject = restoreProjectState();

persistence.startListening({
  matcher: isAnyOf(startProject, discardProject, setProjectID, setDesignCode),
  effect: (_action, listenerApi) => {
    const { project } = listenerApi.getState() as { project: PersistedProjectState };
    persistProjectState(project);
  },
});

export const store = configureStore({
  reducer: {
    project: projectReducer,
    ui: uiReducer,
    configurator: configuratorReducer,

    [catalogueApi.reducerPath]: catalogueApi.reducer,
  },

  preloadedState: {
    project: {
      draft: restoredProject.draft,
      projectID: restoredProject.projectID,
      designCode: restoredProject.designCode,
      activeStep: 'Room setup' as const,
    },
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['configurator/setFloorPlanManager', 'configurator/setConfiguratorCore'],
        ignoredPaths: ['configurator.floorPlanManager', 'configurator.configuratorCore'],
      },
    })
      .prepend(persistence.middleware)
      .concat(catalogueApi.middleware),

  devTools: env.appEnvironment === 'development',
});
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
