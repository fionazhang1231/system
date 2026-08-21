'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import {
  Form, Input, Select, InputNumber, Switch, Button, Message, Steps, Space, Card, Spin,
  Divider, DatePicker,
} from '@arco-design/web-react';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { H5Config, createDefaultH5Config, normalizeH5Config, DISPLAY_TYPES } from '@/lib/h5-config';
import H5FormBuilder from '@/components/H5FormBuilder';
import { PreviewActivityInfo } from '@/components/H5PhonePreview';
import type { ActivityTemplate } from '@/lib/activity-templates';

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

interface ActivityFormProps {
  activityId?: string; // 传入则为编辑模式
  templateId?: string; // 创建模式下从模板预填
}

/** 转为 DatePicker 可用的 dayjs 值 */
const toDayjs = (v: unknown) => (v ? dayjs(v as string) : undefined);
/** 提交时格式化为后端存储格式 */
const fmtDT = (v: unknown): string | undefined =>
  v ? dayjs(v as string).format('YYYY-MM-DD HH:mm:ss') : undefined;
/** 预览/确认页展示格式 */
const fmtShort = (v: unknown): string => (v ? dayjs(v as string).format('YYYY-MM-DD HH:mm') : '');

/** 活动创建/编辑共享表单组件 */
export default function ActivityForm({ activityId, templateId }: ActivityFormProps) {
  const router = useRouter();
  const isEdit = !!activityId;
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 表单快照（用于 H5 预览/确认页实时联动）
  const [snap, setSnap] = useState<Record<string, unknown>>({});

  // H5 配置（v2 结构）
  const [h5Config, setH5Config] = useState<H5Config>(() => createDefaultH5Config());

  // 编辑模式加载数据
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      apiGet<Record<string, unknown>>(`/activities/${activityId}`).then((res) => {
        if (res.success && res.data) {
          const d = res.data as Record<string, unknown>;
          const vals: Record<string, unknown> = {
            title: d.title,
            type: d.type,
            category: d.category,
            start_time: toDayjs(d.start_time),
            end_time: toDayjs(d.end_time),
            location: d.location,
            description: d.description || '',
            visibility: d.visibility,
            max_participants: d.max_participants,
            registration_start: toDayjs(d.registration_start),
            registration_end: toDayjs(d.registration_end),
            need_audit: d.need_audit,
            fee: d.fee,
          };
          form.setFieldsValue(vals);
          setSnap(vals);
          setH5Config(normalizeH5Config(d.h5Config));
        }
        setLoading(false);
      });
    }
  }, [isEdit, activityId, form]);

  // 创建模式：默认值 + 模板预填
  useEffect(() => {
    if (isEdit) return;
    const defaults = {
      type: '线下活动',
      category: 'other',
      visibility: 'member',
      need_audit: false,
      fee: 0,
    };
    form.setFieldsValue(defaults);
    setSnap((prev) => ({ ...defaults, ...prev }));

    if (templateId) {
      apiGet<ActivityTemplate>('/activity-templates', { id: templateId }).then((res) => {
        if (res.success && res.data) {
          const tpl = res.data;
          const vals = {
            title: tpl.prefill.title,
            type: tpl.prefill.type,
            category: tpl.prefill.category,
            description: tpl.prefill.description,
            location: tpl.prefill.location || '',
          };
          form.setFieldsValue(vals);
          setSnap((prev) => ({ ...prev, ...vals }));
          setH5Config(normalizeH5Config(tpl.h5Config));
          Message.success(`已应用模板「${tpl.name}」，可按需调整`);
        }
      });
    }
  }, [isEdit, templateId, form]);

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
      const payload = {
        ...values,
        start_time: fmtDT(values.start_time),
        end_time: fmtDT(values.end_time),
        registration_start: fmtDT(values.registration_start) ?? null,
        registration_end: fmtDT(values.registration_end) ?? null,
        h5_config: JSON.stringify(h5Config),
      };

      const res = isEdit
        ? await apiPut(`/activities/${activityId}`, payload)
        : await apiPost('/activities', payload);
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

  /* ---------------- 渲染 ---------------- */

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
        <Spin size={40} />
      </div>
    );
  }

  const previewInfo: PreviewActivityInfo = {
    title: snap.title as string | undefined,
    timeText:
      snap.start_time && snap.end_time
        ? `${fmtShort(snap.start_time)} ~ ${fmtShort(snap.end_time)}`
        : '',
    location: snap.location as string | undefined,
    feeText: snap.fee ? `HKD ${snap.fee}` : '免费',
    description: snap.description as string | undefined,
  };

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav
        items={[
          { title: '活动管理' },
          { title: '活动列表', href: '/activities' },
          { title: isEdit ? '编辑活动' : '创建活动' },
        ]}
      />

      <div className="site-card" style={{ maxWidth: 1240, margin: '0 auto' }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Steps.Step title="基本信息" />
          <Steps.Step title="报名设置" />
          <Steps.Step title="H5 报名页配置" />
          <Steps.Step title="确认提交" />
        </Steps>

        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          onValuesChange={(_, values) => setSnap(values)}
        >
          {/* Step 1: 基本信息 */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Form.Item field="title" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
              <Input placeholder="请输入活动名称" maxLength={100} showWordLimit />
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
              <Form.Item
                field="start_time"
                label="活动开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
                style={{ flex: 1 }}
              >
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="选择开始时间" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                field="end_time"
                label="活动结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
                style={{ flex: 1 }}
              >
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="选择结束时间" style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item field="location" label="活动地点" rules={[{ required: true, message: '请输入活动地点' }]}>
              <Input placeholder="请输入活动地点" maxLength={100} showWordLimit />
            </Form.Item>
            <Form.Item field="description" label="活动描述">
              <Input.TextArea
                placeholder="请输入活动描述"
                maxLength={1000}
                showWordLimit
                autoSize={{ minRows: 4, maxRows: 8 }}
              />
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
          </div>

          {/* Step 2: 报名设置 */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item field="registration_start" label="报名开始时间" style={{ flex: 1 }}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="选择报名开始时间" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item field="registration_end" label="报名结束时间" style={{ flex: 1 }}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="选择报名结束时间" style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item field="max_participants" label="人数上限">
              <InputNumber placeholder="不限" min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item field="need_audit" label="是否需要审核" triggerPropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>

          {/* Step 3: H5 报名页配置（三栏拖拽搭建器） */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <H5FormBuilder value={h5Config} onChange={setH5Config} activity={previewInfo} />
          </div>

          {/* Step 4: 确认信息 */}
          <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
            <Card title="请确认以下信息" style={{ borderRadius: 8 }}>
              <div style={{ lineHeight: 2.2 }}>
                <p><strong>活动名称：</strong>{snap.title as string}</p>
                <p><strong>活动类型：</strong>{snap.type as string}</p>
                <p><strong>活动分类：</strong>{(snap.category as string) || '-'}</p>
                <p><strong>开放度：</strong>{snap.visibility === 'public' ? '公开活动' : '会员专属'}</p>
                <p><strong>费用：</strong>{snap.fee ? `HKD ${snap.fee}` : '免费'}</p>
                <p><strong>开始时间：</strong>{fmtShort(snap.start_time)}</p>
                <p><strong>结束时间：</strong>{fmtShort(snap.end_time)}</p>
                <p><strong>活动地点：</strong>{snap.location as string}</p>
                <p><strong>活动描述：</strong>{(snap.description as string) || '-'}</p>
                <p><strong>人数上限：</strong>{(snap.max_participants as number) || '不限'}</p>
                <p><strong>报名时间：</strong>
                  {snap.registration_start ? fmtShort(snap.registration_start) : '不限'}
                  {' ~ '}
                  {snap.registration_end ? fmtShort(snap.registration_end) : '不限'}
                </p>
                <p><strong>需要审核：</strong>{snap.need_audit ? '是' : '否'}</p>
                <Divider style={{ margin: '12px 0' }} />
                <p><strong>H5 报名页：</strong></p>
                <p style={{ paddingLeft: 16 }}>
                  表单字段：{h5Config.fields.filter((f) => !DISPLAY_TYPES.has(f.type)).map((f) => f.label).join('、') || '无'}
                </p>
                <p style={{ paddingLeft: 16 }}>
                  页面组件：共 {h5Config.fields.length} 个
                  （含 {h5Config.fields.filter((f) => DISPLAY_TYPES.has(f.type)).length} 个展示/布局组件）
                </p>
                <p style={{ paddingLeft: 16 }}>
                  主题色：<span style={{
                    display: 'inline-block', width: 14, height: 14,
                    background: h5Config.style.themeColor, borderRadius: 3,
                    verticalAlign: 'middle', marginRight: 4,
                  }} />
                  {h5Config.style.themeColor}
                  {h5Config.style.bgImage && <span style={{ marginLeft: 12 }}>已设置页面背景图</span>}
                </p>
                <p style={{ paddingLeft: 16 }}>欢迎语：{h5Config.style.welcomeText}</p>
                <p style={{ paddingLeft: 16 }}>报名按钮：{h5Config.style.buttonText}</p>
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
