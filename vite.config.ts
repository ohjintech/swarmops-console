import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["@bufbuild/protobuf", "react", "react-dom"],
  },
  server: { port: 5173, strictPort: true },
});
