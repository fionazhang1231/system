'use client';

import { Breadcrumb } from '@arco-design/web-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

/** 面包屑导航 */
export default function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  const router = useRouter();

  return (
    <Breadcrumb style={{ marginBottom: 16 }}>
      {items.map((item, index) => (
        <Breadcrumb.Item
          key={index}
          onClick={item.href ? () => router.push(item.href!) : undefined}
          style={item.href ? { cursor: 'pointer' } : undefined}
        >
          {item.title}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
}

/** 页面容器 */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="page-container">
      {children}
    </div>
  );
}
