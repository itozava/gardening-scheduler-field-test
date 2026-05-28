import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["garden-icon-192.png", "garden-icon-512.png"],
      manifest: {
        name: "Gardening Scheduler",
        short_name: "Gardening",
        description: "Gardening job scheduler and field work tracker",
        theme_color: "#047857",
        background_color: "#ecfdf5",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/garden-icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/garden-icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});