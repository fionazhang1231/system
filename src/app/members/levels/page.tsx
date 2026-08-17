'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Message, Space,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete } from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { MemberLevel } from '@/types';

/** 会员等级管理页 */
export default function MemberLevelsPage() {
  const [data, setData] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MemberLevel | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<MemberLevel[]>('/member-levels');
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

  const handleEdit = (record: MemberLevel) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      upgrade_condition: record.upgrade_condition || '',
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

  const columns: ColumnProps<MemberLevel>[] = [
    { title: '等级名称', dataIndex: 'name', width: 120 },
    { title: '升级条件', dataIndex: 'upgrade_condition', render: (_, record) => record.upgrade_condition || '-' },
    { title: '权益描述', dataIndex: 'benefits', render: (_, record) => record.benefits || '-' },
    { title: '排序', dataIndex: 'sort_order', width: 80 },
    {
      title: '操作', dataIndex: 'operations', width: 150,
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
      >
        <Form form={form} layout="vertical">
          <Form.Item field="name" label="等级名称" rules={[{ required: true, message: '请输入等级名称' }]}>
            <Input placeholder="请输入等级名称" maxLength={20} />
          </Form.Item>
          <Form.Item field="upgrade_condition" label="升级条件">
            <Input.TextArea placeholder="请输入升级条件" maxLength={200} />
          </Form.Item>
          <Form.Item field="benefits" label="权益描述">
            <Input.TextArea placeholder="请输入权益描述" maxLength={500} />
          </Form.Item>
          <Form.Item field="sort_order" label="排序" initialValue={0}>
            <InputNumber placeholder="排序值" min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
