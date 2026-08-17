'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Message, Space, Tag,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete } from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { MemberType } from '@/types';

/** 会员类型管理页 */
export default function MemberTypesPage() {
  const [data, setData] = useState<MemberType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MemberType | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<MemberType[]>('/member-types');
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

  const handleEdit = (record: MemberType) => {
    setEditingItem(record);
    form.setFieldsValue({ name: record.name, description: record.description || '' });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该会员类型吗？',
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        const res = await apiDelete(`/member-types/${id}`);
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
        res = await apiPut(`/member-types/${editingItem.id}`, values);
      } else {
        res = await apiPost('/member-types', values);
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

  const columns: ColumnProps<MemberType>[] = [
    { title: '类型名称', dataIndex: 'name', width: 200 },
    { title: '描述', dataIndex: 'description', render: (_, record) => record.description || '-' },
    {
      title: '创建时间', dataIndex: 'created_at', width: 180,
      render: (_, record) => {
        try { return new Date(record.created_at).toLocaleDateString('zh-CN'); } catch { return '-'; }
      },
    },
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
      <BreadcrumbNav items={[{ title: '会员管理' }, { title: '会员类型' }]} />

      <div className="site-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>会员类型列表</h3>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>新增类型</Button>
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
        title={editingItem ? '编辑会员类型' : '新增会员类型'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        autoFocus={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item field="name" label="类型名称" rules={[{ required: true, message: '请输入类型名称' }]}>
            <Input placeholder="请输入类型名称" maxLength={20} />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <Input.TextArea placeholder="请输入描述" maxLength={200} autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
