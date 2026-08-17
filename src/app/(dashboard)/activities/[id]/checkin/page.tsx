'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Table, Button, Tag, Message, Space, Modal, Card, Spin,
} from '@arco-design/web-react';
import { IconCheckCircle, IconQrcode } from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost } from '@/lib/api';

interface RegistrationItem {
  id: number;
  user: { id: number; name: string; phone: string };
  register_time: string;
  audit_status: string;
  check_in_time?: string | null;
  check_in_method?: string | null;
  channel?: string | null;
}

/** 签到管理页 */
export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await apiGet<RegistrationItem[]>(`/activities/${params.id}/registrations`);
      if (res.success && res.data) setRegistrations(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRegistrations(); }, [params.id]);

  // 手动签到
  const handleManualCheckin = () => {
    const unchecked = selectedKeys.map(Number).filter((id) => {
      const reg = registrations.find((r) => r.id === id);
      return reg && !reg.check_in_time && reg.audit_status === '已通过';
    });

    if (unchecked.length === 0) {
      Message.warning('请选择已通过审核且未签到的报名者');
      return;
    }

    Modal.confirm({
      title: '确认签到',
      content: `确定要为 ${unchecked.length} 人进行手动签到吗？`,
      onOk: async () => {
        setSubmitting(true);
        try {
          const res = await apiPost(`/activities/${params.id}/checkin`, {
            registration_ids: unchecked,
            method: '手动',
          });
          if (res.success) {
            Message.success(`成功签到 ${unchecked.length} 人`);
            setSelectedKeys([]);
            fetchRegistrations();
          } else {
            Message.error(res.error || '签到失败');
          }
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // 扫码签到（Mock）
  const handleScanCheckin = () => {
    Modal.info({
      title: '扫码签到',
      content: '扫码功能Demo中为模拟操作。在实际场景中，参与者扫描活动二维码即可完成签到。',
    });
  };

  const formatTime = (isoStr: string) => {
    try { return new Date(isoStr).toLocaleString('zh-CN'); } catch { return '-'; }
  };

  const columns: ColumnProps<RegistrationItem>[] = [
    { title: '姓名', dataIndex: 'user_name', width: 120, render: (_, record) => record.user?.name || '-' },
    { title: '手机号', dataIndex: 'user_phone', width: 140, render: (_, record) => record.user?.phone || '-' },
    {
      title: '签到时间', dataIndex: 'check_in_time', width: 180,
      render: (_, record) => record.check_in_time ? formatTime(record.check_in_time) : '-',
    },
    {
      title: '签到方式', dataIndex: 'check_in_method', width: 100,
      render: (_, record) => record.check_in_method || '-',
    },
    {
      title: '审核状态', dataIndex: 'audit_status', width: 100,
      render: (_, record) => {
        const colorMap: Record<string, string> = { '待审核': 'orange', '已通过': 'green', '已拒绝': 'red' };
        return <Tag color={colorMap[record.audit_status] || 'gray'}>{record.audit_status}</Tag>;
      },
    },
    {
      title: '报名渠道', dataIndex: 'channel', width: 100,
      render: (_, record) => {
        const channelMap: Record<string, string> = { web: '网页', wechat: '微信', app: 'App', h5: 'H5' };
        return record.channel ? (channelMap[record.channel] || record.channel) : '-';
      },
    },
    {
      title: '签到状态', dataIndex: 'status', width: 100,
      render: (_, record) => record.check_in_time ? (
        <Tag color="green">已签到</Tag>
      ) : (
        <Tag color="gray">未签到</Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size={40} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav
        items={[
          { title: '活动管理' },
          { title: '活动列表', href: '/activities' },
          { title: '活动详情', href: `/activities/${params.id}` },
          { title: '签到管理' },
        ]}
      />

      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>签到管理</h3>
          <Space>
            <Button
              type="primary"
              icon={<IconCheckCircle />}
              onClick={handleManualCheckin}
              loading={submitting}
              disabled={selectedKeys.length === 0}
            >
              手动签到 {selectedKeys.length > 0 ? `(${selectedKeys.length})` : ''}
            </Button>
            <Button icon={<IconQrcode />} onClick={handleScanCheckin}>
              扫码签到
            </Button>
            <Button onClick={() => router.push(`/activities/${params.id}`)}>
              返回活动详情
            </Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          data={registrations}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 740 }}
          rowSelection={{
            type: 'checkbox' as const,
            selectedRowKeys: selectedKeys,
            onChange: (keys: (string | number)[]) => setSelectedKeys(keys.map(String)),
          }}
          noDataElement={<div className="empty-state"><p>暂无报名记录</p></div>}
        />
      </Card>
    </div>
  );
}
