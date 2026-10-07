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
    ].includes(value.shape)
  );
}

const storageKey = 'flatpax-planner-draft';

export function restoreDraft(): PlannerDraft | null {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return null;
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== 'object' || !('state' in value)) return null;
    const state = value.state;
    return state && typeof state === 'object' && 'draft' in state && isDraft(state.draft)
      ? state.draft
      : null;
  } catch {
    return null;
  }
}

export function persistDraft(draft: PlannerDraft | null) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ state: { draft }, version: 1 }));
  } catch {
    // Storage restrictions must not interrupt editing in the current session.
  }
}
