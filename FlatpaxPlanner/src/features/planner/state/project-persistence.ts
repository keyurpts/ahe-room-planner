import type { PlannerDraft } from '@/features/planner/types';

function isDraft(value: unknown): value is PlannerDraft {
  if (!value || typeof value !== 'object') return false;
  return (
    'projectName' in value &&
    typeof value.projectName === 'string' &&
    Boolean(value.projectName.trim()) &&
    'roomType' in value &&
    typeof value.roomType === 'string' &&
    ['Kitchen', 'Laundry', 'Office', 'Linen', 'Garage', 'Other'].includes(value.roomType) &&
    'shape' in value &&
    typeof value.shape === 'string' &&
    [
      'rectangle',
      'l-top-left',
      'l-top-right',
      'square',
      'l-bottom-right',
      'l-bottom-left',
      'custom',
    ].includes(value.shape)
  );
}

const storageKey = 'flatpax-planner-draft';

export interface PersistedProjectState {
  draft: PlannerDraft | null;
  projectID: string | null;
  designCode: string | null;
}

function isProjectID(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

function isDesignCode(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

export function restoreProjectState(): PersistedProjectState {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return { draft: null, projectID: null, designCode: null };
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== 'object' || !('state' in value))
      return { draft: null, projectID: null, designCode: null };
    const state = value.state;
    if (!state || typeof state !== 'object') return { draft: null, projectID: null, designCode: null };

    return {
      draft: 'draft' in state && isDraft(state.draft) ? state.draft : null,
      projectID: 'projectID' in state && isProjectID(state.projectID) ? state.projectID : null,
      designCode: 'designCode' in state && isDesignCode(state.designCode) ? state.designCode : null,
    };
  } catch {
    return { draft: null, projectID: null, designCode: null };
  }
}

export function persistProjectState(project: PersistedProjectState) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ state: project, version: 1 }));
  } catch {
    // Storage restrictions must not interrupt editing in the current session.
  }
}
