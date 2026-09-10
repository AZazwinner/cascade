import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const mono = Manrope({
  variable: "--font-app-mono",
  subsets: ["latin"],
});

const description =
  "Tiered, cost-aware query router: decompose a query into sub-tasks and route each through the cheapest tier that can answer it. Bring your own Ollama endpoint and API key -- nothing is ever stored on our servers.";

export const metadata: Metadata = {
  metadataBase: new URL("https://casx.vercel.app"),
  title: "Cascadex Router",
  description,
  openGraph: {
    title: "Cascadex Router",
    description,
    type: "website",
    siteName: "Cascadex Router",
  },
  twitter: {
    card: "summary",
    title: "Cascadex Router",
    description,
  },
  verification: {
    google: "rYjzs-6J2BlMYz3QkO3YXw6hW_TVR9g406fAvKM8tK0",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
