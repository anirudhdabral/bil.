import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  isAddHomeOpen: boolean;
  isAddCategoryOpen: boolean;
  isAddBillOpen: boolean;
  globalLoading: boolean;
  globalError: string | null;
};

const initialState: UiState = {
  isAddHomeOpen: false,
  isAddCategoryOpen: false,
  isAddBillOpen: false,
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
  setGlobalLoading,
  setGlobalError,
} = uiSlice.actions;

export default uiSlice.reducer;
