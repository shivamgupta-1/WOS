/**
 * Holds only the in-progress onboarding draft, keeping UI workflow state out of RTK
 * Query's server cache. The form mirrors this state to sessionStorage for refreshes.
 */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { OnboardingValues } from './schemas';

interface OnboardingState {
  draft: Partial<OnboardingValues> | null;
}

const initialState: OnboardingState = { draft: null };

/** Reducer for saving, restoring, and clearing the current onboarding draft. */
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    saveOnboardingDraft(state, action: PayloadAction<Partial<OnboardingValues>>) {
      state.draft = action.payload;
    },
    clearOnboardingDraft(state) {
      state.draft = null;
    },
  },
});

export const { saveOnboardingDraft, clearOnboardingDraft } = onboardingSlice.actions;
export default onboardingSlice.reducer;