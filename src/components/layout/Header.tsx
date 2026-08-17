'use client';

import { useRouter } from 'next/navigation';
import { Button, Select, Modal, Message } from '@arco-design/web-react';
import { IconMenuFold, IconMenuUnfold, IconPoweroff } from '@arco-design/web-react/icon';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

/** 顶部导航栏 */
export default function Header({ collapsed, onCollapseChange }: HeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        logout();
        Message.success('已退出登录');
        router.push('/login');
      },
    });
  };

  return (
    <div
      style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #E5E6EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {/* 左侧：折叠按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
          onClick={() => onCollapseChange(!collapsed)}
          style={{ fontSize: 18, color: '#4E5969' }}
        />
      </div>

      {/* 右侧：机构切换 + 用户信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* 机构切换器（占位） */}
        <Select
          value={1}
          style={{ width: 200 }}
          disabled
          options={[{ value: 1, label: '连心社区服务中心' }]}
        />

        {/* 退出按钮 */}
        <Button
          type="text"
          icon={<IconPoweroff />}
          onClick={handleLogout}
          style={{ color: '#86909C' }}
        >
          退出
        </Button>
      </div>
    </div>
  );
}
