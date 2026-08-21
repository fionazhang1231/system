'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Form, Input, Select, InputNumber, Switch, Button, Message, Steps, Space, Card, Spin,
  Checkbox, Tag, Divider,
} from '@arco-design/web-react';
import { IconMobile, IconCheck } from '@arco-design/web-react/icon';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { computeActivityStatus, statusColorMap } from '@/lib/activity-status';

const activityTypes = [
  { value: '线下活动', label: '线下活动' },
  { value: '线上活动', label: '线上活动' },
  { value: '培训', label: '培训' },
  { value: '会议', label: '会议' },
  { value: '其他', label: '其他' },
];

const activityCategories = [
  { value: '文娱', label: '文娱' },
  { value: '体育', label: '体育' },
  { value: '培训', label: '培训' },
  { value: '公益', label: '公益' },
  { value: '会议', label: '会议' },
  { value: 'other', label: '其他' },
];

/** 可配置的报名表单字段 */
const FORM_FIELD_OPTIONS = [
  { key: 'email', label: '邮箱', defaultOn: false },
  { key: 'gender', label: '性别', defaultOn: false },
  { key: 'birthday', label: '生日', defaultOn: false },
  { key: 'address', label: '地址', defaultOn: false },
  { key: 'remark', label: '备注', defaultOn: true },
];

/** H5 主题色预设 */
const THEME_COLORS = [
  { value: '#1677FF', label: '蓝色' },
  { value: '#0FC6C2', label: '青蓝' },
  { value: '#00B42A', label: '绿色' },
  { value: '#FF7D00', label: '橙色' },
  { value: '#F53F3F', label: '红色' },
  { value: '#722ED1', label: '紫色' },
];

interface ActivityFormProps {
  activityId?: string; // 传入则为编辑模式
}

