import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  isAddHomeOpen: boolean;
  isAddCategoryOpen: boolean;
  isAddBillOpen: boolean;
  isInviteUserOpen: boolean;
  globalLoading: boolean;
  globalError: string | null;
};

const initialState: UiState = {
  isAddHomeOpen: false,
  isAddCategoryOpen: false,
  isAddBillOpen: false,
  isInviteUserOpen: false,
  globalLoading: false,
  globalError: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setAddHomeOpen(state, action: PayloadAction<boolean>) {
      state.isAddHomeOpen = action.payload;
    },
    setAddCategoryOpen(state, action: PayloadAction<boolean>) {
      state.isAddCategoryOpen = action.payload;
    },
    setAddBillOpen(state, action: PayloadAction<boolean>) {
      state.isAddBillOpen = action.payload;
    },
    setInviteUserOpen(state, action: PayloadAction<boolean>) {
      state.isInviteUserOpen = action.payload;
    },
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
    setGlobalError(state, action: PayloadAction<string | null>) {
      state.globalError = action.payload;
    },
  },
});

export const {
  setAddHomeOpen,
  setAddCategoryOpen,
  setAddBillOpen,
  setInviteUserOpen,
  setGlobalLoading,
  setGlobalError,
} = uiSlice.actions;

export default uiSlice.reducer;
