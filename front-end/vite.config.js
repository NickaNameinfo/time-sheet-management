import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // By default, Vite only binds to localhost.
    // To make it accessible from other devices, use '0.0.0.0'.
    host: ["192.168.0.10", "localhost:5173"],
    // You can set the port to 5173 or any other desired port.
    port: 5173,
  },
});
