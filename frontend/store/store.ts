import { configureStore } from "@reduxjs/toolkit";
import sensorReducer from "./slices/sensorSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      sensors: sensorReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
