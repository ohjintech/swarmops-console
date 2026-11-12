import { create } from "@bufbuild/protobuf";
import { timestampFromMs } from "@bufbuild/protobuf/wkt";
import { FlightState, TelemetrySchema } from "@swarmops/contracts/drone/v1";
import { describe, expect, it } from "vitest";

import { STALE_COLOR, STATE_COLORS, droneColor, isStale, stateLabel } from "./format";

describe("format", () => {
  const now = 1_000_000;
  const fresh = create(TelemetrySchema, { droneId: "d", state: FlightState.HOLDING, ts: timestampFromMs(now - 500) });
  const old = create(TelemetrySchema, { droneId: "d", state: FlightState.HOLDING, ts: timestampFromMs(now - 5000) });

  it("detects stale telemetry", () => {
    expect(isStale(fresh, now, 3000)).toBe(false);
    expect(isStale(old, now, 3000)).toBe(true);
  });

  it("colors by state, grey when stale", () => {
    expect(droneColor(fresh, now, 3000)).toEqual(STATE_COLORS[FlightState.HOLDING]);
    expect(droneColor(old, now, 3000)).toEqual(STALE_COLOR);
  });

  it("labels states", () => {
    expect(stateLabel(FlightState.EN_ROUTE)).toBe("en route");
  });
});
