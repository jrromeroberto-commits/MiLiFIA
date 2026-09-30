import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeOS · Tu segundo cerebro",
    short_name: "LifeOS",
    description:
      "Un espacio personal para capturar y convertir pensamientos en acciones.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#f6f7fb",
    lang: "es",
    categories: ["productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
