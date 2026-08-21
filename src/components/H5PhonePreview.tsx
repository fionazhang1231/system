'use client';

import React from 'react';
import { IconMobile, IconCheck, IconArrowUp, IconArrowDown, IconDelete } from '@arco-design/web-react/icon';
import type { H5Config, H5Field } from '@/lib/h5-config';

export interface PreviewActivityInfo {
  title?: string;
  timeText?: string;
  location?: string;
  feeText?: string;
  description?: string;
}

/** 伪二维码图案（按 seed 确定性生成，避免 hydration 问题） */
function FakeQr({ seed, color }: { seed: string; color: string }) {
  const cells = 21;
  const size = 64;
  const cell = size / cells;
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= cells - 8 && y < 8) || (x < 8 && y >= cells - 8);
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      if (inFinder(x, y)) continue;
      if (rand() < 0.42) {
        rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={color} />);
      }
    }
  }
  const finder = (fx: number, fy: number) => (
    <g key={`f${fx}-${fy}`}>
      <rect x={fx * cell} y={fy * cell} width={7 * cell} height={7 * cell} fill={color} />
      <rect x={(fx + 1) * cell} y={(fy + 1) * cell} width={5 * cell} height={5 * cell} fill="#fff" />
      <rect x={(fx + 2) * cell} y={(fy + 2) * cell} width={3 * cell} height={3 * cell} fill={color} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: '#fff', borderRadius: 4 }}>
      {rects}
      {finder(0, 0)}
      {finder(cells - 7, 0)}
      {finder(0, cells - 7)}
    </svg>
  );
}

/** 单个表单字段的预览渲染 */
function FieldPreview({ field, themeColor }: { field: H5Field; themeColor: string }) {
  const label = (
    <div style={{ fontSize: 12, color: '#4E5969', marginBottom: 4 }}>
      {field.label}
      {field.required && <span style={{ color: '#F53F3F' }}> *</span>}
    </div>
  );
  const desc = field.description ? (
    <div style={{ fontSize: 10, color: '#86909C', marginTop: -2, marginBottom: 4 }}>{field.description}</div>
  ) : null;

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

  const dashedBox = (height: number, content: React.ReactNode) => (
    <div
      style={{
        height,
        border: '1px dashed #C9CDD4',
        borderRadius: 6,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: '#86909C',
        marginBottom: 10,
      }}
    >
      {content}
    </div>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          {label}
          {desc}
          {inputBox(field.placeholder || `请输入${field.label}`, undefined, 52)}
        </div>
      );
    case 'radio':
    case 'vote':
      return (
        <div style={{ marginBottom: 10 }}>
          {label}
          {desc}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(field.options || []).map((opt) => (
              <span key={opt} style={{ fontSize: 12, color: '#4E5969', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid #C9CDD4', background: '#fff', display: 'inline-block' }} />
                {opt}
              </span>
            ))}
          </div>
        </div>
      );
    case 'checkbox':
      return (
        <div style={{ marginBottom: 10 }}>
          {label}
          {desc}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(field.options || []).map((opt) => (
              <span key={opt} style={{ fontSize: 12, color: '#4E5969', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, border: '1px solid #C9CDD4', background: '#fff', display: 'inline-block' }} />
                {opt}
              </span>
            ))}
          </div>
        </div>
      );
    case 'select':
      return (
        <div>
          {label}
          {desc}
          {inputBox(field.placeholder || `请选择${field.label}`, <span style={{ fontSize: 10 }}>▼</span>)}
        </div>
      );
    case 'date':
      return (
        <div>
          {label}
          {desc}
          {inputBox(field.placeholder || `请选择${field.label}`, <span>📅</span>)}
        </div>
      );
    case 'address':
      return (
        <div>
          {label}
          {desc}
          {inputBox(field.placeholder || `请输入${field.label}`, <span>📍</span>)}
        </div>
      );
    case 'rate': {
      const max = field.maxScore || 5;
      return (
        <div style={{ marginBottom: 10 }}>
          {label}
          {desc}
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: max }).map((_, i) => (
              <span key={i} style={{ fontSize: 18, color: '#E5E6EB', lineHeight: 1 }}>★</span>
            ))}
          </div>
        </div>
      );
    }
    case 'attachment':
      return (
        <div>
          {label}
          {desc}
          {dashedBox(52, <span>📎 点击上传附件（图片 / 文件）</span>)}
        </div>
      );
    case 'signature':
      return (
        <div>
          {label}
          {desc}
          {dashedBox(64, <span>✍️ 点击此处手写签名</span>)}
        </div>
      );
    case 'section':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 10px' }}>
          <span style={{ width: 4, height: 14, borderRadius: 2, background: themeColor }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1D2129' }}>{field.label}</span>
        </div>
      );
    case 'divider':
      return <div style={{ borderTop: '1px solid #E5E6EB', margin: '6px 0 12px' }} />;
    case 'pagebreak':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 12px' }}>
          <span style={{ flex: 1, borderTop: '1px dashed #C9CDD4' }} />
          <span style={{ fontSize: 10, color: '#86909C' }}>分页</span>
          <span style={{ flex: 1, borderTop: '1px dashed #C9CDD4' }} />
        </div>
      );
    case 'qrcode':
      return (
        <div style={{ textAlign: 'center', margin: '4px 0 12px' }}>
          <FakeQr seed={field.key} color={themeColor} />
          <div style={{ fontSize: 10, color: '#86909C', marginTop: 4 }}>{field.text || '扫码查看'}</div>
        </div>
      );
    case 'share':
      return (
        <div
          style={{
            height: 32,
            lineHeight: '30px',
            textAlign: 'center',
            border: `1px solid ${themeColor}`,
            color: themeColor,
            borderRadius: 16,
            fontSize: 12,
            margin: '4px 0 12px',
            background: '#fff',
          }}
        >
          🔗 {field.text || '分享给好友'}
        </div>
      );
    default:
      return (
        <div>
          {label}
          {desc}
          {inputBox(field.placeholder || `请输入${field.label}`)}
        </div>
      );
  }
}

