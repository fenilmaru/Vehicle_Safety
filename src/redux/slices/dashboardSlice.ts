import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { dashboardApi } from "@/api/endpoints";
import type { VehicleFrame } from "@/lib/simulation";
import type { DashboardPayload } from "@/utils/types";

type DashboardState = {
  data: DashboardPayload | null;
  frame: VehicleFrame | null;
  connection: "connecting" | "live" | "offline";
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  lastSync: string | null;
};

const initialState: DashboardState = {
  data: null,
  frame: null,
  connection: "connecting",
  status: "idle",
  error: null,
  lastSync: null,
};

export const fetchDashboard = createAsyncThunk("dashboard/fetch", async () => dashboardApi.overview());

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setFrame(state, action: PayloadAction<VehicleFrame>) {
      state.frame = action.payload;
      state.lastSync = new Date().toISOString();
    },
    setConnection(state, action: PayloadAction<DashboardState["connection"]>) {
      state.connection = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = state.data ? "ready" : "loading";
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.data = action.payload;
        state.frame = action.payload.frame ?? state.frame;
        state.status = "ready";
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Dashboard sync failed";
      });
  },
});

export const { setFrame, setConnection } = dashboardSlice.actions;
export default dashboardSlice.reducer;
