'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Form, Input, Select, Button, Message, Steps, Space, Card, Spin,
} from '@arco-design/web-react';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPut } from '@/lib/api';

/** 编辑会员页面 */
export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [memberTypes, setMemberTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [memberLevels, setMemberLevels] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const [typesRes, levelsRes] = await Promise.all([
        apiGet<Array<{ id: number; name: string }>>('/member-types'),
        apiGet<Array<{ id: number; name: string }>>('/member-levels'),
      ]);
      if (typesRes.success && typesRes.data) setMemberTypes(typesRes.data);
      if (levelsRes.success && levelsRes.data) setMemberLevels(levelsRes.data);
    };
    loadOptions();
  }, []);

  useEffect(() => {
    setLoading(true);
    apiGet<Record<string, unknown>>(`/members/${params.id}`).then((res) => {
      if (res.success && res.data) {
        const d = res.data as Record<string, unknown>;
        const ext = d.memberExt as Record<string, unknown> | undefined;
        form.setFieldsValue({
          name: d.name,
          phone: d.phone,
          email: d.email || '',
          gender: d.gender || '',
          birthday: d.birthday || '',
          address: d.address || '',
          member_type_id: ext?.member_type_id,
          member_level_id: ext?.member_level_id,
          join_date: ext?.join_date || '',
          expire_date: ext?.expire_date || '',
        });
      }
      setLoading(false);
    });
  }, [params.id, form]);

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validate(['name', 'phone']);
      }
      setCurrentStep(currentStep + 1);
    } catch { /* validation error */ }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = form.getFieldsValue();
      const res = await apiPut(`/members/${params.id}`, values);
      if (res.success) {
        Message.success('更新成功');
        router.push('/members');
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
      <BreadcrumbNav items={[{ title: '会员管理' }, { title: '会员列表', href: '/members' }, { title: '编辑会员' }]} />
      <div className="site-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Steps.Step title="基本信息" />
          <Steps.Step title="会员信息" />
          <Steps.Step title="确认提交" />
        </Steps>
        <Form form={form} layout="vertical" autoComplete="off">
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Form.Item field="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" maxLength={50} />
            </Form.Item>
            <Form.Item field="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }, { match: /^1\d{10}$/, message: '请输入正确的11位手机号' }]}>
              <Input placeholder="请输入手机号" maxLength={11} />
            </Form.Item>
            <Form.Item field="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}>
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item field="gender" label="性别">
              <Select placeholder="请选择" options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} allowClear />
            </Form.Item>
            <Form.Item field="birthday" label="生日">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item field="address" label="地址">
              <Input placeholder="请输入地址" />
            </Form.Item>
          </div>
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Form.Item field="member_type_id" label="会员类型" rules={[{ required: true, message: '请选择会员类型' }]}>
              <Select placeholder="请选择" options={memberTypes.map((t) => ({ value: t.id, label: t.name }))} />
            </Form.Item>
            <Form.Item field="member_level_id" label="会员等级" rules={[{ required: true, message: '请选择会员等级' }]}>
              <Select placeholder="请选择" options={memberLevels.map((l) => ({ value: l.id, label: l.name }))} />
            </Form.Item>
            <Form.Item field="join_date" label="入会日期">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item field="expire_date" label="到期日期">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </div>
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <Card title="请确认以下信息" style={{ borderRadius: 8 }}>
              <div style={{ lineHeight: 2.2 }}>
                <p><strong>姓名：</strong>{form.getFieldValue('name')}</p>
                <p><strong>手机号：</strong>{form.getFieldValue('phone')}</p>
                <p><strong>邮箱：</strong>{form.getFieldValue('email') || '-'}</p>
                <p><strong>会员类型：</strong>{memberTypes.find((t) => t.id === form.getFieldValue('member_type_id'))?.name || '-'}</p>
                <p><strong>会员等级：</strong>{memberLevels.find((l) => l.id === form.getFieldValue('member_level_id'))?.name || '-'}</p>
              </div>
            </Card>
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => router.push('/members')}>取消</Button>
              {currentStep > 0 && <Button onClick={() => setCurrentStep(currentStep - 1)}>上一步</Button>}
              {currentStep < 2 && <Button type="primary" onClick={handleNext}>下一步</Button>}
              {currentStep === 2 && <Button type="primary" loading={submitting} onClick={handleSubmit}>保存修改</Button>}
            </Space>
          </div>
        </Form>
      </div>
    </div>
  );
}