/** H5 报名页手机预览（表单模式 / 提交成功模式），可叠加搭建器选中态与拖拽插入指示 */
export default function H5PhonePreview({
  config,
  activity,
  mode = 'form',
  editable = false,
  selectedKey,
  dropIndicator = null,
  fieldListMaxHeight = 260,
  onSelectField,
  onMoveField,
  onDeleteField,
  onFieldDragStart,
}: {
  config: H5Config;
  activity: PreviewActivityInfo;
  mode?: 'form' | 'success';
  /** 搭建器编辑模式：字段可点选、显示插入指示线 */
  editable?: boolean;
  selectedKey?: string | null;
  /** 拖拽插入位置（在该下标字段之前插入，等于字段数表示末尾） */
  dropIndicator?: number | null;
  fieldListMaxHeight?: number;
  onSelectField?: (key: string) => void;
  onMoveField?: (key: string, dir: -1 | 1) => void;
  onDeleteField?: (key: string) => void;
  onFieldDragStart?: (e: React.DragEvent, index: number) => void;
}) {
  const { style, submit, fields } = config;

  // 页面背景：背景图优先，其次纯色；bgFixed=false 时背景画在滚动内容上模拟"随内容滚动"
  const pageBgImage: React.CSSProperties = style.bgImage
    ? { backgroundImage: `url(${style.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};
  const pageBgColor: React.CSSProperties = { background: style.bgColor };
  const outerBg = style.bgImage && style.bgFixed ? pageBgImage : style.bgImage ? pageBgColor : pageBgColor;
  const innerBg = style.bgImage && !style.bgFixed ? pageBgImage : {};

  // 表头区背景：背景图 > 自定义色 > 跟随主题色
  const headerBg: React.CSSProperties = style.headerBgImage
    ? { backgroundImage: `url(${style.headerBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: style.headerBgColor || style.themeColor };

  const dropLine = (
    <div style={{ height: 0, borderTop: `2px solid ${style.themeColor}`, margin: '2px -4px', borderRadius: 2 }} />
  );

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
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          ...outerBg,
        }}
      >
        {/* 手机状态栏 */}
        <div
          style={{
            ...headerBg,
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

        {/* 欢迎语区域（表头区） */}
        <div style={{ ...headerBg, padding: '20px 16px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
            {style.welcomeText || '欢迎参加本次活动'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            {activity.title || '活动名称'}
          </div>
        </div>

        {mode === 'form' ? (
          <>
            {/* 活动信息 */}
            <div style={{ padding: 16, background: style.bgImage ? 'rgba(255,255,255,0.88)' : 'transparent', margin: style.bgImage ? '0 10px' : 0, borderRadius: style.bgImage ? 8 : 0 }}>
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
                  color: style.bgImage ? '#1D2129' : undefined,
                  textShadow: style.bgImage ? '0 1px 2px rgba(255,255,255,0.6)' : undefined,
                }}
              >
                报名信息
              </div>
              <div style={{ maxHeight: fieldListMaxHeight, overflowY: 'auto', ...innerBg }}>
                {fields.map((f, idx) => {
                  const selected = editable && selectedKey === f.key;
                  return (
                    <React.Fragment key={f.key}>
                      {editable && dropIndicator === idx && dropLine}
                      <div
                        data-field-index={idx}
                        draggable={editable}
                        onDragStart={editable ? (e) => onFieldDragStart?.(e, idx) : undefined}
                        onClick={
                          editable
                            ? (e) => {
                                e.stopPropagation();
                                onSelectField?.(f.key);
                              }
                            : undefined
                        }
                        style={{
                          position: 'relative',
                          padding: editable ? '4px 6px' : 0,
                          margin: editable ? '0 -6px' : 0,
                          borderRadius: 6,
                          cursor: editable ? 'pointer' : 'default',
                          outline: selected ? `2px solid ${style.themeColor}` : '2px solid transparent',
                          outlineOffset: 1,
                          background: selected ? 'rgba(22,119,255,0.06)' : 'transparent',
                          transition: 'outline-color 0.15s',
                        }}
                      >
                        <FieldPreview field={f} themeColor={style.themeColor} />
                        {selected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: -12,
                              right: 0,
                              display: 'flex',
                              gap: 2,
                              background: '#fff',
                              borderRadius: 4,
                              boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
                              padding: '2px 4px',
                              zIndex: 5,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconArrowUp
                              style={{ fontSize: 13, cursor: 'pointer', color: '#4E5969' }}
                              onClick={() => onMoveField?.(f.key, -1)}
                            />
                            <IconArrowDown
                              style={{ fontSize: 13, cursor: 'pointer', color: '#4E5969' }}
                              onClick={() => onMoveField?.(f.key, 1)}
                            />
                            {!f.locked && (
                              <IconDelete
                                style={{ fontSize: 13, cursor: 'pointer', color: '#F53F3F' }}
                                onClick={() => onDeleteField?.(f.key)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                {editable && dropIndicator === fields.length && dropLine}
                {editable && fields.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#86909C', fontSize: 12, padding: '24px 0' }}>
                    从左侧拖入或点击添加组件
                  </div>
                )}
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
          <div style={{ padding: '48px 20px', textAlign: 'center', minHeight: 320, ...innerBg }}>
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
                  background: '#fff',
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
