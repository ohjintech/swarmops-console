# swarmops-console

The SwarmOps operator dashboard: a static React SPA, deployed separately from the backend.

- **Live map:** MapLibre with OpenFreeMap tiles (free, no API key), plus deck.gl layers for drones and trails. It renders thousands of moving drones on the GPU.
- **Realtime:** a binary protobuf WebSocket to `telemetry /ws`. The console sends its map viewport, and the gateway sends back only the drones inside it, about 4 times a second.
- **Fleet list and commands:** Connect-RPC to `control-api` through `@connectrpc/connect-query` (TanStack Query). Every command carries an idempotency key.
- **State:** Zustand for high-frequency telemetry, TanStack Query for request/response data.
- **Types:** everything comes from `@swarmops/contracts`. There are no hand-written API types.

## Develop

```bash
# one-time: build the sibling contracts package that this repo installs from ../swarmops-contracts
(cd ../swarmops-contracts/gen/ts && npm install && npm run build)

npm install
npm run dev          # http://localhost:5173
npm test
npm run build
```

Start the backend with `task up` in `swarmops-backend`. It runs the API on `:8080`, the WebSocket gateway on `:8081` and 10 simulated drones.

When the contracts change, run `npm run contracts:refresh`.

## Runtime config

The app reads `/config.json` at startup, so one build works against any environment.

```json
{
  "apiUrl": "http://localhost:8080",
  "wsUrl": "ws://localhost:8081/ws",
  "mapStyle": "https://tiles.openfreemap.org/styles/dark",
  "initialView": { "latitude": 37.8045, "longitude": -122.4645, "zoom": 16 },
  "staleAfterMs": 3000
}
```

In production, replace `dist/config.json` at deploy time, e.g. `apiUrl: https://api.example.com` and `wsUrl: wss://api.example.com/ws`.

## Deploy (Cloudflare Pages, free)

- **Build command:** `npm run build`. **Output directory:** `dist`.
- CI writes the production `config.json` from the `API_URL` / `WS_URL` repo variables.
- Every PR gets a preview URL.
- The backend's `ALLOWED_ORIGINS` must include the Pages domain.

## Using it

1. Click a drone on the map or in the list.
2. Use **Take off** / **Hold** / **Return** / **Land**, or **Go to…** and then click the map.
3. Acks (`accepted → completed`, `rejected: battery below 30%`, …) and drone events (`FAILSAFE_RTL`) appear in the Events panel.
4. Drones with no telemetry for 3 s turn grey and show "link lost".

## Roadmap

- Mock mode (MSW plus a fake telemetry source) for working on the UI without the backend
- Survey mission planner: draw a polygon, preview the per-drone routes from the planner, then launch
- Geofence editor, alert inbox, mission replay scrubber
