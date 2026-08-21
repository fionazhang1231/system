'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, Message, Space, Tag, Select, InputNumber, Switch,
  Tooltip,
} from '@arco-design/web-react';
import {
  IconPlus, IconEdit, IconDelete, IconRefresh, IconSearch,
  IconQuestionCircle,
} from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface MemberTypeItem {
  id: number;
  name: string;
  type_key: string;
  description?: string;
  fee_mode: string;
  fee_amount: number;
  need_audit: boolean;
  audit_mode: string;
  sort_order: number;
  created_at: string;
}

const feeModeMap: Record<string, string> = {
  free: '免费', yearly: '年费', monthly: '月费', lifetime: '终身',
};
const auditModeMap: Record<string, string> = {
  none: '无需审核', single: '一级审核', double: '两级审核',
};

/** 会员类型管理页 */
export default function MemberTypesPage() {
  const [data, setData] = useState<MemberTypeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MemberTypeItem | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [feeModeFilter, setFeeModeFilter] = useState<string>('');
  const [auditFilter, setAuditFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<MemberTypeItem[]>('/member-types');
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
        (item) => item.name.toLowerCase().includes(kw)
      );
    }
    if (feeModeFilter) {
      result = result.filter((item) => item.fee_mode === feeModeFilter);
    }
    if (auditFilter === 'yes') {
      result = result.filter((item) => item.need_audit);
    } else if (auditFilter === 'no') {
      result = result.filter((item) => !item.need_audit);
    }
    return result;
  }, [data, keyword, feeModeFilter, auditFilter]);

  const handleReset = () => {
    setKeyword(''); setFeeModeFilter(''); setAuditFilter('');
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: MemberTypeItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description || '',
      fee_mode: record.fee_mode,
      fee_amount: record.fee_amount,
      need_audit: record.need_audit,
      audit_mode: record.audit_mode,
      sort_order: record.sort_order,
    });
    setModalVisible(true);
  };

  const handleDelete = (record: MemberTypeItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会员类型「${record.name}」吗？`,
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        const res = await apiDelete(`/member-types/${record.id}`);
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
        res = await apiPut(`/member-types/${editingItem.id}`, values);
      } else {
        res = await apiPost('/member-types', values);
      }
      if (res.success) {
        Message.success(editingItem ? '更新成功' : '创建成功');
        setModalVisible(false); fetchData();
      } else { Message.error(res.error || '操作失败'); }
    } catch { /* validation */ } finally { setSubmitting(false); }
  };

  const columns: ColumnProps<MemberTypeItem>[] = [
    { title: '类型名称', dataIndex: 'name', width: 120 },
    {
      title: '收费模式', dataIndex: 'fee_mode', width: 100,
      render: (_, r) => feeModeMap[r.fee_mode] || r.fee_mode,
    },
    {
      title: '费用', dataIndex: 'fee_amount', width: 90, align: 'right',
      render: (_, r) => r.fee_amount > 0 ? `¥${r.fee_amount.toLocaleString()}` : '免费',
    },
    {
      title: '需审核', dataIndex: 'need_audit', width: 80, align: 'center',
      render: (_, r) => r.need_audit ? <Tag color="orange">是</Tag> : <Tag color="green">否</Tag>,
    },
    {
      title: '审核模式', dataIndex: 'audit_mode', width: 100,
      render: (_, r) => auditModeMap[r.audit_mode] || r.audit_mode,
    },
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
    { title: '描述', dataIndex: 'description', render: (_, r) => r.description || '-' },
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
      <BreadcrumbNav items={[{ title: '会员管理' }, { title: '会员类型' }]} />

      {/* 筛选区 */}
      <div className="site-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="类型名称"
            prefix={<IconSearch />}
            style={{ width: 220 }}
            value={keyword}
            onChange={(v) => setKeyword(v)}
            allowClear
          />
          <Select
            placeholder="请选择收费模式"
            style={{ width: 150 }}
            value={feeModeFilter || undefined}
            onChange={(v) => setFeeModeFilter(v || '')}
            allowClear
            options={[
              { value: 'free', label: '免费' },
              { value: 'yearly', label: '年费' },
              { value: 'monthly', label: '月费' },
              { value: 'lifetime', label: '终身' },
            ]}
          />
          <Select
            placeholder="是否需要审核"
            style={{ width: 150 }}
            value={auditFilter || undefined}
            onChange={(v) => setAuditFilter(v || '')}
            allowClear
            options={[
              { value: 'yes', label: '需要审核' },
              { value: 'no', label: '无需审核' },
            ]}
          />
          <Button icon={<IconRefresh />} onClick={handleReset}>重置</Button>
        </div>
      </div>

      {/* 表格区 */}
      <div className="site-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>会员类型列表</h3>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>新增类型</Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          data={filteredData}
          loading={loading}
          pagination={false}
          scroll={{ x: 1100 }}
          border
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
        style={{ width: 560 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item field="name" label="类型名称" rules={[{ required: true, message: '请输入类型名称' }]}>
            <Input placeholder="请输入类型名称" maxLength={20} />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <Input.TextArea placeholder="请输入描述" maxLength={200} autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item field="fee_mode" label="收费模式" initialValue="free">
            <Select options={[
              { value: 'free', label: '免费' },
              { value: 'yearly', label: '年费' },
              { value: 'monthly', label: '月费' },
              { value: 'lifetime', label: '终身' },
            ]} />
          </Form.Item>
          <Form.Item field="fee_amount" label="费用金额" initialValue={0}>
            <InputNumber min={0} placeholder="0 表示免费" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item field="need_audit" label="是否需要审核" triggerPropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item field="audit_mode" label="审核模式" initialValue="none">
            <Select options={[
              { value: 'none', label: '无需审核' },
              { value: 'single', label: '一级审核' },
              { value: 'double', label: '两级审核' },
            ]} />
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
