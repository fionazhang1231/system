'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Menu } from '@arco-design/web-react';
import {
  IconUserGroup,
  IconCalendar,
  IconApps,
  IconStar,
} from '@arco-design/web-react/icon';

const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

/** 侧边栏导航组件 */
export default function Sidebar({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 根据路径确定选中项和展开的子菜单
  const getSelectedKey = () => {
    if (pathname.startsWith('/members/types')) return 'member-types';
    if (pathname.startsWith('/members/levels')) return 'member-levels';
    if (pathname.startsWith('/members')) return 'members';
    if (pathname.startsWith('/activities')) return 'activities';
    return 'members';
  };

  const getOpenKeys = () => {
    if (pathname.startsWith('/members')) return ['member-mgmt'];
    if (pathname.startsWith('/activities')) return ['activity-mgmt'];
    return ['member-mgmt'];
  };

  return (
    <div
      style={{
        height: '100%',
        background: '#fff',
        borderRight: '1px solid #E5E6EB',
        overflow: 'hidden',
      }}
    >
      {/* Logo 区域 */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid #E5E6EB',
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: '#0E7C7B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: 16,
          flexShrink: 0,
        }}>
          连
        </div>
        {!collapsed && (
          <span style={{
            marginLeft: 10,
            fontSize: 16,
            fontWeight: 600,
            color: '#1D2129',
            whiteSpace: 'nowrap',
          }}>
            连心社群管理
          </span>
        )}
      </div>

      {/* 导航菜单 */}
      <Menu
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        style={{ width: '100%', border: 'none' }}
        onClickMenuItem={(key: string) => {
          const routeMap: Record<string, string> = {
            'members': '/members',
            'member-types': '/members/types',
            'member-levels': '/members/levels',
            'activities': '/activities',
          };
          if (routeMap[key]) router.push(routeMap[key]);
        }}
      >
        <SubMenu
          key="member-mgmt"
          title={
            <>
              <IconUserGroup />
              {!collapsed && '会员管理'}
            </>
          }
        >
          <MenuItem key="members">
            <IconApps style={{ marginRight: 6 }} />
            会员列表
          </MenuItem>
          <MenuItem key="member-types">
            <IconApps style={{ marginRight: 6 }} />
            会员类型
          </MenuItem>
          <MenuItem key="member-levels">
            <IconStar style={{ marginRight: 6 }} />
            会员等级
          </MenuItem>
        </SubMenu>
        <SubMenu
          key="activity-mgmt"
          title={
            <>
              <IconCalendar />
              {!collapsed && '活动管理'}
            </>
          }
        >
          <MenuItem key="activities">
            <IconCalendar style={{ marginRight: 6 }} />
            活动列表
          </MenuItem>
        </SubMenu>
      </Menu>
    </div>
  );
}
