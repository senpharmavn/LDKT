import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lãnh Đạo Khai Tâm",
    short_name: "Khai Tâm",
    description: "Learning journey platform cho học viên Lãnh Đạo Khai Tâm.",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#16826d",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
