import { combineReducers, configureStore } from "@reduxjs/toolkit";

import selectedHomeReducer from "./slices/selectedHomeSlice";
import uiReducer from "./slices/uiSlice";

const rootReducer = combineReducers({
  ui: uiReducer,
  selectedHome: selectedHomeReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
