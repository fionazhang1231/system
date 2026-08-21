'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Descriptions, Table, Tag, Button, Space, Modal, Message, Spin, Grid,
} from '@arco-design/web-react';
import { IconExport, IconCheckCircle } from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPut } from '@/lib/api';
import { statusColorMap } from '@/lib/activity-status';

const { Row, Col } = Grid;

interface ActivityDetailData {
  id: number;
  title: string;
  type: string;
  category?: string;
  visibility?: string;
  fee?: number;
  cover_image?: string | null;
  start_time: string;
  end_time: string;
  location: string;
  description?: string | null;
  status: string;
  max_participants?: number | null;
  need_audit: boolean;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    checkedIn: number;
  };
  registrations: Array<{
    id: number;
    user: { id: number; name: string; phone: string };
    register_time: string;
    audit_status: string;
    check_in_time?: string | null;
    check_in_method?: string | null;
    channel?: string | null;
  }>;
}

/** 活动详情页 */
export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityDetailData | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await apiGet<ActivityDetailData>(`/activities/${params.id}`);
      if (res.success && res.data) setActivity(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [params.id]);

  // 审核操作
  const handleAudit = (registrationId: number, auditStatus: string) => {
    apiPut(`/activities/${params.id}/registrations`, {
      registration_id: registrationId,
      audit_status: auditStatus,
    }).then((res) => {
      if (res.success) {
        Message.success('操作成功');
        fetchDetail();
      } else {
        Message.error(res.error || '操作失败');
      }
    });
  };

  // 导出报名列表
  const handleExport = () => {
    window.open(`/api/activities/${params.id}/export`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size={40} />
      </div>
    );
  }

  if (!activity) {
    return (
      <div style={{ padding: 24 }}>
        <p>活动不存在</p>
        <Button onClick={() => router.push('/activities')}>返回列表</Button>
      </div>
    );
  }

  const formatTime = (isoStr: string) => {
    try { return new Date(isoStr).toLocaleString('zh-CN'); } catch { return '-'; }
  };

  const regColumns: ColumnProps<ActivityDetailData['registrations'][0]>[] = [
    { title: '姓名', dataIndex: 'user_name', width: 120, render: (_, record) => record.user?.name || '-' },
    { title: '手机号', dataIndex: 'user_phone', width: 140, render: (_, record) => record.user?.phone || '-' },
    {
      title: '报名时间', dataIndex: 'register_time', width: 180,
      render: (_, record) => formatTime(record.register_time),
    },
    {
      title: '审核状态', dataIndex: 'audit_status', width: 100,
      render: (_, record) => {
        const colorMap: Record<string, string> = { '待审核': 'orange', '已通过': 'green', '已拒绝': 'red' };
        return <Tag color={colorMap[record.audit_status] || 'gray'}>{record.audit_status}</Tag>;
      },
    },
    {
      title: '签到状态', dataIndex: 'check_in_time', width: 100,
      render: (_, record) => record.check_in_time ? (
        <Tag color="green">已签到</Tag>
      ) : (
        <Tag color="gray">未签到</Tag>
      ),
    },
    {
      title: '操作', dataIndex: 'operations', width: 160, fixed: 'right',
      render: (_, record) => {
        if (record.audit_status === '待审核') {
          return (
            <Space>
              <Button type="text" size="small" onClick={() => handleAudit(record.id, '已通过')}>通过</Button>
              <Button type="text" size="small" status="danger" onClick={() => handleAudit(record.id, '已拒绝')}>拒绝</Button>
            </Space>
          );
        }
        return <span style={{ color: '#86909C' }}>-</span>;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav
        items={[
          { title: '活动管理' },
          { title: '活动列表', href: '/activities' },
          { title: '活动详情' },
        ]}
      />

      {/* 活动信息 */}
      <Card title={activity.title} style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Tag color={statusColorMap[activity.status] || 'gray'}>{activity.status}</Tag>
          <Tag>{activity.type}</Tag>
          {activity.category && <Tag color="cyan">{activity.category}</Tag>}
          <Tag color={activity.visibility === 'public' ? 'blue' : 'purple'}>
            {activity.visibility === 'public' ? '公开活动' : '会员专属'}
          </Tag>
        </div>
        <Descriptions
          column={3}
          data={[
            { label: '开始时间', value: formatTime(activity.start_time) },
            { label: '结束时间', value: formatTime(activity.end_time) },
            { label: '活动地点', value: activity.location },
            { label: '人数上限', value: activity.max_participants ? `${activity.max_participants} 人` : '不限' },
            { label: '需要审核', value: activity.need_audit ? '是' : '否' },
            { label: '费用', value: activity.fee && activity.fee > 0 ? `HKD ${activity.fee}` : '免费' },
          ]}
        />
        {activity.description && (
          <div style={{ marginTop: 16, padding: 16, background: '#F7F8FA', borderRadius: 6 }}>
            <strong>活动描述：</strong>
            <p style={{ margin: '8px 0 0', color: '#4E5969', lineHeight: 1.6 }}>{activity.description}</p>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Space>
            <Button type="primary" onClick={() => router.push(`/activities/${activity.id}/edit`)}>编辑活动</Button>
            <Button onClick={() => router.push(`/activities/${activity.id}/checkin`)}>
              <IconCheckCircle style={{ marginRight: 4 }} />签到管理
            </Button>
          </Space>
        </div>
      </Card>

      {/* 报名统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: '已报名', value: activity.stats.total, color: '#0E7C7B' },
          { label: '待审核', value: activity.stats.pending, color: '#FAAD14' },
          { label: '已通过', value: activity.stats.approved, color: '#52C41A' },
          { label: '已拒绝', value: activity.stats.rejected, color: '#F5222D' },
          { label: '已签到', value: activity.stats.checkedIn, color: '#165DFF' },
        ].map((stat) => (
          <Col key={stat.label} span={4} style={{ minWidth: 140 }}>
            <Card style={{ borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#86909C', fontSize: 13, marginTop: 4 }}>{stat.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 报名列表 */}
      <Card title="报名列表" style={{ borderRadius: 8 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button icon={<IconExport />} onClick={handleExport}>导出报名列表</Button>
        </div>
        <Table
          rowKey="id"
          columns={regColumns}
          data={activity.registrations}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          noDataElement={<div className="empty-state"><p>暂无报名记录</p></div>}
        />
      </Card>
    </div>
  );
}
