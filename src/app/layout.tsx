import type { Metadata } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bodyFont = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const displayFont = Bricolage_Grotesque({ subsets: ["latin", "vietnamese"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Ôn thi GPLX Việt Nam",
  description: "Học lý thuyết, luyện câu sai và thi thử giấy phép lái xe hạng B.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
