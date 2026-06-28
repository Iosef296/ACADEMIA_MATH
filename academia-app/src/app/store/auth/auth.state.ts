export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  profile?: {
    xp_total: number;
    streak_current: number;
    streak_max: number;
    ranking_visible: boolean;
    avatar_config: Record<string, any>;
  };
}

export interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  access_token: null,
  refresh_token: null,
  loading: false,
  error: null,
  initialized: false,
};
