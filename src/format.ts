import { timestampMs } from "@bufbuild/protobuf/wkt";
import { FlightState, type Telemetry } from "@swarmops/contracts/drone/v1";

export type RGB = [number, number, number];

export const STATE_COLORS: Record<FlightState, RGB> = {
  [FlightState.UNSPECIFIED]: [120, 120, 120],
  [FlightState.LANDED]: [110, 130, 160],
  [FlightState.TAKING_OFF]: [56, 189, 248],
  [FlightState.HOLDING]: [52, 211, 153],
  [FlightState.EN_ROUTE]: [96, 165, 250],
  [FlightState.RETURNING]: [251, 191, 36],
  [FlightState.LANDING]: [167, 139, 250],
  [FlightState.FAULT]: [248, 113, 113],
};

export const STALE_COLOR: RGB = [80, 80, 80];

export function stateLabel(s: FlightState): string {
  return (FlightState[s] ?? "UNKNOWN").replace(/_/g, " ").toLowerCase();
}

export function isStale(t: Telemetry, now: number, staleAfterMs: number): boolean {
  return !t.ts || now - timestampMs(t.ts) > staleAfterMs;
}

export function droneColor(t: Telemetry, now: number, staleAfterMs: number): RGB {
  return isStale(t, now, staleAfterMs) ? STALE_COLOR : STATE_COLORS[t.state];
}

export function rgb([r, g, b]: RGB): string {
  return `rgb(${r} ${g} ${b})`;
}
