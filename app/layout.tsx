import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imperial Parfum — Fragrâncias Exclusivas",
  description:
    "Imperial Parfum: perfumes árabes importados selecionados. Elegância, presença e longa fixação.",
  icons: { icon: "/logotipo.jpeg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
