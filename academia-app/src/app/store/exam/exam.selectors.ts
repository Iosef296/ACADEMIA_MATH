import { createFeatureSelector, createSelector } from '@ngrx/store';

export interface ExamState {
  attemptId: string | null;
  active: boolean;
}

export const selectExamState = createFeatureSelector<ExamState>('exam');
export const selectExamActive = createSelector(selectExamState, (s: ExamState) => s.active);
export const selectAttemptId = createSelector(selectExamState, (s: ExamState) => s.attemptId);
