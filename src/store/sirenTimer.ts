// src/store/sirenTimer.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Timer = { expiresAt: number; durationSec: number };
type TimerMap = Record<string, Timer>;

type SirenTimerState = {
  timers: TimerMap;
  setTimer: (deviceId: string, expiresAt: number, durationSec: number) => void;
  clearTimer: (deviceId: string) => void;
  getTimer: (deviceId: string) => Timer | null;
};

export const useSirenTimerStore = create<SirenTimerState>()(
  persist(
    (set, get) => ({
      timers: {},
      setTimer: (deviceId, expiresAt, durationSec) =>
        set((s) => ({
          timers: { ...s.timers, [deviceId]: { expiresAt, durationSec } },
        })),
      clearTimer: (deviceId) =>
        set((s) => {
          const { [deviceId]: _unused, ...rest } = s.timers;
          return { timers: rest };
        }),
      getTimer: (deviceId) => get().timers[deviceId] ?? null,
    }),
    {
      name: "siren-timers-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Limpia timers vencidos al rehidratar
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const cleaned: TimerMap = {};
        for (const [k, v] of Object.entries(state.timers)) {
          if (v.expiresAt > now) cleaned[k] = v;
        }
        state.timers = cleaned;
      },
    }
  )
);
