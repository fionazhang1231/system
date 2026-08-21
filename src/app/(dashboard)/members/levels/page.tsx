'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, Message, Space, Select, InputNumber, Tooltip,
} from '@arco-design/web-react';
import {
  IconPlus, IconEdit, IconDelete, IconRefresh, IconSearch,
  IconQuestionCircle,
} from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface MemberLevelItem {
  id: number;
  name: string;
  level_key: string;
  growth_threshold: number;
  upgrade_condition?: string;
  benefits?: string;
  sort_order: number;
  created_at: string;
}

/** 会员等级管理页 */
export default function MemberLevelsPage() {
  const [data, setData] = useState<MemberLevelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MemberLevelItem | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [growthFilter, setGrowthFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<MemberLevelItem[]>('/member-levels');
      if (res.success && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 前端筛选
  const filteredData = useMemo(() => {
    let result = data;
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(kw) || item.level_key.toLowerCase().includes(kw)
      );
    }
    if (growthFilter) {
      const [min, max] = growthFilter.split('-').map(Number);
      if (max) {
        result = result.filter((item) => item.growth_threshold >= min && item.growth_threshold < max);
      } else {
        result = result.filter((item) => item.growth_threshold >= min);
      }
    }
    return result;
  }, [data, keyword, growthFilter]);

  const handleReset = () => {
    setKeyword(''); setGrowthFilter('');
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: MemberLevelItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      growth_threshold: record.growth_threshold,
      upgrade_condition: record.upgrade_condition || '',
      benefits: record.benefits || '',
      sort_order: record.sort_order,
    });
    setModalVisible(true);
  };

  const handleDelete = (record: MemberLevelItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会员等级「${record.name}」吗？`,
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        const res = await apiDelete(`/member-levels/${record.id}`);
        if (res.success) { Message.success('删除成功'); fetchData(); }
        else { Message.error(res.error || '删除失败'); }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      let res;
      if (editingItem) {
        res = await apiPut(`/member-levels/${editingItem.id}`, values);
      } else {
        res = await apiPost('/member-levels', values);
      }
      if (res.success) {
        Message.success(editingItem ? '更新成功' : '创建成功');
        setModalVisible(false); fetchData();
      } else { Message.error(res.error || '操作失败'); }
    } catch { /* validation */ } finally { setSubmitting(false); }
  };

  const columns: ColumnProps<MemberLevelItem>[] = [
    { title: '等级名称', dataIndex: 'name', width: 110 },
    {
      title: '等级标识', dataIndex: 'level_key', width: 90,
    },
    {
      title: '成长值门槛', dataIndex: 'growth_threshold', width: 110, align: 'right',
      render: (_, r) => r.growth_threshold.toLocaleString(),
    },
    { title: '升级条件', dataIndex: 'upgrade_condition', render: (_, r) => r.upgrade_condition || '-' },
    { title: '权益描述', dataIndex: 'benefits', render: (_, r) => r.benefits || '-' },
    {
      title: (
        <Space size={4}>
          <span>排序</span>
          <Tooltip content="数字越小越靠前，用于控制用户侧的展示顺序">
            <IconQuestionCircle style={{ color: '#86909C', cursor: 'help' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'sort_order', width: 80, align: 'center',
    },
    {
      title: '操作', dataIndex: 'operations', width: 160, align: 'center', fixed: 'right' as const,
      render: (_, record) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<IconEdit />} onClick={() => handleEdit(record)}>
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
      <BreadcrumbNav items={[{ title: '会员管理' }, { title: '会员等级' }]} />

      {/* 筛选区 */}
      <div className="site-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="等级名称 / 等级标识"
            prefix={<IconSearch />}
            style={{ width: 220 }}
            value={keyword}
            onChange={(v) => setKeyword(v)}
            allowClear
          />
          <Select
            placeholder="请选择成长值范围"
            style={{ width: 180 }}
            value={growthFilter || undefined}
            onChange={(v) => setGrowthFilter(v || '')}
            allowClear
            options={[
              { value: '0-500', label: '0 ~ 499' },
              { value: '500-1000', label: '500 ~ 999' },
              { value: '1000-3000', label: '1,000 ~ 2,999' },
              { value: '3000-5000', label: '3,000 ~ 4,999' },
              { value: '5000', label: '5,000 以上' },
            ]}
          />
          <Button icon={<IconRefresh />} onClick={handleReset}>重置</Button>
        </div>
      </div>

      {/* 表格区 */}
      <div className="site-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>会员等级列表</h3>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>新增等级</Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          data={filteredData}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
          border
        />
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingItem ? '编辑会员等级' : '新增会员等级'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        autoFocus={false}
        style={{ width: 560 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item field="name" label="等级名称" rules={[{ required: true, message: '请输入等级名称' }]}>
            <Input placeholder="请输入等级名称" maxLength={20} />
          </Form.Item>
          <Form.Item field="growth_threshold" label="成长值门槛" initialValue={0}>
            <InputNumber min={0} placeholder="达到此成长值自动升级" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item field="upgrade_condition" label="升级条件">
            <Input placeholder="请输入升级条件" maxLength={100} />
          </Form.Item>
          <Form.Item field="benefits" label="权益描述">
            <Input.TextArea placeholder="请输入权益描述" maxLength={200} autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item
            field="sort_order"
            label={
              <Space size={4}>
                <span>排序</span>
                <Tooltip content="数字越小越靠前，用于控制用户侧的展示顺序">
                  <IconQuestionCircle style={{ color: '#86909C', cursor: 'help' }} />
                </Tooltip>
              </Space>
            }
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
