import { createSlice } from "@reduxjs/toolkit";

export interface AppState {
  returnUrl: null | string;
}

const initialState: AppState = {
  returnUrl: null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setReturnUrl: (state, action) => {
      state.returnUrl = action.payload;
    },
  },
});

export const { setReturnUrl } = appSlice.actions;
export default appSlice.reducer;
