'use client';
import React, { useState, useMemo } from 'react';
import type { H5Config, H5Field } from '@/lib/h5-config';
import { DISPLAY_TYPES } from '@/lib/h5-config';

export interface H5FormActivityInfo {
  title?: string;
  timeText?: string;
  location?: string;
  feeText?: string;
  description?: string;
}

interface H5FormRendererProps {
  config: H5Config;
  activity: H5FormActivityInfo;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  submitting?: boolean;
}

type FormValues = Record<string, string | string[] | number>;

/**
 * H5 报名表单渲染器（可交互版本）
 * 基于 H5Config 渲染真实表单，支持值管理与必填校验
 */
export default function H5FormRenderer({
  config,
  activity,
  onSubmit,
  submitting = false,
}: H5FormRendererProps) {
  const { style, submit, fields } = config;
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化默认值
  const initialValues = useMemo(() => {
    const init: FormValues = {};
    fields.forEach((f) => {
      if (f.type === 'checkbox') init[f.key] = [];
      else if (f.type === 'rate') init[f.key] = 0;
      else init[f.key] = '';
    });
    return init;
  }, [fields]);

  const setFieldValue = (key: string, value: string | string[] | number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // 校验表单
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      if (DISPLAY_TYPES.has(f.type)) return; // 展示类组件不校验
      if (f.required) {
        const val = values[f.key] ?? initialValues[f.key];
        if (f.type === 'checkbox') {
          if (!Array.isArray(val) || val.length === 0) {
            newErrors[f.key] = `请选择${f.label}`;
          }
        } else if (f.type === 'rate') {
          if (!val || Number(val) === 0) {
            newErrors[f.key] = `请为${f.label}评分`;
          }
        } else {
          if (!val || String(val).trim() === '') {
            newErrors[f.key] = `请填写${f.label}`;
          }
        }
        // 手机号格式校验
        if (f.type === 'phone' && val && String(val).trim() !== '') {
          const phone = String(val).trim();
          if (!/^[0-9]{6,15}$/.test(phone)) {
            newErrors[f.key] = '请输入有效的手机号';
          }
        }
        // 邮箱格式校验
        if (f.type === 'email' && val && String(val).trim() !== '') {
          const email = String(val).trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors[f.key] = '请输入有效的邮箱地址';
          }
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // 合并初始值和用户输入值
    const merged: Record<string, unknown> = { ...initialValues, ...values };
    await onSubmit(merged);
  };

  // 页面背景
  const pageBgStyle: React.CSSProperties = style.bgImage
    ? {
        backgroundImage: `url(${style.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: style.bgFixed ? 'fixed' : 'scroll',
      }
    : { background: style.bgColor };

  // 表头背景
  const headerBgStyle: React.CSSProperties = style.headerBgImage
    ? {
        backgroundImage: `url(${style.headerBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: style.headerBgColor || style.themeColor };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${hasError ? '#F53F3F' : '#E5E6EB'}`,
    borderRadius: 6,
    fontSize: 14,
    color: '#1D2129',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#4E5969',
    marginBottom: 6,
    display: 'block',
    fontWeight: 500,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#F53F3F',
    marginTop: 4,
  };

  const fieldWrapperStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  // 渲染单个字段
  const renderField = (field: H5Field) => {
    const val = values[field.key] ?? initialValues[field.key];
    const hasError = !!errors[field.key];

    // 展示类组件
    if (field.type === 'section') {
      return (
        <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0 12px' }}>
          <span style={{ width: 4, height: 16, borderRadius: 2, background: style.themeColor }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1D2129' }}>{field.label}</span>
        </div>
      );
    }
    if (field.type === 'divider') {
      return <div key={field.key} style={{ borderTop: '1px solid #E5E6EB', margin: '8px 0 16px' }} />;
    }
    if (field.type === 'pagebreak') {
      return (
        <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 16px' }}>
          <span style={{ flex: 1, borderTop: '1px dashed #C9CDD4' }} />
          <span style={{ fontSize: 11, color: '#86909C' }}>分页</span>
          <span style={{ flex: 1, borderTop: '1px dashed #C9CDD4' }} />
        </div>
      );
    }
    if (field.type === 'qrcode') {
      return (
        <div key={field.key} style={{ textAlign: 'center', margin: '8px 0 16px' }}>
          <div style={{ width: 80, height: 80, background: '#f0f0f0', borderRadius: 6, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#86909C' }}>
            二维码
          </div>
          <div style={{ fontSize: 12, color: '#86909C', marginTop: 4 }}>{field.text || '扫码查看'}</div>
        </div>
      );
    }
    if (field.type === 'share') {
      return (
        <div
          key={field.key}
          style={{
            height: 36,
            lineHeight: '34px',
            textAlign: 'center',
            border: `1px solid ${style.themeColor}`,
            color: style.themeColor,
            borderRadius: 18,
            fontSize: 13,
            margin: '8px 0 16px',
            background: '#fff',
          }}
        >
          🔗 {field.text || '分享给好友'}
        </div>
      );
    }

    const labelEl = (
      <label style={labelStyle}>
        {field.label}
        {field.required && <span style={{ color: '#F53F3F', marginLeft: 2 }}> *</span>}
      </label>
    );
    const descEl = field.description ? (
      <div style={{ fontSize: 12, color: '#86909C', marginBottom: 6 }}>{field.description}</div>
    ) : null;
    const errorEl = hasError ? <div style={errorStyle}>{errors[field.key]}</div> : null;

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <textarea
              style={{ ...inputStyle(hasError), minHeight: 80, resize: 'vertical' }}
              placeholder={field.placeholder || `请输入${field.label}`}
              value={String(val || '')}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
            />
            {errorEl}
          </div>
        );
      case 'radio':
      case 'vote':
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(field.options || []).map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#4E5969', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={field.key}
                    value={opt}
                    checked={val === opt}
                    onChange={() => setFieldValue(field.key, opt)}
                    style={{ accentColor: style.themeColor }}
                  />
                  {opt}
                </label>
              ))}
            </div>
            {errorEl}
          </div>
        );
      case 'checkbox':
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(field.options || []).map((opt) => {
                const checked = Array.isArray(val) && val.includes(opt);
                return (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#4E5969', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      value={opt}
                      checked={checked}
                      onChange={(e) => {
                        const arr = Array.isArray(val) ? [...val] : [];
                        if (e.target.checked) arr.push(opt);
                        else {
                          const idx = arr.indexOf(opt);
                          if (idx > -1) arr.splice(idx, 1);
                        }
                        setFieldValue(field.key, arr);
                      }}
                      style={{ accentColor: style.themeColor }}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
            {errorEl}
          </div>
        );
      case 'select':
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <select
              style={inputStyle(hasError)}
              value={String(val || '')}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
            >
              <option value="">{field.placeholder || `请选择${field.label}`}</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errorEl}
          </div>
        );
      case 'date':
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <input
              type="date"
              style={inputStyle(hasError)}
              value={String(val || '')}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
            />
            {errorEl}
          </div>
        );
      case 'rate': {
        const max = field.maxScore || 5;
        const current = Number(val) || 0;
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: max }).map((_, i) => (
                <span
                  key={i}
                  onClick={() => setFieldValue(field.key, i + 1)}
                  style={{
                    fontSize: 24,
                    cursor: 'pointer',
                    color: i < current ? '#FF7D00' : '#E5E6EB',
                    lineHeight: 1,
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            {errorEl}
          </div>
        );
      }
      case 'number':
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <input
              type="number"
              style={inputStyle(hasError)}
              placeholder={field.placeholder || `请输入${field.label}`}
              value={String(val || '')}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
            />
            {errorEl}
          </div>
        );
      case 'attachment':
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <div
              style={{
                border: `1px dashed ${hasError ? '#F53F3F' : '#C9CDD4'}`,
                borderRadius: 6,
                padding: 16,
                textAlign: 'center',
                fontSize: 13,
                color: '#86909C',
                background: '#fff',
              }}
            >
              📎 点击上传附件（图片 / 文件）
              <input type="file" style={{ display: 'none' }} />
            </div>
            {errorEl}
          </div>
        );
      case 'signature':
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <div
              style={{
                border: `1px dashed ${hasError ? '#F53F3F' : '#C9CDD4'}`,
                borderRadius: 6,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: '#86909C',
                background: '#fff',
              }}
            >
              ✍️ 点击此处手写签名
            </div>
            {errorEl}
          </div>
        );
      case 'phone':
      case 'email':
      case 'text':
      case 'address':
      default:
        return (
          <div key={field.key} style={fieldWrapperStyle}>
            {labelEl}
            {descEl}
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              style={inputStyle(hasError)}
              placeholder={field.placeholder || `请输入${field.label}`}
              value={String(val || '')}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
            />
            {errorEl}
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', ...pageBgStyle }}>
      {/* 表头欢迎区 */}
      <div style={{ ...headerBgStyle, padding: '24px 20px 28px', textAlign: 'center' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
          {style.welcomeText || '欢迎参加本次活动'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          {activity.title || '活动名称'}
        </div>
      </div>

      {/* 活动信息 */}
      <div
        style={{
          padding: 16,
          background: style.bgImage ? 'rgba(255,255,255,0.92)' : '#fff',
          margin: style.bgImage ? '0 12px' : 0,
          borderRadius: style.bgImage ? 8 : 0,
        }}
      >
        {style.showTime && (
          <div style={{ fontSize: 13, color: '#4E5969', marginBottom: 8 }}>
            🕐 {activity.timeText || '时间待定'}
          </div>
        )}
        {style.showLocation && (
          <div style={{ fontSize: 13, color: '#4E5969', marginBottom: 8 }}>
            📍 {activity.location || '地点待定'}
          </div>
        )}
        {style.showFee && (
          <div style={{ fontSize: 13, color: '#4E5969', marginBottom: 8 }}>
            💰 {activity.feeText || '免费'}
          </div>
        )}
        {style.showDesc && activity.description && (
          <div style={{ fontSize: 13, color: '#86909C', marginTop: 8, lineHeight: 1.6 }}>
            {activity.description}
          </div>
        )}
      </div>

      {/* 报名表单 */}
      <form onSubmit={handleSubmit} style={{ padding: '16px 20px 24px' }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 16,
            paddingBottom: 8,
            borderBottom: `2px solid ${style.themeColor}`,
            color: '#1D2129',
          }}
        >
          报名信息
        </div>
        {fields.map(renderField)}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            height: 44,
            lineHeight: '44px',
            textAlign: 'center',
            background: submitting ? '#A9C6FF' : style.themeColor,
            color: '#fff',
            border: 'none',
            borderRadius: 22,
            fontSize: 16,
            fontWeight: 500,
            marginTop: 8,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? '提交中...' : style.buttonText || '立即报名'}
        </button>
      </form>
    </div>
  );
}
