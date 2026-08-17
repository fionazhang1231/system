'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout } from '@arco-design/web-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';

const Sider = Layout.Sider;
const HeaderLayout = Layout.Header;
const Content = Layout.Content;

/** 主布局：侧边栏 + 顶栏 + 内容区 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoggedIn && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoggedIn, pathname, router]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        collapsed={collapsed}
        collapsible
        trigger={null}
        breakpoint="xl"
        width={220}
        collapsedWidth={64}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
          zIndex: 10,
          overflow: 'auto',
        }}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>
      <Layout>
        <HeaderLayout style={{ padding: 0, height: 56 }}>
          <Header collapsed={collapsed} onCollapseChange={setCollapsed} />
        </HeaderLayout>
        <Content style={{ overflow: 'auto', background: '#F7F8FA' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
