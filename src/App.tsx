import { useEffect, useMemo } from "react";

import { DronePanel } from "./components/DronePanel";
import { EventLog } from "./components/EventLog";
import { FleetList } from "./components/FleetList";
import { FleetMap } from "./components/FleetMap";
import { useConfig } from "./config";
import { FleetSocket } from "./realtime/socket";
import { useFleet } from "./store/fleet";

export function App() {
  const cfg = useConfig();
  const socket = useMemo(() => new FleetSocket(cfg.wsUrl), [cfg.wsUrl]);
  const link = useFleet((s) => s.link);
  const inView = useFleet((s) => Object.keys(s.drones).length);
  const total = useFleet((s) => s.totalDrones);

  useEffect(() => {
    socket.connect();
    return () => socket.close();
  }, [socket]);

  return (
    <div className="app">
      <header className="topbar">
        <h1>SwarmOps</h1>
        <span className={`link link--${link}`}>telemetry {link}</span>
        <span className="muted">
          {inView} in view / {total} drones
        </span>
      </header>
      <aside className="sidebar">
        <section className="panel panel--grow">
          <h3>Fleet</h3>
          <FleetList />
        </section>
        <section className="panel panel--log">
          <h3>Events</h3>
          <EventLog />
        </section>
      </aside>
      <main className="stage">
        <FleetMap socket={socket} />
        <DronePanel />
      </main>
    </div>
  );
}
