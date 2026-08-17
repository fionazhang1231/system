import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '连心社群管理平台',
  description: '港澳社团数字化管理SaaS平台 - 会员管理与活动管理',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
