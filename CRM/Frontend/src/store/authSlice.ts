import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  role: string;
  orgId?: string | null;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  const user = localStorage.getItem('paramantra_user');
  const accessToken = localStorage.getItem('paramantra_access_token');
  const refreshToken = localStorage.getItem('paramantra_refresh_token');

  return {
    user: user ? JSON.parse(user) : null,
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
    isAuthenticated: !!accessToken,
    isLoading: false,
    error: null,
  };
};

export const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>,
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.error = null;

      if (typeof window !== 'undefined') {
        localStorage.setItem('paramantra_user', JSON.stringify(user));
        localStorage.setItem('paramantra_access_token', accessToken);
        localStorage.setItem('paramantra_refresh_token', refreshToken);
        // Compatibility sync with older Zustand stores
        localStorage.setItem('crm_user', JSON.stringify({ ...user, agentId: user.id }));
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('paramantra_user');
        localStorage.removeItem('paramantra_access_token');
        localStorage.removeItem('paramantra_refresh_token');
        localStorage.removeItem('crm_user');
      }
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setAuthLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;
