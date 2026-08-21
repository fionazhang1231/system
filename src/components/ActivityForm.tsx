'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import {
  Form, Input, Select, InputNumber, Switch, Button, Message, Steps, Space, Card, Spin,
  Tabs, Tag, Divider, Modal, DatePicker,
} from '@arco-design/web-react';
import {
  IconCheck, IconPlus, IconEdit, IconDelete, IconArrowUp, IconArrowDown, IconLock,
} from '@arco-design/web-react/icon';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import {
  H5Config, H5Field, FieldLibItem, createDefaultH5Config, normalizeH5Config,
  FIELD_LIBRARY, FIELD_TYPE_NAMES, THEME_COLORS, BG_COLORS,
} from '@/lib/h5-config';
import H5PhonePreview, { PreviewActivityInfo } from '@/components/H5PhonePreview';
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
  const [h5Tab, setH5Tab] = useState<'fields' | 'style' | 'submit'>('fields');

  // 字段编辑弹窗
  const [editIdx, setEditIdx] = useState(-1);
  const [draft, setDraft] = useState<H5Field | null>(null);

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

  /* ---------------- H5 字段操作 ---------------- */

  const setFields = (fields: H5Field[]) => setH5Config((prev) => ({ ...prev, fields }));

  const addField = (item: FieldLibItem) => {
    // 字段名去重
    const labels = h5Config.fields.map((f) => f.label);
    let label = item.label;
    let n = 2;
    while (labels.includes(label)) { label = `${item.label}${n}`; n += 1; }
    const verb = item.type === 'select' || item.type === 'date' ? '请选择' : '请输入';
    const field: H5Field = {
      key: `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      type: item.type,
      placeholder: item.type === 'radio' || item.type === 'checkbox' ? undefined : `${verb}${label}`,
      required: false,
      options: item.options ? [...item.options] : undefined,
    };
    setFields([...h5Config.fields, field]);
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const fields = [...h5Config.fields];
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    [fields[idx], fields[target]] = [fields[target], fields[idx]];
    setFields(fields);
  };

  const removeField = (idx: number) => {
    setFields(h5Config.fields.filter((_, i) => i !== idx));
  };

  const toggleRequired = (idx: number, required: boolean) => {
    const fields = h5Config.fields.map((f, i) => (i === idx ? { ...f, required } : f));
    setFields(fields);
  };

  const openFieldEditor = (idx: number) => {
    const f = h5Config.fields[idx];
    setEditIdx(idx);
    setDraft({ ...f, options: f.options ? [...f.options] : undefined });
  };

  const saveField = () => {
    if (!draft) return;
    if (!draft.label.trim()) {
      Message.warning('字段名称不能为空');
      return;
    }
    if (['radio', 'checkbox', 'select'].includes(draft.type)) {
      const opts = (draft.options || []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        Message.warning('选择类字段至少需要 2 个选项');
        return;
      }
      draft.options = opts;
    }
    setFields(h5Config.fields.map((f, i) => (i === editIdx ? { ...draft } : f)));
    setEditIdx(-1);
    setDraft(null);
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

      <div className="site-card" style={{ maxWidth: 1000, margin: '0 auto' }}>
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

          {/* Step 3: H5 报名页配置（表单搭建器） */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {/* 左侧：配置面板 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Tabs activeTab={h5Tab} onChange={(k) => setH5Tab(k as typeof h5Tab)}>
                  <Tabs.TabPane key="fields" title="表单字段" />
                  <Tabs.TabPane key="style" title="页面样式" />
                  <Tabs.TabPane key="submit" title="提交设置" />
                </Tabs>

                {/* 表单字段搭建 */}
                {h5Tab === 'fields' && (
                  <div>
                    <div style={{ marginBottom: 8, color: '#86909C', fontSize: 13 }}>
                      点击左侧字段可编辑名称、占位提示与选项；姓名/手机号为系统锁定必填项
                    </div>
                    <div style={{ border: '1px solid #E5E6EB', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
                      {h5Config.fields.map((f, idx) => (
                        <div
                          key={f.key}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                            borderBottom: idx === h5Config.fields.length - 1 ? 'none' : '1px solid #F2F3F5',
                            background: '#fff',
                          }}
                        >
                          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.label}
                            </span>
                            {f.locked && <IconLock style={{ color: '#86909C', fontSize: 12 }} />}
                            <Tag size="small" color="arcoblue">{FIELD_TYPE_NAMES[f.type]}</Tag>
                          </span>
                          <span style={{ fontSize: 12, color: '#86909C' }}>必填</span>
                          <Switch
                            size="small"
                            checked={f.required}
                            disabled={f.locked}
                            onChange={(v) => toggleRequired(idx, v)}
                          />
                          <Button type="text" size="mini" icon={<IconArrowUp />} disabled={idx === 0} onClick={() => moveField(idx, -1)} />
                          <Button type="text" size="mini" icon={<IconArrowDown />} disabled={idx === h5Config.fields.length - 1} onClick={() => moveField(idx, 1)} />
                          <Button type="text" size="mini" icon={<IconEdit />} onClick={() => openFieldEditor(idx)} />
                          <Button
                            type="text" size="mini" status="danger" icon={<IconDelete />}
                            disabled={f.locked} onClick={() => removeField(idx)}
                          />
                        </div>
                      ))}
                    </div>

                    <Divider orientation="left" style={{ marginTop: 0 }}>添加字段</Divider>
                    {FIELD_LIBRARY.map((g) => (
                      <div key={g.group} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, color: '#86909C', marginBottom: 8 }}>{g.group}</div>
                        <Space wrap size={8}>
                          {g.items.map((item) => (
                            <Button key={item.label} size="small" icon={<IconPlus />} onClick={() => addField(item)}>
                              {item.label}
                            </Button>
                          ))}
                        </Space>
                      </div>
                    ))}
                  </div>
                )}

                {/* 页面样式 */}
                {h5Tab === 'style' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>主题色</div>
                      <Space wrap size={8}>
                        {THEME_COLORS.map((c) => (
                          <div
                            key={c.value}
                            onClick={() => setH5Config((p) => ({ ...p, style: { ...p.style, themeColor: c.value } }))}
                            style={{
                              width: 32, height: 32, borderRadius: 6,
                              backgroundColor: c.value, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: h5Config.style.themeColor === c.value ? '2px solid #1D2129' : '2px solid transparent',
                            }}
                          >
                            {h5Config.style.themeColor === c.value && <IconCheck style={{ color: '#fff', fontSize: 16 }} />}
                          </div>
                        ))}
                        <Input
                          value={h5Config.style.themeColor}
                          onChange={(v) => setH5Config((p) => ({ ...p, style: { ...p.style, themeColor: v } }))}
                          placeholder="#1677FF"
                          maxLength={7}
                          style={{ width: 110 }}
                        />
                      </Space>
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>页面背景色</div>
                      <Space wrap size={8}>
                        {BG_COLORS.map((c) => (
                          <div
                            key={c}
                            onClick={() => setH5Config((p) => ({ ...p, style: { ...p.style, bgColor: c } }))}
                            style={{
                              width: 32, height: 32, borderRadius: 6,
                              backgroundColor: c, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: h5Config.style.bgColor === c ? '2px solid #1D2129' : '1px solid #E5E6EB',
                            }}
                          >
                            {h5Config.style.bgColor === c && <IconCheck style={{ color: '#1D2129', fontSize: 14 }} />}
                          </div>
                        ))}
                      </Space>
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>欢迎语</div>
                      <Input
                        value={h5Config.style.welcomeText}
                        onChange={(v) => setH5Config((p) => ({ ...p, style: { ...p.style, welcomeText: v } }))}
                        placeholder="H5 页面顶部欢迎语"
                        maxLength={30}
                        showWordLimit
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>报名按钮文字</div>
                      <Input
                        value={h5Config.style.buttonText}
                        onChange={(v) => setH5Config((p) => ({ ...p, style: { ...p.style, buttonText: v } }))}
                        placeholder="立即报名"
                        maxLength={10}
                        showWordLimit
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {([
                        ['showTime', '显示活动时间'],
                        ['showLocation', '显示活动地点'],
                        ['showFee', '显示费用信息'],
                        ['showDesc', '显示活动描述'],
                      ] as const).map(([key, label]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{label}</span>
                          <Switch
                            size="small"
                            checked={h5Config.style[key]}
                            onChange={(v) => setH5Config((p) => ({ ...p, style: { ...p.style, [key]: v } }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 提交设置 */}
                {h5Tab === 'submit' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ color: '#86909C', fontSize: 13 }}>
                      配置用户提交报名后看到的成功页面，右侧预览已切换为提交成功效果
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>成功提示标题</div>
                      <Input
                        value={h5Config.submit.successTitle}
                        onChange={(v) => setH5Config((p) => ({ ...p, submit: { ...p.submit, successTitle: v } }))}
                        placeholder="报名成功！"
                        maxLength={30}
                        showWordLimit
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>成功提示描述</div>
                      <Input.TextArea
                        value={h5Config.submit.successDesc}
                        onChange={(v) => setH5Config((p) => ({ ...p, submit: { ...p.submit, successDesc: v } }))}
                        placeholder="我们已收到您的报名信息，请留意后续通知"
                        maxLength={100}
                        showWordLimit
                        autoSize={{ minRows: 2, maxRows: 4 }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>显示"分享给朋友"按钮</span>
                      <Switch
                        size="small"
                        checked={h5Config.submit.showShare}
                        onChange={(v) => setH5Config((p) => ({ ...p, submit: { ...p.submit, showShare: v } }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：手机预览 */}
              <div style={{ width: 300, flexShrink: 0 }}>
                <H5PhonePreview
                  config={h5Config}
                  activity={previewInfo}
                  mode={h5Tab === 'submit' ? 'success' : 'form'}
                />
              </div>
            </div>
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
                  表单字段：{h5Config.fields.map((f) => f.label).join('、')}
                </p>
                <p style={{ paddingLeft: 16 }}>
                  主题色：<span style={{
                    display: 'inline-block', width: 14, height: 14,
                    background: h5Config.style.themeColor, borderRadius: 3,
                    verticalAlign: 'middle', marginRight: 4,
                  }} />
                  {h5Config.style.themeColor}
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

      {/* 字段编辑弹窗 */}
      <Modal
        title="编辑字段"
        visible={editIdx >= 0}
        onOk={saveField}
        onCancel={() => { setEditIdx(-1); setDraft(null); }}
        okText="保存"
        cancelText="取消"
        autoFocus={false}
        style={{ width: 480 }}
      >
        {draft && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 6, fontWeight: 500 }}>
                字段名称
                {draft.locked && <span style={{ color: '#86909C', fontSize: 12, marginLeft: 8 }}>（系统字段不可修改名称）</span>}
              </div>
              <Input
                value={draft.label}
                disabled={draft.locked}
                maxLength={20}
                showWordLimit
                onChange={(v) => setDraft({ ...draft, label: v })}
              />
            </div>
            {draft.type !== 'radio' && draft.type !== 'checkbox' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 6, fontWeight: 500 }}>占位提示</div>
                <Input
                  value={draft.placeholder || ''}
                  maxLength={30}
                  showWordLimit
                  onChange={(v) => setDraft({ ...draft, placeholder: v })}
                />
              </div>
            )}
            {['radio', 'checkbox', 'select'].includes(draft.type) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 6, fontWeight: 500 }}>选项（至少 2 个，最多 10 个）</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(draft.options || []).map((opt, i) => (
                    <Space key={i}>
                      <Input
                        value={opt}
                        maxLength={20}
                        style={{ width: 280 }}
                        onChange={(v) => {
                          const options = [...(draft.options || [])];
                          options[i] = v;
                          setDraft({ ...draft, options });
                        }}
                      />
                      <Button
                        type="text"
                        status="danger"
                        size="small"
                        icon={<IconDelete />}
                        disabled={(draft.options || []).length <= 2}
                        onClick={() => {
                          const options = (draft.options || []).filter((_, j) => j !== i);
                          setDraft({ ...draft, options });
                        }}
                      />
                    </Space>
                  ))}
                  <Button
                    type="text"
                    size="small"
                    icon={<IconPlus />}
                    disabled={(draft.options || []).length >= 10}
                    onClick={() => setDraft({ ...draft, options: [...(draft.options || []), `选项${(draft.options || []).length + 1}`] })}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    添加选项
                  </Button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>是否必填</span>
              <Switch
                checked={draft.required}
                disabled={draft.locked}
                onChange={(v) => setDraft({ ...draft, required: v })}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
