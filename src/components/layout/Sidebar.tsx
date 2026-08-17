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

/** 侧边栏导航组件 - 深蓝色主题 */
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
        background: '#001529',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: '#1677FF',
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
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
          }}>
            连心社群管理
          </span>
        )}
      </div>

      {/* 导航菜单 */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Menu
          theme="dark"
          selectedKeys={[getSelectedKey()]}
          defaultOpenKeys={getOpenKeys()}
          style={{ width: '100%', border: 'none', backgroundColor: 'transparent' }}
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

      {/* 底部版权 */}
      {!collapsed && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          连心社群管理平台 v1.0
        </div>
      )}
    </div>
  );
}
