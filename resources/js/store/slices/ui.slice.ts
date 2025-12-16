import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UIState = {
  sidebarCollapsed: boolean;
};

const initialState: UIState = {
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setSidebarCollapsed, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
