import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel - MP Estilista",
  manifest: "/manifest-panel.webmanifest",
};

export default function PanelTurnosLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white text-gray-900 antialiased">{children}</div>;
}
