import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import NowPlayingBar from "@/components/layout/NowPlayingBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Linkify — LinkedIn Post & Engagement Tracker",
  description: "Track your team's LinkedIn engagement with Linkify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 pb-14">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        <NowPlayingBar
          recentActivity={[
            "Sarah Chen posted about AI trends",
            "Mike Johnson mentioned @CompanyName in a new article",
            "Emily Davis hit a 12-week posting streak!",
            "Alex Rivera's post reached 500+ likes",
            "Team engagement up 23% this week",
          ]}
          stats={[
            { label: "Posts today", value: "8" },
            { label: "Active streaks", value: "24" },
          ]}
        />
      </body>
    </html>
  );
}
