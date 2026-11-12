import type { Telemetry } from "@swarmops/contracts/drone/v1";
import type { FleetSnapshot } from "@swarmops/contracts/realtime/v1";
import { create } from "zustand";

const TRAIL_POINTS = 40;
const LOG_ENTRIES = 200;

export type LinkStatus = "connecting" | "open" | "closed";

export interface LogEntry {
  id: number;
  at: number;
  level: "info" | "warn" | "error";
  droneId?: string;
  text: string;
}

interface FleetState {
  /** Drones inside the current viewport, from the latest WS snapshot. */
  drones: Record<string, Telemetry>;
  trails: Record<string, [number, number][]>;
  totalDrones: number;
  link: LinkStatus;
  selectedId: string | null;
  gotoMode: boolean;
  log: LogEntry[];

  applySnapshot(s: FleetSnapshot): void;
  setLink(s: LinkStatus): void;
  select(id: string | null): void;
  setGotoMode(on: boolean): void;
  pushLog(e: Omit<LogEntry, "id" | "at">): void;
}

let logSeq = 0;

export const useFleet = create<FleetState>((set) => ({
  drones: {},
  trails: {},
  totalDrones: 0,
  link: "connecting",
  selectedId: null,
  gotoMode: false,
  log: [],

  applySnapshot: (s) =>
    set((prev) => {
      const drones: Record<string, Telemetry> = {};
      const trails: Record<string, [number, number][]> = {};
      for (const t of s.drones) {
        drones[t.droneId] = t;
        const p = t.position;
        const trail = prev.trails[t.droneId] ?? [];
        if (p) {
          const last = trail[trail.length - 1];
          const moved = !last || last[0] !== p.lon || last[1] !== p.lat;
          trails[t.droneId] = moved ? [...trail, [p.lon, p.lat] as [number, number]].slice(-TRAIL_POINTS) : trail;
        }
      }
      return { drones, trails, totalDrones: s.totalDrones };
    }),

  setLink: (link) => set({ link }),
  select: (selectedId) => set({ selectedId, gotoMode: false }),
  setGotoMode: (gotoMode) => set({ gotoMode }),
  pushLog: (e) =>
    set((prev) => ({ log: [{ ...e, id: ++logSeq, at: Date.now() }, ...prev.log].slice(0, LOG_ENTRIES) })),
}));
