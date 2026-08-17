'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Form, Input, Select, DatePicker, Button, Message, Steps, Space, Card, Spin,
} from '@arco-design/web-react';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut } from '@/lib/api';

/** 新增/编辑会员页面 */
export default function MemberFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = params.id && params.id !== 'create';
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [memberTypes, setMemberTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [memberLevels, setMemberLevels] = useState<Array<{ id: number; name: string }>>([]);

  // 加载会员类型和等级选项
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

  // 编辑模式：加载数据
  useEffect(() => {
    if (isEdit) {
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
            member_type_id: ext?.member_type_id || (memberTypes[0]?.id ?? 1),
            member_level_id: ext?.member_level_id || (memberLevels[0]?.id ?? 1),
            join_date: ext?.join_date || new Date().toISOString().split('T')[0],
            expire_date: ext?.expire_date || '2025-12-31',
          });
        }
        setLoading(false);
      });
    } else {
      // 新增模式：设置默认值
      form.setFieldsValue({
        join_date: new Date().toISOString().split('T')[0],
        expire_date: '2025-12-31',
      });
    }
  }, [isEdit, params.id, form, memberTypes, memberLevels]);

  // 步骤校验
  const validateStep = async (step: number): Promise<boolean> => {
    try {
      if (step === 0) {
        await form.validate(['name', 'phone']);
      }
      return true;
    } catch {
      return false;
    }
  };

  // 下一步
  const handleNext = async () => {
    const valid = await validateStep(currentStep);
    if (valid) setCurrentStep(currentStep + 1);
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 提交
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = form.getFieldsValue();
      const payload = {
        ...values,
        member_type_id: values.member_type_id || memberTypes[0]?.id || 1,
        member_level_id: values.member_level_id || memberLevels[0]?.id || 1,
      };

      let res;
      if (isEdit) {
        res = await apiPut(`/members/${params.id}`, payload);
      } else {
        res = await apiPost('/members', payload);
      }

      if (res.success) {
        Message.success(isEdit ? '更新成功' : '创建成功');
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
      <BreadcrumbNav
        items={[
          { title: '会员管理' },
          { title: '会员列表', href: '/members' },
          { title: isEdit ? '编辑会员' : '新增会员' },
        ]}
      />

      <div className="site-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Steps.Step title="基本信息" />
          <Steps.Step title="会员信息" />
          <Steps.Step title="确认提交" />
        </Steps>

        <Form form={form} layout="vertical" autoComplete="off">
          {/* Step 1: 基本信息 */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Form.Item field="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" maxLength={50} />
            </Form.Item>
            <Form.Item
              field="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { match: /^1\d{10}$/, message: '请输入正确的11位手机号' },
              ]}
            >
              <Input placeholder="请输入手机号" maxLength={11} />
            </Form.Item>
            <Form.Item field="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}>
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item field="gender" label="性别">
              <Select placeholder="请选择" options={[
                { value: '男', label: '男' },
                { value: '女', label: '女' },
              ]} allowClear />
            </Form.Item>
            <Form.Item field="birthday" label="生日">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item field="address" label="地址">
              <Input placeholder="请输入地址" />
            </Form.Item>
          </div>

          {/* Step 2: 会员信息 */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Form.Item field="member_type_id" label="会员类型" rules={[{ required: true, message: '请选择会员类型' }]}>
              <Select placeholder="请选择会员类型" options={memberTypes.map((t) => ({ value: t.id, label: t.name }))} />
            </Form.Item>
            <Form.Item field="member_level_id" label="会员等级" rules={[{ required: true, message: '请选择会员等级' }]}>
              <Select placeholder="请选择会员等级" options={memberLevels.map((l) => ({ value: l.id, label: l.name }))} />
            </Form.Item>
            <Form.Item field="join_date" label="入会日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item field="expire_date" label="到期日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {/* Step 3: 确认信息 */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <Card title="请确认以下信息" style={{ borderRadius: 8 }}>
              <div style={{ lineHeight: 2.2 }}>
                <p><strong>姓名：</strong>{form.getFieldValue('name')}</p>
                <p><strong>手机号：</strong>{form.getFieldValue('phone')}</p>
                <p><strong>邮箱：</strong>{form.getFieldValue('email') || '-'}</p>
                <p><strong>性别：</strong>{form.getFieldValue('gender') || '-'}</p>
                <p><strong>生日：</strong>{form.getFieldValue('birthday') || '-'}</p>
                <p><strong>地址：</strong>{form.getFieldValue('address') || '-'}</p>
                <p><strong>会员类型：</strong>{memberTypes.find((t) => t.id === form.getFieldValue('member_type_id'))?.name || '-'}</p>
                <p><strong>会员等级：</strong>{memberLevels.find((l) => l.id === form.getFieldValue('member_level_id'))?.name || '-'}</p>
                <p><strong>入会日期：</strong>{form.getFieldValue('join_date') || '-'}</p>
                <p><strong>到期日期：</strong>{form.getFieldValue('expire_date') || '-'}</p>
              </div>
            </Card>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => router.push('/members')}>取消</Button>
              {currentStep > 0 && <Button onClick={handlePrev}>上一步</Button>}
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
