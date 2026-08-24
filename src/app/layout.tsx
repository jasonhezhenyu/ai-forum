import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { ToastContainer } from "@/components/Toast";

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
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f5f6f8] text-[#1a1a2e]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif' }}>
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
