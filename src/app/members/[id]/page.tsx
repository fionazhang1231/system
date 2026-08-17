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
  phone_region?: string;
  email?: string | null;
  gender?: number | null;
  birthday?: string | null;
  address?: string | null;
  avatar?: string | null;
  identity_status?: string;
  memberExt?: {
    member_no?: string;
    member_type?: string;
    member_level?: string;
    memberType?: { name: string; type_key?: string };
    memberLevel?: { name: string; level_key?: string; growth_threshold?: number };
    join_date?: string;
    expire_date?: string;
    membership_status?: string;
    growth_value?: number;
    rfm_layer?: string;
    rfm_score?: number;
    remark?: string;
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
    const newStatus = member.memberExt.membership_status === 'active' ? 'revoked' : 'active';
    const actionLabel = newStatus === 'revoked' ? '撤销' : '恢复';
    Modal.confirm({
      title: `确认${actionLabel}`,
      content: `确定要${actionLabel}该会员吗？`,
      onOk: async () => {
        const res = await apiPut(`/members/${member.id}`, {
          membership_status: newStatus,
        });
        if (res.success) {
          Message.success(`${actionLabel}成功`);
          setMember({
            ...member,
            memberExt: { ...member.memberExt!, membership_status: newStatus },
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

  const genderMap: Record<number, string> = { 0: '未知', 1: '男', 2: '女' };
  const identityMap: Record<string, string> = {
    visitor: '游客', registered: '注册用户', member: '会员', volunteer: '志愿者', both: '会员+志愿者',
  };
  const rfmMap: Record<string, { label: string; color: string }> = {
    high_value: { label: '高价值', color: 'red' },
    potential: { label: '潜力', color: 'blue' },
    stable: { label: '稳定', color: 'green' },
    sleeping: { label: '沉睡', color: 'orange' },
    new: { label: '新会员', color: 'cyan' },
  };
  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: '有效', color: 'green' },
    expired: { label: '已过期', color: 'orange' },
    revoked: { label: '已撤销', color: 'red' },
  };
  const mStatus = statusMap[member.memberExt?.membership_status || 'active'];
  const mRfm = rfmMap[member.memberExt?.rfm_layer || 'new'];

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
                { label: '会员编号', value: (
                  <span style={{ fontFamily: 'monospace', color: '#0E7C7B', fontWeight: 500 }}>
                    {member.memberExt?.member_no || '-'}
                  </span>
                )},
                { label: '姓名', value: member.name },
                { label: '手机号', value: `${member.phone_region || ''} ${member.phone}` },
                { label: '邮箱', value: member.email || '-' },
                { label: '性别', value: genderMap[member.gender ?? 0] || '未知' },
                { label: '生日', value: member.birthday || '-' },
                { label: '地址', value: member.address || '-' },
                { label: '身份状态', value: identityMap[member.identity_status || 'visitor'] },
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
            { label: '会员等级', value: (
              <Tag color="gold">{member.memberExt?.memberLevel?.name || '-'}</Tag>
            )},
            { label: '会员状态', value: (
              <Tag color={mStatus.color}>{mStatus.label}</Tag>
            )},
            { label: '成长值', value: (
              <span style={{ fontWeight: 600, color: '#0E7C7B' }}>
                {member.memberExt?.growth_value ?? 0}
              </span>
            )},
            { label: 'RFM分层', value: (
              <Tag color={mRfm.color}>{mRfm.label}</Tag>
            )},
            { label: 'RFM评分', value: (
              <span style={{ fontWeight: 500 }}>
                {member.memberExt?.rfm_score?.toFixed(1) ?? '0.0'} / 5.0
              </span>
            )},
            { label: '入会日期', value: member.memberExt?.join_date || '-' },
            { label: '到期日期', value: member.memberExt?.expire_date || '-' },
            { label: '备注', value: member.memberExt?.remark || '-' },
          ]}
        />
        <div style={{ marginTop: 16 }}>
          <Space>
            <Button type="primary" onClick={() => router.push(`/members/${member.id}/edit`)}>
              编辑信息
            </Button>
            <Button onClick={handleToggleStatus}>
              {member.memberExt?.membership_status === 'active' ? '撤销会员' : '恢复会员'}
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
