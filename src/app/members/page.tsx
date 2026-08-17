'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, Button, Input, Select, Space, Tag, Modal, Message, Avatar,
} from '@arco-design/web-react';
import { IconSearch, IconPlus, IconDelete, IconExport } from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiDelete } from '@/lib/api';
import type { MemberListItem } from '@/types';

/** 会员列表页 */
export default function MembersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MemberListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 获取会员列表
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<MemberListItem[]>('/members', {
        page,
        pageSize,
        keyword: keyword || undefined,
        membershipStatus: selectedStatus || undefined,
      });
      if (res.success && res.data) {
        setData(res.data as MemberListItem[]);
        setTotal(res.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, selectedStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 删除会员
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该会员吗？此操作不可恢复。',
      okText: '确定',
      okButtonProps: { status: 'danger' },
      cancelText: '取消',
      onOk: async () => {
        const res = await apiDelete(`/members/${id}`);
        if (res.success) {
          Message.success('删除成功');
          fetchData();
        } else {
          Message.error(res.error || '删除失败');
        }
      },
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请先选择要删除的会员');
      return;
    }
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个会员吗？`,
      okText: '确定',
      okButtonProps: { status: 'danger' },
      cancelText: '取消',
      onOk: async () => {
        const results = await Promise.all(
          selectedRowKeys.map((key) => apiDelete(`/members/${key}`))
        );
        const successCount = results.filter((r) => r.success).length;
        Message.success(`成功删除 ${successCount} 个会员`);
        setSelectedRowKeys([]);
        fetchData();
      },
    });
  };

  // 导出Excel（CSV）
  const handleExport = () => {
    Message.info('导出功能开发中...');
  };

  // 表格列定义（对齐需求文档）
  const columns: ColumnProps<MemberListItem>[] = [
    {
      title: '会员编号',
      dataIndex: 'member_no',
      width: 100,
      render: (_, record) => (
        <span style={{ fontFamily: 'monospace', color: '#0E7C7B', fontWeight: 500 }}>
          {record.member_no || '-'}
        </span>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 160,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={32} style={{ background: '#0E7C7B', flexShrink: 0 }}>
            {record.name?.charAt(0) || '?'}
          </Avatar>
          <span style={{ fontWeight: 500 }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
    },
    {
      title: '会员类型',
      dataIndex: 'memberType',
      width: 100,
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          '普通会员': 'blue',
          '高级会员': 'orangered',
          'VIP会员': 'gold',
          '学生会员': 'cyan',
          '志愿者': 'green',
        };
        return (
          <Tag color={colorMap[record.memberType?.name] || 'gray'}>
            {record.memberType?.name || '-'}
          </Tag>
        );
      },
    },
    {
      title: '会员等级',
      dataIndex: 'memberLevel',
      width: 90,
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          'VIP1': 'gray',
          'VIP2': 'blue',
          'VIP3': 'green',
          'VIP4': 'gold',
          'VIP5': 'red',
        };
        return (
          <Tag color={colorMap[record.memberLevel?.name] || 'gray'}>
            {record.memberLevel?.name || '-'}
          </Tag>
        );
      },
    },
    {
      title: '成长值',
      dataIndex: 'growth_value',
      width: 90,
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: '#0E7C7B' }}>
          {record.growth_value ?? 0}
        </span>
      ),
    },
    {
      title: 'RFM分层',
      dataIndex: 'rfm_layer',
      width: 100,
      render: (_, record) => {
        const rfmMap: Record<string, { label: string; color: string }> = {
          'high_value': { label: '高价值', color: 'red' },
          'potential': { label: '潜力', color: 'blue' },
          'stable': { label: '稳定', color: 'green' },
          'sleeping': { label: '沉睡', color: 'orange' },
          'new': { label: '新会员', color: 'cyan' },
        };
        const rfm = rfmMap[record.rfm_layer || 'new'];
        return <Tag color={rfm.color}>{rfm.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'membership_status',
      width: 90,
      render: (_, record) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          'active': { label: '有效', color: 'green' },
          'expired': { label: '已过期', color: 'orange' },
          'revoked': { label: '已撤销', color: 'red' },
        };
        const s = statusMap[record.membership_status || 'active'];
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 110,
      render: (_, record) => {
        try {
          return new Date(record.created_at).toLocaleDateString('zh-CN');
        } catch {
          return '-';
        }
      },
    },
    {
      title: '操作',
      dataIndex: 'operations',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <button
            className="action-btn"
            onClick={() => router.push(`/members/${record.id}`)}
          >
            详情
          </button>
          <button
            className="action-btn"
            onClick={() => router.push(`/members/${record.id}/edit`)}
          >
            编辑
          </button>
          <button
            className="action-btn danger"
            onClick={() => handleDelete(record.id)}
          >
            删除
          </button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav items={[{ title: '会员管理' }, { title: '会员列表' }]} />

      <div className="site-card">
        {/* 搜索和操作栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input
              prefix={<IconSearch />}
              placeholder="搜索姓名/手机号"
              value={keyword}
              onChange={setKeyword}
              onPressEnter={() => { setPage(1); fetchData(); }}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="会员状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 140 }}
              allowClear
              options={[
                { value: 'active', label: '有效' },
                { value: 'expired', label: '已过期' },
                { value: 'revoked', label: '已撤销' },
              ]}
            />
            <Button type="primary" icon={<IconSearch />} onClick={() => { setPage(1); fetchData(); }}>
              搜索
            </Button>
          </Space>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button status="danger" icon={<IconDelete />} onClick={handleBatchDelete}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
            <Button icon={<IconExport />} onClick={handleExport}>导出</Button>
            <Button type="primary" icon={<IconPlus />} onClick={() => router.push('/members/create')}>
              新增会员
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          rowKey="id"
          columns={columns}
          data={data}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: true,
            sizeCanChange: true,
            pageSizeChangeResetCurrent: true,
            onChange: (p: number, ps: number) => { setPage(p); setPageSize(ps); },
          }}
          rowSelection={{
            type: 'checkbox' as const,
            selectedRowKeys,
            onChange: (keys: (string | number)[]) => setSelectedRowKeys(keys.map(String)),
          }}
          noDataElement={
            <div className="empty-state">
              <p>暂无会员数据</p>
              <Button type="primary" onClick={() => router.push('/members/create')}>
                新增会员
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
