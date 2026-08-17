'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Descriptions, Table, Tag, Button, Space, Modal, Message, Avatar, Spin,
} from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPut } from '@/lib/api';

interface MemberDetailData {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  birthday?: string | null;
  address?: string | null;
  avatar?: string | null;
  memberExt?: {
    memberType: { name: string };
    memberLevel: { name: string };
    join_date: string;
    expire_date: string;
    status: string;
  };
  activities: Array<{
    id: number;
    title: string;
    start_time: string;
    status: string;
    audit_status: string;
    check_in_time?: string | null;
  }>;
}

/** 会员详情页 */
export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberDetailData | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiGet<MemberDetailData>(`/members/${params.id}`);
        if (res.success && res.data) {
          setMember(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id]);

  // 冻结/解冻
  const handleToggleStatus = () => {
    if (!member?.memberExt) return;
    const newStatus = member.memberExt.status === '正常' ? '冻结' : '正常';
    Modal.confirm({
      title: `确认${newStatus === '冻结' ? '冻结' : '解冻'}`,
      content: `确定要${newStatus === '冻结' ? '冻结' : '解冻'}该会员吗？`,
      onOk: async () => {
        const res = await apiPut(`/members/${member.id}`, {
          status: newStatus,
        });
        if (res.success) {
          Message.success(`${newStatus === '冻结' ? '冻结' : '解冻'}成功`);
          setMember({
            ...member,
            memberExt: { ...member.memberExt!, status: newStatus },
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size={40} />
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ padding: 24 }}>
        <p>会员不存在</p>
        <Button onClick={() => router.push('/members')}>返回列表</Button>
      </div>
    );
  }

  const activityColumns: ColumnProps<MemberDetailData['activities'][0]>[] = [
    { title: '活动名称', dataIndex: 'title' },
    {
      title: '活动时间', dataIndex: 'start_time',
      render: (_, record) => {
        try { return new Date(record.start_time).toLocaleString('zh-CN'); } catch { return '-'; }
      },
    },
    {
      title: '活动状态', dataIndex: 'status',
      render: (_, record) => {
        const colorMap: Record<string, string> = { '报名中': 'green', '进行中': 'blue', '已结束': 'gray', '草稿': 'orange' };
        return <Tag color={colorMap[record.status] || 'gray'}>{record.status}</Tag>;
      },
    },
    {
      title: '审核状态', dataIndex: 'audit_status',
      render: (_, record) => <Tag>{record.audit_status}</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav
        items={[
          { title: '会员管理' },
          { title: '会员列表', href: '/members' },
          { title: '会员详情' },
        ]}
      />

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <Avatar size={80} style={{ background: '#0E7C7B', fontSize: 32, flexShrink: 0 }}>
            {member.name?.charAt(0) || '?'}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Descriptions
              column={3}
              data={[
                { label: '姓名', value: member.name },
                { label: '手机号', value: member.phone },
                { label: '邮箱', value: member.email || '-' },
                { label: '性别', value: member.gender || '-' },
                { label: '生日', value: member.birthday || '-' },
                { label: '地址', value: member.address || '-' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* 会员信息 */}
      <Card title="会员信息" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Descriptions
          column={3}
          data={[
            { label: '会员类型', value: <Tag color="blue">{member.memberExt?.memberType?.name || '-'}</Tag> },
            { label: '会员等级', value: member.memberExt?.memberLevel?.name || '-' },
            { label: '状态', value: (
              <span className={`status-tag ${member.memberExt?.status === '正常' ? 'normal' : 'frozen'}`}>
                {member.memberExt?.status || '-'}
              </span>
            )},
            { label: '入会日期', value: member.memberExt?.join_date || '-' },
            { label: '到期日期', value: member.memberExt?.expire_date || '-' },
          ]}
        />
        <div style={{ marginTop: 16 }}>
          <Space>
            <Button type="primary" onClick={() => router.push(`/members/${member.id}/edit`)}>
              编辑信息
            </Button>
            <Button onClick={handleToggleStatus}>
              {member.memberExt?.status === '正常' ? '冻结会员' : '解冻会员'}
            </Button>
          </Space>
        </div>
      </Card>

      {/* 活动参与记录 */}
      <Card title="活动参与记录" style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          columns={activityColumns}
          data={member.activities || []}
          pagination={false}
          noDataElement={<div className="empty-state"><p>暂无活动参与记录</p></div>}
        />
      </Card>
    </div>
  );
}
