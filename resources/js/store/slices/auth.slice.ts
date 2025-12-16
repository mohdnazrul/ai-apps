import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  // add more fields if you expose them in Inertia props
};

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  // optional: useful for guards / UI
  hydrated: boolean;
};

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth(
      state,
      action: PayloadAction<{ user: AuthUser | null }>
    ) {
      state.user = action.payload.user;
      state.isAuthenticated = !!action.payload.user;
      state.hydrated = true;
    },

    clearAuth(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.hydrated = true;
    },
  },
});

export const { hydrateAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
