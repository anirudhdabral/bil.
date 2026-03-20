import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type SelectedHomeState = {
  selectedHomeId: string | null;
};

const initialState: SelectedHomeState = {
  selectedHomeId: null,
};

const selectedHomeSlice = createSlice({
  name: "selectedHome",
  initialState,
  reducers: {
    setSelectedHomeId(state, action: PayloadAction<string | null>) {
      state.selectedHomeId = action.payload;
    },
  },
});

export const { setSelectedHomeId } = selectedHomeSlice.actions;

export default selectedHomeSlice.reducer;
