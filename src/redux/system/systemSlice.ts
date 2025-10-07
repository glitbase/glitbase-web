import { createSlice } from "@reduxjs/toolkit";

export const THEME_KEY = "stv-admin-theme";
export const THEME_FONT = "stv-admin-font";

export enum DashboardPages {
  HOME = "home",
  CREDIT_ALERT = "credits-alert",
  CREDIT_REPORT = "credit-report",
  SCORE_INGRIDIENT = "score-ingredient",
}

export interface SystemState {
  loading: boolean;
  theme: "light" | "dark" | string;
  walkThrough: { isWalkThroughActive: boolean; step: number };
  dashboardPage: {
    page: DashboardPages;
  };
  curr: number;
}

const initialState: SystemState = {
  loading: false,
  theme: localStorage.getItem(THEME_KEY) ?? "light",
  walkThrough: {
    isWalkThroughActive: false,
    step: 0,
  },
  dashboardPage: { page: DashboardPages.HOME },
  curr: 0,
};

const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {
    systemLoading: (state) => {
      state.loading = true;
    },
    updateTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem(THEME_KEY, action.payload);
    },
    systemFailed: (state) => {
      state.loading = false;
    },
    updateWalkThrough: (state, action) => {
      state.walkThrough = action.payload;
    },
    updateDashboardPage: (state, action) => {
      state.dashboardPage.page = action.payload;
    },
    setCurr: (state, action) => {
      state.curr = action.payload;
    },
  },
});

export const {
  systemLoading,
  systemFailed,
  updateTheme,
  updateWalkThrough,
  updateDashboardPage,
  setCurr,
} = systemSlice.actions;
export default systemSlice.reducer;
