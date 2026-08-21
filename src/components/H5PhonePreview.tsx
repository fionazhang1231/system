'use client';

import { IconMobile, IconCheck } from '@arco-design/web-react/icon';
import type { H5Config, H5Field } from '@/lib/h5-config';

export interface PreviewActivityInfo {
  title?: string;
  timeText?: string;
  location?: string;
  feeText?: string;
  description?: string;
}

/** 单个表单字段的预览渲染 */
function FieldPreview({ field }: { field: H5Field }) {
  const label = (
    <div style={{ fontSize: 12, color: '#4E5969', marginBottom: 4 }}>
      {field.label}
      {field.required && <span style={{ color: '#F53F3F' }}> *</span>}
    </div>
  );

  const inputBox = (text: string, extra?: React.ReactNode, height = 32) => (
    <div
      style={{
        height,
        lineHeight: `${height}px`,
        padding: '0 10px',
        background: '#fff',
        border: '1px solid #E5E6EB',
        borderRadius: 4,
        fontSize: 12,
        color: '#86909C',
        marginBottom: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
      {extra}
    </div>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <div key={field.key}>
          {label}
          {inputBox(field.placeholder || `请输入${field.label}`, undefined, 52)}
        </div>
      );
    case 'radio':
      return (
        <div key={field.key} style={{ marginBottom: 10 }}>
          {label}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(field.options || []).map((opt) => (
              <span key={opt} style={{ fontSize: 12, color: '#4E5969', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid #C9CDD4', display: 'inline-block' }} />
                {opt}
              </span>
            ))}
          </div>
        </div>
      );
    case 'checkbox':
      return (
        <div key={field.key} style={{ marginBottom: 10 }}>
          {label}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(field.options || []).map((opt) => (
              <span key={opt} style={{ fontSize: 12, color: '#4E5969', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, border: '1px solid #C9CDD4', display: 'inline-block' }} />
                {opt}
              </span>
            ))}
          </div>
        </div>
      );
    case 'select':
      return (
        <div key={field.key}>
          {label}
          {inputBox(field.placeholder || `请选择${field.label}`, <span style={{ fontSize: 10 }}>▼</span>)}
        </div>
      );
    case 'date':
      return (
        <div key={field.key}>
          {label}
          {inputBox(field.placeholder || `请选择${field.label}`, <span>📅</span>)}
        </div>
      );
    default:
      return (
        <div key={field.key}>
          {label}
          {inputBox(field.placeholder || `请输入${field.label}`)}
        </div>
      );
  }
}

/** H5 报名页手机预览（表单模式 / 提交成功模式） */
export default function H5PhonePreview({
  config,
  activity,
  mode = 'form',
}: {
  config: H5Config;
  activity: PreviewActivityInfo;
  mode?: 'form' | 'success';
}) {
  const { style, submit, fields } = config;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 8, color: '#86909C', fontSize: 13 }}>
        <IconMobile style={{ marginRight: 4 }} />
        H5 页面预览{mode === 'success' ? '（提交成功后）' : ''}
      </div>
      <div
        style={{
          width: 280,
          margin: '0 auto',
          borderRadius: 24,
          border: '3px solid #1D2129',
          overflow: 'hidden',
          background: style.bgColor,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* 手机状态栏 */}
        <div
          style={{
            background: style.themeColor,
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#fff', fontSize: 11 }}>9:41</span>
          <span style={{ color: '#fff', fontSize: 11 }}>活动报名</span>
          <span style={{ color: '#fff', fontSize: 11 }}>...</span>
        </div>

        {/* 欢迎语区域 */}
        <div style={{ background: style.themeColor, padding: '20px 16px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            {style.welcomeText || '欢迎参加本次活动'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 }}>
            {activity.title || '活动名称'}
          </div>
        </div>

        {mode === 'form' ? (
          <>
            {/* 活动信息 */}
            <div style={{ padding: 16 }}>
              {style.showTime && (
                <div style={{ fontSize: 12, color: '#4E5969', marginBottom: 8 }}>
                  🕐 {activity.timeText || '时间待定'}
                </div>
              )}
              {style.showLocation && (
                <div style={{ fontSize: 12, color: '#4E5969', marginBottom: 8 }}>
                  📍 {activity.location || '地点待定'}
                </div>
              )}
              {style.showFee && (
                <div style={{ fontSize: 12, color: '#4E5969', marginBottom: 8 }}>
                  💰 {activity.feeText || '免费'}
                </div>
              )}
              {style.showDesc && activity.description && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#86909C',
                    marginTop: 8,
                    lineHeight: 1.6,
                    maxHeight: 60,
                    overflow: 'hidden',
                  }}
                >
                  {activity.description}
                </div>
              )}
            </div>

            {/* 报名表单 */}
            <div style={{ padding: '0 16px 16px' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: `2px solid ${style.themeColor}`,
                }}
              >
                报名信息
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {fields.map((f) => (
                  <FieldPreview key={f.key} field={f} />
                ))}
              </div>
              <div
                style={{
                  height: 36,
                  lineHeight: '36px',
                  textAlign: 'center',
                  background: style.themeColor,
                  color: '#fff',
                  borderRadius: 18,
                  fontSize: 14,
                  fontWeight: 500,
                  marginTop: 12,
                }}
              >
                {style.buttonText || '立即报名'}
              </div>
            </div>
          </>
        ) : (
          /* 提交成功页 */
          <div style={{ padding: '48px 20px', textAlign: 'center', minHeight: 320 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: style.themeColor,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCheck style={{ color: '#fff', fontSize: 28 }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 16, color: '#1D2129' }}>
              {submit.successTitle}
            </div>
            <div style={{ fontSize: 12, color: '#86909C', marginTop: 8, lineHeight: 1.6 }}>
              {submit.successDesc}
            </div>
            {submit.showShare && (
              <div
                style={{
                  height: 34,
                  lineHeight: '34px',
                  textAlign: 'center',
                  border: `1px solid ${style.themeColor}`,
                  color: style.themeColor,
                  borderRadius: 17,
                  fontSize: 13,
                  marginTop: 24,
                }}
              >
                分享给朋友
              </div>
            )}
            <div
              style={{
                height: 34,
                lineHeight: '34px',
                textAlign: 'center',
                background: style.themeColor,
                color: '#fff',
                borderRadius: 17,
                fontSize: 13,
                marginTop: 12,
              }}
            >
              返回
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
