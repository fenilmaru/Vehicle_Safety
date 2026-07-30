"use client";

import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer from "@/redux/slices/authSlice";
import vehicleReducer from "@/redux/slices/vehicleSlice";
import dashboardReducer from "@/redux/slices/dashboardSlice";
import notificationReducer from "@/redux/slices/notificationSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      vehicles: vehicleReducer,
      dashboard: dashboardReducer,
      notifications: notificationReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
