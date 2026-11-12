import { WebMercatorViewport, type MapViewState, type PickingInfo } from "@deck.gl/core";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { create } from "@bufbuild/protobuf";
import type { Telemetry } from "@swarmops/contracts/drone/v1";
import { ViewportSchema } from "@swarmops/contracts/realtime/v1";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Map } from "react-map-gl/maplibre";

import { useSendCommand } from "../api/commands";
import { useConfig } from "../config";
import { droneColor, stateLabel } from "../format";
import type { FleetSocket } from "../realtime/socket";
import { useFleet } from "../store/fleet";

interface Props {
  socket: FleetSocket;
}

export function FleetMap({ socket }: Props) {
  const cfg = useConfig();
  const drones = useFleet((s) => s.drones);
  const trails = useFleet((s) => s.trails);
  const selectedId = useFleet((s) => s.selectedId);
  const gotoMode = useFleet((s) => s.gotoMode);
  const select = useFleet((s) => s.select);
  const setGotoMode = useFleet((s) => s.setGotoMode);
  const send = useSendCommand();

  const [viewState, setViewState] = useState<MapViewState>({ ...cfg.initialView, pitch: 0, bearing: 0 });
  const now = Date.now();
  const list = useMemo(() => Object.values(drones), [drones]);

  // Tell the gateway what we're looking at (debounced, padded by 25%).
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!size.width || !size.height) return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const [minLon, minLat, maxLon, maxLat] = new WebMercatorViewport({ ...viewState, ...size }).getBounds();
      const padLat = (maxLat - minLat) * 0.25;
      const padLon = (maxLon - minLon) * 0.25;
      socket.setViewport(
        create(ViewportSchema, {
          minLat: minLat - padLat,
          maxLat: maxLat + padLat,
          minLon: minLon - padLon,
          maxLon: maxLon + padLon,
        }),
      );
    }, 200);
  }, [viewState, size, socket]);

  const layers = [
    new PathLayer<{ id: string; path: [number, number][] }>({
      id: "trails",
      data: Object.entries(trails).map(([id, path]) => ({ id, path })),
      getPath: (d) => d.path,
      getColor: (d) => (d.id === selectedId ? [255, 255, 255, 200] : [148, 163, 184, 90]),
      getWidth: 2,
      widthUnits: "pixels",
    }),
    new ScatterplotLayer<Telemetry>({
      id: "drones",
      data: list,
      pickable: true,
      getPosition: (t) => [t.position?.lon ?? 0, t.position?.lat ?? 0],
      getFillColor: (t) => droneColor(t, now, cfg.staleAfterMs),
      getLineColor: (t) => (t.droneId === selectedId ? [255, 255, 255] : [15, 23, 42]),
      getLineWidth: (t) => (t.droneId === selectedId ? 3 : 1),
      lineWidthUnits: "pixels",
      stroked: true,
      getRadius: 7,
      radiusUnits: "pixels",
      updateTriggers: { getFillColor: now, getLineColor: selectedId, getLineWidth: selectedId },
    }),
  ];

  const onClick = (info: PickingInfo<Telemetry>) => {
    if (gotoMode && selectedId && info.coordinate) {
      const [lon, lat] = info.coordinate;
      const alt = drones[selectedId]?.position?.altM || 30;
      send(selectedId, { case: "goTo", value: { target: { lat, lon, altM: alt } } });
      setGotoMode(false);
      return;
    }
    select(info.object?.droneId ?? null);
  };

  return (
    <div className={`map ${gotoMode ? "map--goto" : ""}`}>
      <DeckGL
        viewState={viewState}
        controller
        layers={layers}
        onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
        onResize={setSize}
        onClick={onClick}
        getCursor={({ isHovering }) => (gotoMode ? "crosshair" : isHovering ? "pointer" : "grab")}
        getTooltip={({ object }: PickingInfo<Telemetry>) =>
          object ? `${object.droneId} · ${stateLabel(object.state)} · ${object.batteryPct.toFixed(0)}%` : null
        }
      >
        <Map mapStyle={cfg.mapStyle} />
      </DeckGL>
      {gotoMode && <div className="map__hint">Click the map to send {selectedId} there · Esc to cancel</div>}
    </div>
  );
}
