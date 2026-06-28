import { createReducer, on } from '@ngrx/store';
import { initialAuthState } from './auth.state';
import * as AuthActions from './auth.actions';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, AuthActions.register, (state) => ({ ...state, loading: true, error: null })),

  on(AuthActions.loginSuccess, AuthActions.registerSuccess, AuthActions.setUser, (state, { user, access_token, refresh_token }) => ({
    ...state, user, access_token, refresh_token, loading: false, error: null, initialized: true,
  })),

  on(AuthActions.loginFailure, AuthActions.registerFailure, (state, { error }) => ({
    ...state, loading: false, error, initialized: true,
  })),

  on(AuthActions.logout, () => ({ ...initialAuthState, initialized: true })),
);
