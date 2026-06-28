import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectCurrentUser = createSelector(selectAuthState, (s) => s.user);
export const selectIsAuthenticated = createSelector(selectAuthState, (s) => !!s.access_token);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);
export const selectUserRole = createSelector(selectAuthState, (s) => s.user?.role);
export const selectInitialized = createSelector(selectAuthState, (s) => s.initialized);
