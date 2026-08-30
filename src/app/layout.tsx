import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/AppShell/AppShell";
import {
  createThemeBootstrapScript,
  defaultAppTheme,
} from "@/features/theme/themes";
import { ReduxProvider } from "@/lib/redux/ReduxProvider";
import "../lib/styles/globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fret Journey",
  description:
    "Explore the guitar fretboard, practice focused technique routines, and inspect reviewed progressions with complete dynamically generated chord diagrams.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-theme={defaultAppTheme} lang="en" suppressHydrationWarning>
      <head>
        <script id="fret-journey-theme-bootstrap">
          {createThemeBootstrapScript()}
        </script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ReduxProvider>
          <AppShell>{children}</AppShell>
        </ReduxProvider>
      </body>
    </html>
  );
}
