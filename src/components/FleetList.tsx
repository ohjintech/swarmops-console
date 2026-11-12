import { useQuery } from "@connectrpc/connect-query";
import { FleetService } from "@swarmops/contracts/control/v1";

import { STALE_COLOR, STATE_COLORS, rgb, stateLabel } from "../format";
import { useFleet } from "../store/fleet";

/** Full fleet from the control API (not viewport-limited like the map). */
export function FleetList() {
  const { data, error, isPending } = useQuery(FleetService.method.listDrones, {}, { refetchInterval: 2000 });
  const selectedId = useFleet((s) => s.selectedId);
  const select = useFleet((s) => s.select);

  if (isPending) return <div className="panel__empty">Loading fleet…</div>;
  if (error) return <div className="panel__empty panel__empty--error">Control API unreachable: {error.rawMessage}</div>;
  if (!data.drones.length) return <div className="panel__empty">No drones reporting yet.</div>;

  return (
    <table className="fleet">
      <thead>
        <tr>
          <th>Drone</th>
          <th>State</th>
          <th className="num">Batt</th>
          <th className="num">Alt</th>
        </tr>
      </thead>
      <tbody>
        {data.drones.map(({ latest, stale }) => {
          if (!latest) return null;
          const color = stale ? STALE_COLOR : STATE_COLORS[latest.state];
          return (
            <tr
              key={latest.droneId}
              className={latest.droneId === selectedId ? "selected" : undefined}
              onClick={() => select(latest.droneId)}
            >
              <td>
                <span className="dot" style={{ background: rgb(color) }} />
                {latest.droneId}
              </td>
              <td>{stale ? "link lost" : stateLabel(latest.state)}</td>
              <td className={`num ${latest.batteryPct < 25 ? "warn" : ""}`}>{latest.batteryPct.toFixed(0)}%</td>
              <td className="num">{latest.position?.altM.toFixed(0) ?? "–"} m</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
