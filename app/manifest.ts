import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Ether — health self-assessment",
    short_name: "The Ether",
    description: "Learns each person's normal, catches silent drift, and says what to do and who should act. Works offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#050a18",
    theme_color: "#050a18",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
