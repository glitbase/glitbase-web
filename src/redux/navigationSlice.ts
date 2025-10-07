import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    path: null,
    message: null
};

export const navigationSlice = createSlice({
    name: 'navigation',
    initialState: initialState,
    reducers: {
        navigateTo: (state, action) => {
            const {path, message} = action.payload;
            state.path = path;
            state.message = message;
        },
        clearNavigation: (state) => {
            state.path = null;
            state.message = null;
        },
    },
});

export const { navigateTo, clearNavigation } = navigationSlice.actions;
export default navigationSlice.reducer;
