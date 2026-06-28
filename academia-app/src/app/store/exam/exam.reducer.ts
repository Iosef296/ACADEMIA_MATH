import { createReducer, on } from '@ngrx/store';
import { createAction, props } from '@ngrx/store';
import { ExamState } from './exam.selectors';

export const startExam = createAction('[Exam] Start', props<{ attemptId: string }>());
export const endExam = createAction('[Exam] End');

const initial: ExamState = { attemptId: null, active: false };

export const examReducer = createReducer(
  initial,
  on(startExam, (_, { attemptId }) => ({ attemptId, active: true })),
  on(endExam, () => initial),
);
