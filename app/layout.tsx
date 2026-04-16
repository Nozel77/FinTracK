import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FinTracK | Finance Dashboard",
    template: "%s | FinTracK",
  },
  description:
    "Modern finance dashboard for tracking balances, transactions, goals, and spending insights.",
  applicationName: "FinTracK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setInitialThemeScript = `(function(){try{var key="dashboard.theme";var stored=localStorage.getItem(key);var theme=(stored==="dark"||stored==="light")?stored:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(_e){}})();`;

  return (
    <html
      lang="id"
      className={`${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="initial-theme" strategy="beforeInteractive">
          {setInitialThemeScript}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
