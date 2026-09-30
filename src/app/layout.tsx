import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "LifeOS",
  title: {
    default: "LifeOS · Tu segundo cerebro",
    template: "%s · LifeOS",
  },
  description:
    "Un espacio personal para capturar, organizar y convertir tus pensamientos en acciones.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeOS",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f7fb",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
        <PwaRegistration />
      </body>
    </html>
  );
}
