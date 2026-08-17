'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Form, Input, Select, DatePicker, InputNumber, Switch, Button, Message, Steps, Space, Card, Spin,
} from '@arco-design/web-react';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut } from '@/lib/api';

const activityTypes = [
  { value: '线下活动', label: '线下活动' },
  { value: '线上活动', label: '线上活动' },
  { value: '培训', label: '培训' },
  { value: '会议', label: '会议' },
  { value: '其他', label: '其他' },
];

/** 创建/编辑活动页面 */
export default function ActivityFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params.id && params.id !== 'create';
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      apiGet<Record<string, unknown>>(`/activities/${params.id}`).then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          form.setFieldsValue({
            title: d.title,
            type: d.type,
            start_time: d.start_time,
            end_time: d.end_time,
            location: d.location,
            description: d.description || '',
            status: d.status,
            max_participants: d.max_participants,
            registration_start: d.registration_start,
            registration_end: d.registration_end,
            need_audit: d.need_audit,
          });
        }
        setLoading(false);
      });
    } else {
      form.setFieldsValue({
        type: '线下活动',
        status: '草稿',
        need_audit: false,
      });
    }
  }, [isEdit, params.id, form]);

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validate(['title', 'start_time', 'end_time', 'location']);
      }
      setCurrentStep(currentStep + 1);
    } catch {
      // validation error
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = form.getFieldsValue();
      let res;
      if (isEdit) {
        res = await apiPut(`/activities/${params.id}`, values);
      } else {
        res = await apiPost('/activities', values);
      }
      if (res.success) {
        Message.success(isEdit ? '更新成功' : '创建成功');
        router.push('/activities');
      } else {
        Message.error(res.error || '操作失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size={40} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav
        items={[
          { title: '活动管理' },
          { title: '活动列表', href: '/activities' },
          { title: isEdit ? '编辑活动' : '创建活动' },
        ]}
      />

      <div className="site-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Steps.Step title="基本信息" />
          <Steps.Step title="报名设置" />
          <Steps.Step title="确认提交" />
        </Steps>

        <Form form={form} layout="vertical" autoComplete="off">
          {/* Step 1: 基本信息 */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Form.Item field="title" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
              <Input placeholder="请输入活动名称" maxLength={100} />
            </Form.Item>
            <Form.Item field="type" label="活动类型" rules={[{ required: true }]}>
              <Select options={activityTypes} placeholder="请选择" />
            </Form.Item>
            <Form.Item field="start_time" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
              <Input placeholder="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item field="end_time" label="结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
              <Input placeholder="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item field="location" label="活动地点" rules={[{ required: true, message: '请输入活动地点' }]}>
              <Input placeholder="请输入活动地点" />
            </Form.Item>
            <Form.Item field="description" label="活动描述">
              <Input.TextArea placeholder="请输入活动描述" maxLength={2000} autoSize={{ minRows: 4, maxRows: 8 }} />
            </Form.Item>
            <Form.Item field="status" label="活动状态">
              <Select options={[
                { value: '草稿', label: '草稿' },
                { value: '报名中', label: '报名中' },
                { value: '进行中', label: '进行中' },
                { value: '已结束', label: '已结束' },
              ]} />
            </Form.Item>
          </div>

          {/* Step 2: 报名设置 */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Form.Item field="registration_start" label="报名开始时间">
              <Input placeholder="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item field="registration_end" label="报名结束时间">
              <Input placeholder="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item field="max_participants" label="人数上限">
              <InputNumber placeholder="不限" min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item field="need_audit" label="是否需要审核" trigger="onChange" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>

          {/* Step 3: 确认信息 */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <Card title="请确认以下信息" style={{ borderRadius: 8 }}>
              <div style={{ lineHeight: 2.2 }}>
                <p><strong>活动名称：</strong>{form.getFieldValue('title')}</p>
                <p><strong>活动类型：</strong>{form.getFieldValue('type')}</p>
                <p><strong>开始时间：</strong>{form.getFieldValue('start_time')}</p>
                <p><strong>结束时间：</strong>{form.getFieldValue('end_time')}</p>
                <p><strong>活动地点：</strong>{form.getFieldValue('location')}</p>
                <p><strong>活动描述：</strong>{form.getFieldValue('description') || '-'}</p>
                <p><strong>活动状态：</strong>{form.getFieldValue('status')}</p>
                <p><strong>人数上限：</strong>{form.getFieldValue('max_participants') || '不限'}</p>
                <p><strong>需要审核：</strong>{form.getFieldValue('need_audit') ? '是' : '否'}</p>
              </div>
            </Card>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => router.push('/activities')}>取消</Button>
              {currentStep > 0 && <Button onClick={() => setCurrentStep(currentStep - 1)}>上一步</Button>}
              {currentStep < 2 && <Button type="primary" onClick={handleNext}>下一步</Button>}
              {currentStep === 2 && (
                <Button type="primary" loading={submitting} onClick={handleSubmit}>
                  {isEdit ? '保存修改' : '确认创建'}
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
}
