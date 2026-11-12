import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { AckStatus, Severity } from "@swarmops/contracts/drone/v1";
import { ClientFrameSchema, ServerFrameSchema, type Viewport } from "@swarmops/contracts/realtime/v1";

import { useFleet } from "../store/fleet";

/**
 * Binary protobuf WebSocket to the telemetry gateway. Reconnects with backoff and
 * re-sends the current viewport on every (re)connect.
 */
export class FleetSocket {
  private ws: WebSocket | null = null;
  private viewport: Viewport | null = null;
  private retryMs = 1000;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private closed = false;

  constructor(private readonly url: string) {}

  connect(): void {
    this.closed = false;
    const fleet = useFleet.getState();
    fleet.setLink("connecting");
    const ws = new WebSocket(this.url);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onopen = () => {
      this.retryMs = 1000;
      useFleet.getState().setLink("open");
      if (this.viewport) this.sendViewport(this.viewport);
    };
    ws.onmessage = (ev) => this.onFrame(new Uint8Array(ev.data as ArrayBuffer));
    ws.onclose = () => {
      if (this.ws !== ws) return; // superseded by a newer connection
      useFleet.getState().setLink("closed");
      if (this.closed) return;
      this.timer = setTimeout(() => this.connect(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 2, 15_000);
    };
  }

  close(): void {
    this.closed = true;
    clearTimeout(this.timer);
    this.ws?.close();
  }

  setViewport(vp: Viewport): void {
    this.viewport = vp;
    this.sendViewport(vp);
  }

  private sendViewport(vp: Viewport): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const frame = create(ClientFrameSchema, { frame: { case: "viewport", value: vp } });
    this.ws.send(toBinary(ClientFrameSchema, frame));
  }

  private onFrame(bytes: Uint8Array): void {
    const f = fromBinary(ServerFrameSchema, bytes);
    const fleet = useFleet.getState();
    switch (f.frame.case) {
      case "snapshot":
        fleet.applySnapshot(f.frame.value);
        break;
      case "ack": {
        const a = f.frame.value;
        const status = AckStatus[a.status]?.toLowerCase() ?? "unknown";
        fleet.pushLog({
          level: a.status === AckStatus.REJECTED || a.status === AckStatus.FAILED ? "warn" : "info",
          droneId: a.droneId,
          text: `${a.commandId} ${status}${a.reason ? `: ${a.reason}` : ""}`,
        });
        break;
      }
      case "event": {
        const e = f.frame.value;
        fleet.pushLog({
          level: e.severity === Severity.CRITICAL ? "error" : e.severity === Severity.WARNING ? "warn" : "info",
          droneId: e.droneId,
          text: `${e.code}: ${e.message}`,
        });
        break;
      }
    }
  }
}
