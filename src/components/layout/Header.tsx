'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button, Select, Modal, Message, Dropdown, Avatar, Badge } from '@arco-design/web-react';
import {
  IconMenuFold,
  IconMenuUnfold,
  IconPoweroff,
  IconNotification,
  IconUser,
  IconDown,
} from '@arco-design/web-react/icon';
import { useAuth } from '@/hooks/useAuth';
import { Breadcrumb } from '@arco-design/web-react';

const BreadcrumbItem = Breadcrumb.Item;

interface HeaderProps {
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

/** 路由与面包屑名称映射 */
const breadcrumbMap: Record<string, string[]> = {
  '/members': ['会员管理', '会员列表'],
  '/members/types': ['会员管理', '会员类型'],
  '/members/levels': ['会员管理', '会员等级'],
  '/members/create': ['会员管理', '新增会员'],
  '/activities': ['活动管理', '活动列表'],
  '/activities/create': ['活动管理', '创建活动'],
};

/** 顶部导航栏 */
export default function Header({ collapsed, onCollapseChange }: HeaderProps) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 获取当前面包屑
  const getBreadcrumbs = (): string[] => {
    // 精确匹配
    if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
    // 动态路由匹配
    if (pathname.match(/^\/members\/\d+$/)) return ['会员管理', '会员列表', '会员详情'];
    if (pathname.match(/^\/members\/\d+\/edit$/)) return ['会员管理', '会员列表', '编辑会员'];
    if (pathname.match(/^\/activities\/\d+$/)) return ['活动管理', '活动列表', '活动详情'];
    if (pathname.match(/^\/activities\/\d+\/edit$/)) return ['活动管理', '活动列表', '编辑活动'];
    if (pathname.match(/^\/activities\/\d+\/checkin$/)) return ['活动管理', '活动列表', '签到管理'];
    return ['会员管理', '会员列表'];
  };

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

  const crumbs = getBreadcrumbs();

  return (
    <div
      style={{
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E6EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* 左侧：折叠按钮 + 面包屑 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
          onClick={() => onCollapseChange(!collapsed)}
          style={{ fontSize: 18, color: '#4E5969' }}
        />
        <Breadcrumb>
          {crumbs.map((crumb, idx) => (
            <BreadcrumbItem key={idx}>{crumb}</BreadcrumbItem>
          ))}
        </Breadcrumb>
      </div>

      {/* 右侧：机构切换 + 通知 + 用户头像 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* 机构切换器（占位） */}
        <Select
          value={1}
          style={{ width: 180 }}
          disabled
          options={[{ value: 1, label: '连心社区服务中心' }]}
        />

        {/* 通知图标 */}
        <Badge count={3} dot offset={[2, -2]}>
          <Button
            type="text"
            icon={<IconNotification style={{ fontSize: 18 }} />}
            style={{ color: '#4E5969' }}
          />
        </Badge>

        {/* 用户头像下拉 */}
        <Dropdown
          droplist={
            <div style={{ padding: '4px 0', minWidth: 140 }}>
              <div
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid #F2F3F5',
                  marginBottom: 4,
                }}
              >
                <div style={{ fontWeight: 600, color: '#1D2129' }}>{user?.name || '管理员'}</div>
                <div style={{ fontSize: 12, color: '#86909C', marginTop: 2 }}>{user?.phone || ''}</div>
              </div>
              <div
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  color: '#F53F3F',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onClick={handleLogout}
              >
                <IconPoweroff />
                退出登录
              </div>
            </div>
          }
          trigger="click"
          position="br"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            <Avatar size={28} style={{ backgroundColor: '#1677FF' }}>
              <IconUser />
            </Avatar>
            <span style={{ color: '#1D2129', fontSize: 14 }}>{user?.name || '管理员'}</span>
            <IconDown style={{ fontSize: 12, color: '#86909C' }} />
          </div>
        </Dropdown>
      </div>
    </div>
  );
}
