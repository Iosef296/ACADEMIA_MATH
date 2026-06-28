import { createAction, props } from '@ngrx/store';
import { User } from './auth.state';

export const login = createAction('[Auth] Login', props<{ email: string; password: string }>());
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: User; access_token: string; refresh_token: string }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());

export const register = createAction('[Auth] Register', props<{ name: string; email: string; password: string; role?: string }>());
export const registerSuccess = createAction('[Auth] Register Success', props<{ user: User; access_token: string; refresh_token: string }>());
export const registerFailure = createAction('[Auth] Register Failure', props<{ error: string }>());

export const logout = createAction('[Auth] Logout');
export const loadUserFromStorage = createAction('[Auth] Load From Storage');
export const setUser = createAction('[Auth] Set User', props<{ user: User; access_token: string; refresh_token: string }>());
