import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lãnh Đạo Khai Tâm | Giảng viên",
  description: "Prototype dashboard theo dõi chương trình dành cho giảng viên SEN Pharma",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
