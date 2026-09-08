import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

const useHttps =
  process.env.HTTPS === "1" ||
  process.env.HTTPS === "true";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    ...(useHttps ? [basicSsl()] : []),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,

      manifest: {
        id: "/",

        // APP NAME
        name: "ARC",

        // SHORT APP NAME
        short_name: "ARC",

        description:
          "ARC - Academic Readiness & Review for Competence",

        theme_color: "#ffffff",
        background_color: "#ffffff",

        display: "standalone",

        scope: "/",
        start_url: "/",

        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],

        navigateFallback: "index.html",

        runtimeCaching: [],

        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: true,
        disableRuntimeConfig: true,
        suppressWarnings: true,
      },
    }),
  ],

  server: {
    host: "0.0.0.0",
  },
});
