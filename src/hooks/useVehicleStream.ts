"use client";

import { useEffect, useRef, useState } from "react";
import { VehicleChannel, type ChannelMessage } from "@/api/websocket";
import type { VehicleFrame } from "@/lib/simulation";
import { setConnection, setFrame } from "@/redux/slices/dashboardSlice";
import { raiseEmergency } from "@/redux/slices/notificationSlice";
import { patchVehicleLive } from "@/redux/slices/vehicleSlice";
import { useAppDispatch } from "@/redux/store";

type StreamState = {
  frame: VehicleFrame | null;
  events: ChannelMessage[];
  connected: boolean;
};

/**
 * Subscribes to the vehicle realtime channel (Django Channels compatible).
 * Feeds Redux so every widget in the app re-renders without a page refresh.
 */
export function useVehicleStream(vehicleId: number | null | undefined, { syncStore = true } = {}) {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<StreamState>({ frame: null, events: [], connected: false });
  const bufferRef = useRef<ChannelMessage[]>([]);

  useEffect(() => {
    if (!vehicleId) return;
    const channel = new VehicleChannel(vehicleId);
    if (syncStore) dispatch(setConnection("connecting"));

    const unsubscribe = channel.subscribe((message) => {
      if (message.event === "frame") {
        const frame = message.data as unknown as VehicleFrame;
        setState((prev) => ({ ...prev, frame, connected: true }));
        if (syncStore) {
          dispatch(setFrame(frame));
          dispatch(setConnection("live"));
          dispatch(patchVehicleLive({ id: vehicleId, speed: frame.speed, lat: frame.lat, lng: frame.lng }));
        }
        return;
      }

      if (message.event === "connected") {
        setState((prev) => ({ ...prev, connected: true }));
        if (syncStore) dispatch(setConnection("live"));
      }

      if (message.event === "emergency_alert" && syncStore) {
        dispatch(
          raiseEmergency({
            vehicleId,
            message: String((message.data as { message?: string }).message ?? "Critical event detected"),
            severity: "critical",
          }),
        );
      }

      bufferRef.current = [message, ...bufferRef.current].slice(0, 40);
      setState((prev) => ({ ...prev, events: bufferRef.current }));
    });

    channel.connect();
    return () => {
      unsubscribe();
      channel.close();
      if (syncStore) dispatch(setConnection("offline"));
    };
  }, [vehicleId, dispatch, syncStore]);

  return state;
}
