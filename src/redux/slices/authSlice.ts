import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "@/api/endpoints";
import type { SettingsRow, UserProfile } from "@/utils/types";

type AuthState = {
  user: UserProfile | null;
  settings: SettingsRow | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  error: string | null;
  biometric: { face: boolean; fingerprint: boolean };
};

const initialState: AuthState = {
  user: null,
  settings: null,
  status: "idle",
  error: null,
  biometric: { face: false, fingerprint: false },
};

export const fetchSession = createAsyncThunk("auth/session", async () => authApi.me());

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (payload: { identifier: string; password: string }, { rejectWithValue }) => {
    try {
      return await authApi.login(payload.identifier, payload.password);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Login failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "anonymous";
    },
    setSettings(state, action: PayloadAction<SettingsRow | null>) {
      state.settings = action.payload;
    },
    markBiometric(state, action: PayloadAction<{ mode: "face" | "fingerprint"; verified: boolean }>) {
      state.biometric[action.payload.mode] = action.payload.verified;
    },
    signOut(state) {
      state.user = null;
      state.settings = null;
      state.status = "anonymous";
      state.biometric = { face: false, fingerprint: false };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.settings = action.payload.settings;
        state.status = "authenticated";
      })
      .addCase(fetchSession.rejected, (state) => {
        state.user = null;
        state.status = "anonymous";
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.error = String(action.payload ?? "Login failed");
        state.status = "anonymous";
      });
  },
});

export const { setUser, setSettings, markBiometric, signOut } = authSlice.actions;
export default authSlice.reducer;