/** 活动创建/编辑共享表单组件 */
export default function ActivityForm({ activityId }: ActivityFormProps) {
  const router = useRouter();
  const isEdit = !!activityId;
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // H5 配置状态
  const [h5FormFields, setH5FormFields] = useState<string[]>(['remark']);
  const [h5ThemeColor, setH5ThemeColor] = useState('#1677FF');
  const [h5WelcomeText, setH5WelcomeText] = useState('欢迎参加本次活动');
  const [h5ShowLocation, setH5ShowLocation] = useState(true);
  const [h5ShowTime, setH5ShowTime] = useState(true);
  const [h5ShowFee, setH5ShowFee] = useState(true);
  const [h5ShowDesc, setH5ShowDesc] = useState(true);

  // 编辑模式加载数据
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      apiGet<Record<string, unknown>>(`/activities/${activityId}`).then((res) => {
        if (res.success && res.data) {
          const d = res.data as Record<string, unknown>;
          form.setFieldsValue({
            title: d.title,
            type: d.type,
            category: d.category,
            start_time: d.start_time,
            end_time: d.end_time,
            location: d.location,
            description: d.description || '',
            visibility: d.visibility,
            max_participants: d.max_participants,
            registration_start: d.registration_start,
            registration_end: d.registration_end,
            need_audit: d.need_audit,
            fee: d.fee,
          });
          // 恢复 H5 配置
          const h5 = d.h5Config as Record<string, unknown> | null;
          if (h5) {
            if (Array.isArray(h5.formFields)) setH5FormFields(h5.formFields as string[]);
            if (typeof h5.themeColor === 'string') setH5ThemeColor(h5.themeColor);
            if (typeof h5.welcomeText === 'string') setH5WelcomeText(h5.welcomeText);
            if (typeof h5.showLocation === 'boolean') setH5ShowLocation(h5.showLocation);
            if (typeof h5.showTime === 'boolean') setH5ShowTime(h5.showTime);
            if (typeof h5.showFee === 'boolean') setH5ShowFee(h5.showFee);
            if (typeof h5.showDesc === 'boolean') setH5ShowDesc(h5.showDesc);
          }
        }
        setLoading(false);
      });
    } else {
      form.setFieldsValue({
        type: '线下活动',
        category: 'other',
        visibility: 'member',
        need_audit: false,
        fee: 0,
      });
    }
  }, [isEdit, activityId, form]);

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validate(['title', 'start_time', 'end_time', 'location']);
      }
      setCurrentStep(currentStep + 1);
    } catch { /* validation */ }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = form.getFieldsValue();
      // 组装 H5 配置
      const h5Config = {
        formFields: h5FormFields,
        themeColor: h5ThemeColor,
        welcomeText: h5WelcomeText,
        showLocation: h5ShowLocation,
        showTime: h5ShowTime,
        showFee: h5ShowFee,
        showDesc: h5ShowDesc,
      };
      const payload = { ...values, h5_config: JSON.stringify(h5Config) };

      let res;
      if (isEdit) {
        res = await apiPut(`/activities/${activityId}`, payload);
      } else {
        res = await apiPost('/activities', payload);
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

  // 计算当前活动状态（用于展示）
  const getComputedStatus = () => {
    const values = form.getFieldsValue();
    if (!values.start_time || !values.end_time) return '草稿';
    return computeActivityStatus({
      start_time: values.start_time,
      end_time: values.end_time,
      registration_start: values.registration_start || null,
      registration_end: values.registration_end || null,
      status: '已发布', // 非草稿状态才计算
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size={40} />
      </div>
    );
  }

  const computedStatus = getComputedStatus();

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav
        items={[
          { title: '活动管理' },
          { title: '活动列表', href: '/activities' },
          { title: isEdit ? '编辑活动' : '创建活动' },
        ]}
      />

      <div className="site-card" style={{ maxWidth: 960, margin: '0 auto' }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Steps.Step title="基本信息" />
          <Steps.Step title="报名设置" />
          <Steps.Step title="H5 配置" />
          <Steps.Step title="确认提交" />
        </Steps>

        <Form form={form} layout="vertical" autoComplete="off">
          {/* Step 1: 基本信息 */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Form.Item field="title" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
              <Input placeholder="请输入活动名称" maxLength={100} />
            </Form.Item>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item field="type" label="活动类型" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Select options={activityTypes} placeholder="请选择" />
              </Form.Item>
              <Form.Item field="category" label="活动分类" style={{ flex: 1 }}>
                <Select options={activityCategories} placeholder="请选择" allowClear />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item field="start_time" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]} style={{ flex: 1 }}>
                <Input placeholder="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item field="end_time" label="结束时间" rules={[{ required: true, message: '请选择结束时间' }]} style={{ flex: 1 }}>
                <Input placeholder="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </div>
            <Form.Item field="location" label="活动地点" rules={[{ required: true, message: '请输入活动地点' }]}>
              <Input placeholder="请输入活动地点" />
            </Form.Item>
            <Form.Item field="description" label="活动描述">
              <Input.TextArea placeholder="请输入活动描述" maxLength={2000} autoSize={{ minRows: 4, maxRows: 8 }} />
            </Form.Item>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item field="visibility" label="开放度" style={{ flex: 1 }}>
                <Select options={[
                  { value: 'member', label: '会员专属' },
                  { value: 'public', label: '公开活动' },
                ]} />
              </Form.Item>
              <Form.Item field="fee" label="费用（HKD）" initialValue={0} style={{ flex: 1 }}>
                <InputNumber min={0} placeholder="0 表示免费" style={{ width: '100%' }} />
              </Form.Item>
            </div>
            {/* 活动状态：只读展示，由系统根据时间自动计算 */}
            <Form.Item label="活动状态（系统自动计算）">
              <div style={{ padding: '5px 0' }}>
                <Tag color={statusColorMap[computedStatus] || 'gray'}>{computedStatus}</Tag>
                <span style={{ marginLeft: 8, color: '#86909C', fontSize: 13 }}>
                  状态由系统根据报名时间、活动时间和当前时间自动判断
                </span>
              </div>
            </Form.Item>
          </div>

          {/* Step 2: 报名设置 */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item field="registration_start" label="报名开始时间" style={{ flex: 1 }}>
                <Input placeholder="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item field="registration_end" label="报名结束时间" style={{ flex: 1 }}>
                <Input placeholder="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </div>
            <Form.Item field="max_participants" label="人数上限">
              <InputNumber placeholder="不限" min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item field="need_audit" label="是否需要审核" triggerPropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>

          {/* Step 3: H5 配置 */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {/* 左侧：配置项 */}
              <div style={{ flex: 1 }}>
                <Divider orientation="left">报名表单字段</Divider>
                <div style={{ marginBottom: 8, color: '#86909C', fontSize: 13 }}>
                  姓名和手机号为必填字段，不可取消
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  <Checkbox checked disabled>姓名（必填）</Checkbox>
                  <Checkbox checked disabled>手机号（必填）</Checkbox>
                  <Checkbox.Group
                    value={h5FormFields}
                    onChange={(vals) => setH5FormFields(vals as string[])}
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {FORM_FIELD_OPTIONS.map((f) => (
                      <Checkbox key={f.key} value={f.key}>{f.label}</Checkbox>
                    ))}
                  </Checkbox.Group>
                </div>

                <Divider orientation="left">H5 页面样式</Divider>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>主题色</div>
                    <Space>
                      {THEME_COLORS.map((c) => (
                        <div
                          key={c.value}
                          onClick={() => setH5ThemeColor(c.value)}
                          style={{
                            width: 32, height: 32, borderRadius: 6,
                            backgroundColor: c.value, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: h5ThemeColor === c.value ? '2px solid #1D2129' : '2px solid transparent',
                          }}
                        >
                          {h5ThemeColor === c.value && <IconCheck style={{ color: '#fff', fontSize: 16 }} />}
                        </div>
                      ))}
                    </Space>
                  </div>
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>欢迎语</div>
                    <Input
                      value={h5WelcomeText}
                      onChange={(v) => setH5WelcomeText(v)}
                      placeholder="H5 页面顶部欢迎语"
                      maxLength={50}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>显示活动地点</span>
                      <Switch checked={h5ShowLocation} onChange={setH5ShowLocation} size="small" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>显示活动时间</span>
                      <Switch checked={h5ShowTime} onChange={setH5ShowTime} size="small" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>显示费用信息</span>
                      <Switch checked={h5ShowFee} onChange={setH5ShowFee} size="small" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>显示活动描述</span>
                      <Switch checked={h5ShowDesc} onChange={setH5ShowDesc} size="small" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧：手机预览 */}
              <div style={{ width: 300, flexShrink: 0 }}>
                <div style={{ textAlign: 'center', marginBottom: 8, color: '#86909C', fontSize: 13 }}>
                  <IconMobile style={{ marginRight: 4 }} />
                  H5 页面预览
                </div>
                <div style={{
                  width: 280, margin: '0 auto', borderRadius: 24,
                  border: '3px solid #1D2129', overflow: 'hidden',
                  background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}>
                  {/* 手机状态栏 */}
                  <div style={{
                    background: h5ThemeColor, padding: '8px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ color: '#fff', fontSize: 11 }}>9:41</span>
                    <span style={{ color: '#fff', fontSize: 11 }}>活动报名</span>
                    <span style={{ color: '#fff', fontSize: 11 }}>...</span>
                  </div>
                  {/* 欢迎语区域 */}
                  <div style={{
                    background: h5ThemeColor, padding: '20px 16px 24px',
                    textAlign: 'center',
                  }}>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                      {h5WelcomeText || '欢迎参加本次活动'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
                      {form.getFieldValue('title') || '活动名称'}
                    </div>
                  </div>
                  {/* 活动信息 */}
                  <div style={{ padding: 16 }}>
                    {h5ShowTime && (
                      <div style={{ fontSize: 12, color: '#4E5969', marginBottom: 8 }}>
                        🕐 {form.getFieldValue('start_time') || '待定'} ~ {form.getFieldValue('end_time') || '待定'}
                      </div>
                    )}
                    {h5ShowLocation && (
                      <div style={{ fontSize: 12, color: '#4E5969', marginBottom: 8 }}>
                        📍 {form.getFieldValue('location') || '待定'}
                      </div>
                    )}
                    {h5ShowFee && (
                      <div style={{ fontSize: 12, color: '#4E5969', marginBottom: 8 }}>
                        💰 {form.getFieldValue('fee') ? `HKD ${form.getFieldValue('fee')}` : '免费'}
                      </div>
                    )}
                    {h5ShowDesc && form.getFieldValue('description') && (
                      <div style={{
                        fontSize: 12, color: '#86909C', marginTop: 8, lineHeight: 1.6,
                        maxHeight: 60, overflow: 'hidden',
                      }}>
                        {form.getFieldValue('description')}
                      </div>
                    )}
                  </div>
                  {/* 报名表单 */}
                  <div style={{ padding: '0 16px 16px' }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, marginBottom: 12,
                      paddingBottom: 8, borderBottom: `2px solid ${h5ThemeColor}`,
                    }}>
                      报名信息
                    </div>
                    {['姓名 *', '手机号 *', ...FORM_FIELD_OPTIONS.filter((f) => h5FormFields.includes(f.key)).map((f) => f.label)].map((label) => (
                      <div key={label} style={{
                        height: 32, lineHeight: '32px', padding: '0 10px',
                        background: '#F7F8FA', borderRadius: 4,
                        fontSize: 12, color: '#86909C', marginBottom: 8,
                      }}>
                        {label}
                      </div>
                    ))}
                    <div style={{
                      height: 36, lineHeight: '36px', textAlign: 'center',
                      background: h5ThemeColor, color: '#fff',
                      borderRadius: 18, fontSize: 14, fontWeight: 500,
                      marginTop: 12,
                    }}>
                      立即报名
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: 确认信息 */}
          <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
            <Card title="请确认以下信息" style={{ borderRadius: 8 }}>
              <div style={{ lineHeight: 2.2 }}>
                <p><strong>活动名称：</strong>{form.getFieldValue('title')}</p>
                <p><strong>活动类型：</strong>{form.getFieldValue('type')}</p>
                <p><strong>活动分类：</strong>{form.getFieldValue('category') || '-'}</p>
                <p><strong>开放度：</strong>{form.getFieldValue('visibility') === 'public' ? '公开活动' : '会员专属'}</p>
                <p><strong>费用：</strong>{form.getFieldValue('fee') ? `HKD ${form.getFieldValue('fee')}` : '免费'}</p>
                <p><strong>开始时间：</strong>{form.getFieldValue('start_time')}</p>
                <p><strong>结束时间：</strong>{form.getFieldValue('end_time')}</p>
                <p><strong>活动地点：</strong>{form.getFieldValue('location')}</p>
                <p><strong>活动描述：</strong>{form.getFieldValue('description') || '-'}</p>
                <p>
                  <strong>活动状态：</strong>
                  <Tag color={statusColorMap[computedStatus] || 'gray'} style={{ marginLeft: 4 }}>{computedStatus}</Tag>
                  <span style={{ color: '#86909C', fontSize: 13, marginLeft: 8 }}>（系统自动计算）</span>
                </p>
                <p><strong>人数上限：</strong>{form.getFieldValue('max_participants') || '不限'}</p>
                <p><strong>需要审核：</strong>{form.getFieldValue('need_audit') ? '是' : '否'}</p>
                <Divider style={{ margin: '12px 0' }} />
                <p><strong>H5 配置：</strong></p>
                <p style={{ paddingLeft: 16 }}>
                  表单字段：姓名、手机号{h5FormFields.map((k) => `、${FORM_FIELD_OPTIONS.find((f) => f.key === k)?.label || k}`).join('')}
                </p>
                <p style={{ paddingLeft: 16 }}>
                  主题色：<span style={{
                    display: 'inline-block', width: 14, height: 14,
                    background: h5ThemeColor, borderRadius: 3,
                    verticalAlign: 'middle', marginRight: 4,
                  }} />
                  {THEME_COLORS.find((c) => c.value === h5ThemeColor)?.label || h5ThemeColor}
                </p>
                <p style={{ paddingLeft: 16 }}>欢迎语：{h5WelcomeText}</p>
              </div>
            </Card>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => router.push('/activities')}>取消</Button>
              {currentStep > 0 && <Button onClick={() => setCurrentStep(currentStep - 1)}>上一步</Button>}
              {currentStep < 3 && <Button type="primary" onClick={handleNext}>下一步</Button>}
              {currentStep === 3 && (
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
