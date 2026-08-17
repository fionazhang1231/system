'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Input, Select, Space, Tag, Modal, Message, Card, Grid,
} from '@arco-design/web-react';
import { IconSearch, IconPlus, IconDelete, IconEdit, IconEye } from '@arco-design/web-react/icon';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiDelete } from '@/lib/api';
import type { Activity } from '@/types';

const { Row, Col } = Grid;

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

/** 活动列表页（卡片式） */
export default function ActivitiesPage() {
  const router = useRouter();
  const [data, setData] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Activity[]>('/activities', {
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      });
      if (res.success && res.data) {
        setData(res.data);
        setTotal(res.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该活动吗？',
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        const res = await apiDelete(`/activities/${id}`);
        if (res.success) {
          Message.success('删除成功');
          fetchData();
        } else {
          Message.error(res.error || '删除失败');
        }
      },
    });
  };

  const formatTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return '-'; }
  };

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav items={[{ title: '活动管理' }, { title: '活动列表' }]} />

      {/* 搜索栏 */}
      <div className="site-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input
              prefix={<IconSearch />}
              placeholder="搜索活动名称"
              value={keyword}
              onChange={setKeyword}
              onPressEnter={fetchData}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="活动状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              allowClear
              options={[
                { value: '草稿', label: '草稿' },
                { value: '报名中', label: '报名中' },
                { value: '进行中', label: '进行中' },
                { value: '已结束', label: '已结束' },
              ]}
            />
            <Button type="primary" icon={<IconSearch />} onClick={fetchData}>搜索</Button>
          </Space>
          <Button type="primary" icon={<IconPlus />} onClick={() => router.push('/activities/create')}>
            创建活动
          </Button>
        </div>
      </div>

      {/* 活动卡片列表 */}
      {data.length === 0 && !loading ? (
        <div className="site-card">
          <div className="empty-state">
            <p>暂无活动数据</p>
            <Button type="primary" onClick={() => router.push('/activities/create')}>创建活动</Button>
          </div>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {data.map((activity) => (
            <Col key={activity.id} xs={24} sm={12} lg={8} xl={6}>
              <Card
                hoverable
                style={{ borderRadius: 8, overflow: 'hidden' }}
                bodyStyle={{ padding: 0 }}
              >
                {/* 封面图区域 */}
                <div style={{
                  height: 140,
                  background: 'linear-gradient(135deg, #0E7C7B 0%, #12999A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <span style={{ color: '#fff', fontSize: 24, fontWeight: 700, opacity: 0.8 }}>
                    {activity.title.charAt(0)}
                  </span>
                  <Tag
                    color={statusColorMap[activity.status] || 'gray'}
                    style={{ position: 'absolute', top: 12, right: 12 }}
                  >
                    {activity.status}
                  </Tag>
                  {activity.category && (
                    <Tag
                      style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
                    >
                      {categoryMap[activity.category] || activity.category}
                    </Tag>
                  )}
                </div>

                {/* 内容区 */}
                <div style={{ padding: 16 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activity.title}
                  </h4>
                  <div style={{ color: '#86909C', fontSize: 13, lineHeight: 1.8 }}>
                    <div>📍 {activity.location}</div>
                    <div>🕐 {formatTime(activity.start_time)} - {formatTime(activity.end_time)}</div>
                    <div>
                      👥 {activity._count?.registrations || 0}
                      {activity.max_participants ? `/${activity.max_participants}` : ''} 人
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px solid #F2F3F5', paddingTop: 12 }}>
                    <Button type="text" size="small" icon={<IconEye />} onClick={() => router.push(`/activities/${activity.id}`)}>
                      详情
                    </Button>
                    <Button type="text" size="small" icon={<IconEdit />} onClick={() => router.push(`/activities/${activity.id}/edit`)}>
                      编辑
                    </Button>
                    <Button type="text" size="small" icon={<IconDelete />} status="danger" onClick={() => handleDelete(activity.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16, color: '#86909C', fontSize: 13 }}>
          共 {total} 个活动
        </div>
      )}
    </div>
  );
}
