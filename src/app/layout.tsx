import type { Metadata, Viewport } from "next";
import { Saira, Saira_Condensed } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const ironBody = Saira({ subsets: ["latin"], variable: "--font-iron-body" });
const ironDisplay = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-iron-display",
});

export const metadata: Metadata = {
  title: "Health",
  description:
    "Daily calorie and protein tracking against your own recipes, and lifting against a December deadline.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1c1c1a" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${ironBody.variable} ${ironDisplay.variable}`}>
      <head>
        {/* Apply the stored theme before paint so there's no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nc-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
