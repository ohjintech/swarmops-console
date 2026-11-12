import { useEffect, useState } from "react";

import { useSendCommand } from "../api/commands";
import { useConfig } from "../config";
import { isStale, stateLabel } from "../format";
import { useFleet } from "../store/fleet";

export function DronePanel() {
  const cfg = useConfig();
  const selectedId = useFleet((s) => s.selectedId);
  const t = useFleet((s) => (s.selectedId ? s.drones[s.selectedId] : undefined));
  const gotoMode = useFleet((s) => s.gotoMode);
  const setGotoMode = useFleet((s) => s.setGotoMode);
  const select = useFleet((s) => s.select);
  const send = useSendCommand();
  const [alt, setAlt] = useState(30);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setGotoMode(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setGotoMode]);

  if (!selectedId) return null;
  if (!t) {
    return (
      <aside className="drone-panel">
        <header>
          <h2>{selectedId}</h2>
          <button className="ghost" onClick={() => select(null)}>×</button>
        </header>
        <p className="muted">Out of view. Pan the map to it.</p>
      </aside>
    );
  }

  const stale = isStale(t, Date.now(), cfg.staleAfterMs);
  const p = t.position;

  return (
    <aside className="drone-panel">
      <header>
        <h2>{t.droneId}</h2>
        <span className={`badge ${stale ? "badge--bad" : ""}`}>{stale ? "link lost" : stateLabel(t.state)}</span>
        <button className="ghost" onClick={() => select(null)} aria-label="Close">×</button>
      </header>

      <dl className="stats">
        <dt>Battery</dt>
        <dd className={t.batteryPct < 25 ? "warn" : ""}>{t.batteryPct.toFixed(1)}%</dd>
        <dt>Altitude</dt>
        <dd>{p?.altM.toFixed(1)} m</dd>
        <dt>Speed</dt>
        <dd>{t.groundSpeedMps.toFixed(1)} m/s</dd>
        <dt>Heading</dt>
        <dd>{t.headingDeg.toFixed(0)}°</dd>
        <dt>Position</dt>
        <dd className="mono">
          {p?.lat.toFixed(6)}, {p?.lon.toFixed(6)}
        </dd>
        <dt>Link</dt>
        <dd>{(t.linkQuality * 100).toFixed(0)}%</dd>
        <dt>Command</dt>
        <dd className="mono">{t.activeCommandId || "–"}</dd>
      </dl>

      <div className="actions">
        <label className="alt">
          Alt
          <input type="number" min={2} max={120} value={alt} onChange={(e) => setAlt(Number(e.target.value))} /> m
        </label>
        <button onClick={() => send(t.droneId, { case: "takeoff", value: { altM: alt } })}>Take off</button>
        <button className={gotoMode ? "active" : ""} onClick={() => setGotoMode(!gotoMode)}>
          Go to…
        </button>
        <button onClick={() => send(t.droneId, { case: "hold", value: {} })}>Hold</button>
        <button onClick={() => send(t.droneId, { case: "returnToLaunch", value: {} })}>Return</button>
        <button className="danger" onClick={() => send(t.droneId, { case: "land", value: {} })}>
          Land
        </button>
      </div>
    </aside>
  );
}
