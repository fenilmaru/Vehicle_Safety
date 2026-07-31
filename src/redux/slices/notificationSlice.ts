import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { notificationApi } from "@/api/endpoints";
import type { NotificationRow } from "@/utils/types";

type EmergencyBanner = {
  active: boolean;
  vehicleId: number | null;
  message: string;
  severity: string;
  at: string | null;
};

type NotificationState = {
  items: NotificationRow[];
  unread: number;
  emergency: EmergencyBanner;
  status: "idle" | "loading" | "ready";
};

const initialState: NotificationState = {
  items: [],
  unread: 0,
  emergency: { active: false, vehicleId: null, message: "", severity: "normal", at: null },
  status: "idle",
};

export const fetchNotifications = createAsyncThunk("notifications/fetch", async () => notificationApi.list());

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    pushLiveAlert(state, action: PayloadAction<NotificationRow>) {
      state.items = [action.payload, ...state.items].slice(0, 60);
      state.unread += 1;
    },
    raiseEmergency(state, action: PayloadAction<{ vehicleId: number; message: string; severity: string }>) {
      state.emergency = {
        active: true,
        vehicleId: action.payload.vehicleId,
        message: action.payload.message,
        severity: action.payload.severity,
        at: new Date().toISOString(),
      };
    },
    dismissEmergency(state) {
      state.emergency = { active: false, vehicleId: null, message: "", severity: "normal", at: null };
    },
    markAllRead(state) {
      state.items = state.items.map((item) => ({ ...item, isRead: true }));
      state.unread = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.notifications;
        state.unread = action.payload.unread;
        state.status = "ready";
      });
  },
});

export const { pushLiveAlert, raiseEmergency, dismissEmergency, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
