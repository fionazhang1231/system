'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, Button, Input, Select, Space, Tag, Modal, Message, Tooltip,
} from '@arco-design/web-react';
import {
  IconSearch, IconPlus, IconDelete, IconEdit, IconEye, IconRefresh,
} from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiDelete } from '@/lib/api';
import dayjs from 'dayjs';

/** 活动列表项 */
interface ActivityItem {
  id: number;
  title: string;
  type: string;
  category: string;
  visibility: string;
  fee: number | null;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  max_participants: number | null;
  need_audit: boolean;
  created_at: string;
  _count?: { registrations: number };
}

/** 状态标签颜色映射 */
const statusColorMap: Record<string, string> = {
  '草稿': 'orange',
  '报名中': 'green',
  '进行中': 'blue',
  '已结束': 'gray',
};

/** 活动分类映射 */
const categoryMap: Record<string, string> = {
  '文娱': '文娱',
  '体育': '体育',
  '培训': '培训',
  '公益': '公益',
  '会议': '会议',
  'other': '其他',
};

/** 开放度映射 */
const visibilityMap: Record<string, { text: string; color: string }> = {
  member: { text: '会员专属', color: 'arcoblue' },
  public: { text: '公开', color: 'green' },
};

/** 活动列表页（表格式） */
export default function ActivitiesPage() {
  const router = useRouter();
  const [data, setData] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchData = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('pageSize', String(ps));
      if (keyword) params.set('keyword', keyword);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await apiGet<ActivityItem[]>(`/activities?${params.toString()}`);
      if (res.success && res.data) {
        setData(res.data);
        setTotal(res.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, categoryFilter]);

  useEffect(() => { fetchData(page, pageSize); }, [page, pageSize, fetchData]);

  const handleSearch = () => { setPage(1); fetchData(1, pageSize); };
  const handleReset = () => {
    setKeyword(''); setStatusFilter(''); setCategoryFilter('');
    setPage(1); fetchData(1, pageSize);
  };

  const handleDelete = (record: ActivityItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除活动「${record.title}」吗？`,
      okText: '删除',
      okButtonProps: { status: 'danger' },
      cancelText: '取消',
      onOk: async () => {
        const res = await apiDelete(`/activities/${record.id}`);
        if (res.success) {
          Message.success('删除成功');
          fetchData(page, pageSize);
        } else {
          Message.error(res.error || '删除失败');
        }
      },
    });
  };

  const columns: ColumnProps<ActivityItem>[] = [
    {
      title: '活动名称', dataIndex: 'title', width: 200,
      render: (v: string) => (
        <span style={{ fontWeight: 500 }}>{v}</span>
      ),
    },
    {
      title: '分类', dataIndex: 'category', width: 90, align: 'center',
      render: (v: string) => (
        <Tag>{categoryMap[v] || v || '-'}</Tag>
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v: string) => (
        <Tag color={statusColorMap[v] || 'gray'}>{v}</Tag>
      ),
    },
    {
      title: '时间范围', dataIndex: 'start_time', width: 200,
      render: (_: unknown, record: ActivityItem) => (
        <span style={{ fontSize: 13 }}>
          {dayjs(record.start_time).format('MM/DD HH:mm')}
          {' ~ '}
          {dayjs(record.end_time).format('MM/DD HH:mm')}
        </span>
      ),
    },
    {
      title: '地点', dataIndex: 'location', width: 180,
      render: (v: string) => (
        <Tooltip content={v}>
          <span style={{
            display: 'inline-block', maxWidth: 160,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            verticalAlign: 'middle',
          }}>
            {v}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '报名人数', dataIndex: 'registrations', width: 100, align: 'center',
      render: (_: unknown, record: ActivityItem) => {
        const current = record._count?.registrations || 0;
        const max = record.max_participants;
        return (
          <span>
            {current}
            {max ? `/${max}` : ''}
            {' '}人
          </span>
        );
      },
    },
    {
      title: '费用', dataIndex: 'fee', width: 90, align: 'right',
      render: (v: number | null) => (v && v > 0 ? `HKD ${v.toLocaleString()}` : '免费'),
    },
    {
      title: '开放度', dataIndex: 'visibility', width: 100, align: 'center',
      render: (v: string) => {
        const info = visibilityMap[v || ''];
        return info ? <Tag color={info.color}>{info.text}</Tag> : '-';
      },
    },
    {
      title: '操作', dataIndex: 'operations', width: 170, align: 'center', fixed: 'right' as const,
      render: (_: unknown, record: ActivityItem) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<IconEye />} onClick={() => router.push(`/activities/${record.id}`)}>
            详情
          </Button>
          <Button type="text" size="small" icon={<IconEdit />} onClick={() => router.push(`/activities/${record.id}/edit`)}>
            编辑
          </Button>
          <Button type="text" size="small" status="danger" icon={<IconDelete />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav items={[{ title: '活动管理' }, { title: '活动列表' }]} />

      {/* 搜索筛选区 */}
      <div className="site-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="搜索活动名称"
            prefix={<IconSearch />}
            style={{ width: 220 }}
            value={keyword}
            onChange={(v) => setKeyword(v)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            placeholder="请选择活动状态"
            style={{ width: 150 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            allowClear
            options={[
              { value: '草稿', label: '草稿' },
              { value: '报名中', label: '报名中' },
              { value: '进行中', label: '进行中' },
              { value: '已结束', label: '已结束' },
            ]}
          />
          <Select
            placeholder="请选择活动分类"
            style={{ width: 150 }}
            value={categoryFilter || undefined}
            onChange={(v) => setCategoryFilter(v || '')}
            allowClear
            options={[
              { value: '文娱', label: '文娱' },
              { value: '体育', label: '体育' },
              { value: '培训', label: '培训' },
              { value: '公益', label: '公益' },
              { value: '会议', label: '会议' },
              { value: 'other', label: '其他' },
            ]}
          />
          <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>搜索</Button>
          <Button icon={<IconRefresh />} onClick={handleReset}>重置</Button>
        </div>
      </div>

      {/* 操作按钮区 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div />
        <Button type="primary" icon={<IconPlus />} onClick={() => router.push('/activities/create')}>
          创建活动
        </Button>
      </div>

      {/* 表格 */}
      <div className="site-card" style={{ padding: 0 }}>
        <Table<any>
          rowKey="id"
          columns={columns}
          data={data}
          loading={loading}
          scroll={{ x: 'max-content' }}
          border
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: true,
            sizeCanChange: true,
            pageSizeChangeResetCurrent: true,
            sizeOptions: [10, 20, 50, 100],
            onChange: (p: number, ps: number) => { setPage(p); setPageSize(ps); },
          }}
          noDataElement={
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ color: '#86909C', marginBottom: 16 }}>暂无活动数据</div>
              <Button type="primary" onClick={() => router.push('/activities/create')}>创建活动</Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
