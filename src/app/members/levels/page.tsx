'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Message, Space, Tag,
} from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface MemberLevelItem {
  id: number;
  name: string;
  level_key: string;
  growth_threshold: number;
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

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: MemberLevelItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      level_key: record.level_key,
      growth_threshold: record.growth_threshold,
      benefits: record.benefits || '',
      sort_order: record.sort_order,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该会员等级吗？',
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        const res = await apiDelete(`/member-levels/${id}`);
        if (res.success) {
          Message.success('删除成功');
          fetchData();
        } else {
          Message.error(res.error || '删除失败');
        }
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
        setModalVisible(false);
        fetchData();
      } else {
        Message.error(res.error || '操作失败');
      }
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  };

  const levelColorMap: Record<string, string> = {
    'VIP1': 'gray', 'VIP2': 'blue', 'VIP3': 'green', 'VIP4': 'gold', 'VIP5': 'red',
  };

  const columns: ColumnProps<MemberLevelItem>[] = [
    { title: '等级名称', dataIndex: 'name', width: 120, render: (_, r) => <Tag color={levelColorMap[r.name] || 'gray'}>{r.name}</Tag> },
    { title: '等级标识', dataIndex: 'level_key', width: 100, render: (_, r) => <Tag>{r.level_key}</Tag> },
    { title: '成长值门槛', dataIndex: 'growth_threshold', width: 120, render: (_, r) => (
      <span style={{ fontWeight: 500, color: '#0E7C7B' }}>{r.growth_threshold.toLocaleString()}</span>
    )},
    { title: '等级权益', dataIndex: 'benefits', render: (_, r) => r.benefits || '-' },
    { title: '排序', dataIndex: 'sort_order', width: 60 },
    {
      title: '操作', dataIndex: 'operations', width: 130, fixed: 'right' as const,
      render: (_, record) => (
        <Space>
          <button className="action-btn" onClick={() => handleEdit(record)}>编辑</button>
          <button className="action-btn danger" onClick={() => handleDelete(record.id)}>删除</button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav items={[{ title: '会员管理' }, { title: '会员等级' }]} />

      <div className="site-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>会员等级列表</h3>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>新增等级</Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          data={data}
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
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
        style={{ width: 520 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item field="name" label="等级名称" rules={[{ required: true, message: '请输入等级名称' }]}>
            <Input placeholder="如：VIP1、VIP2..." maxLength={20} />
          </Form.Item>
          <Form.Item field="growth_threshold" label="成长值门槛" initialValue={0}>
            <InputNumber min={0} placeholder="达到该成长值自动升级" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item field="benefits" label="等级权益">
            <Input.TextArea placeholder="请输入权益描述" maxLength={200} autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item field="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
