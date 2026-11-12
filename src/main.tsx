import { TransportProvider } from "@connectrpc/connect-query";
import { createConnectTransport } from "@connectrpc/connect-web";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { ConfigContext, loadConfig } from "./config";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);

loadConfig()
  .then((cfg) => {
    const transport = createConnectTransport({ baseUrl: cfg.apiUrl });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
    root.render(
      <StrictMode>
        <ConfigContext.Provider value={cfg}>
          <TransportProvider transport={transport}>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </TransportProvider>
        </ConfigContext.Provider>
      </StrictMode>,
    );
  })
  .catch((err: unknown) => {
    root.render(<pre className="fatal">Failed to load config.json: {String(err)}</pre>);
  });
