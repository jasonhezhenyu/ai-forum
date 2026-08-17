import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ToastContainer } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOE品质中台 AI Agent 论坛",
  description: "品质中台 AI Agent 技术交流论坛，分享想法、实践经验，赋能品质中台提质增效",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f6f8] text-[#1a1a2e]">
        <Header />
        <main className="flex-1">{children}</main>
        <ToastContainer />
        <footer className="border-t border-gray-200 bg-white py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-400">
            BOE品质中台 AI Agent 论坛 · 赋能品质中台提质增效
          </div>
        </footer>
      </body>
    </html>
  );
}
