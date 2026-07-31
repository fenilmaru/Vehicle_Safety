import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { vehicleApi } from "@/api/endpoints";
import type { VehicleWithDriver } from "@/utils/types";

type VehicleState = {
  items: VehicleWithDriver[];
  selectedId: number | null;
  query: string;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

const initialState: VehicleState = { items: [], selectedId: null, query: "", status: "idle", error: null };

export const fetchVehicles = createAsyncThunk("vehicles/fetch", async (params: { q?: string; status?: string } | undefined) =>
  vehicleApi.list(params),
);

const vehicleSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    selectVehicle(state, action: PayloadAction<number | null>) {
      state.selectedId = action.payload;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    patchVehicleLive(state, action: PayloadAction<{ id: number; speed?: number; lat?: number; lng?: number }>) {
      const vehicle = state.items.find((v) => v.id === action.payload.id);
      if (!vehicle) return;
      if (action.payload.speed !== undefined) vehicle.currentSpeed = action.payload.speed;
      if (action.payload.lat !== undefined) vehicle.lat = action.payload.lat;
      if (action.payload.lng !== undefined) vehicle.lng = action.payload.lng;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "ready";
        if (!state.selectedId && action.payload.length) state.selectedId = action.payload[0].id;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Unable to load fleet";
      });
  },
});

export const { selectVehicle, setQuery, patchVehicleLive } = vehicleSlice.actions;
export default vehicleSlice.reducer;
