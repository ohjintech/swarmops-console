import { createContext, useContext } from "react";

/** Runtime config, fetched from /config.json so one build runs against any backend. */
export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  mapStyle: string;
  initialView: { latitude: number; longitude: number; zoom: number };
  staleAfterMs: number;
}

export async function loadConfig(): Promise<AppConfig> {
  const res = await fetch("/config.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`config.json: HTTP ${res.status}`);
  return (await res.json()) as AppConfig;
}

export const ConfigContext = createContext<AppConfig | null>(null);

export function useConfig(): AppConfig {
  const cfg = useContext(ConfigContext);
  if (!cfg) throw new Error("ConfigContext missing");
  return cfg;
}
