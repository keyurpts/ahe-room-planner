import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  projectReducer,
  startProject,
  discardProject,
} from '@/features/planner/state/project-slice';
import { persistDraft, restoreDraft } from '@/features/planner/state/project-persistence';
import { uiReducer } from '@/state/ui-slice';
import { configuratorReducer } from '@/features/planner/state/configurator-slice';

import { env } from '@/config/env';
import { catalogueApi } from '@/features/planner/catalogue/catalogue-api';
import { setupListeners } from '@reduxjs/toolkit/query';

const persistence = createListenerMiddleware();

persistence.startListening({
  matcher: isAnyOf(startProject, discardProject),
  effect: (action) => {
    persistDraft(startProject.match(action) ? action.payload : null);
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
      draft: restoreDraft(),
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
