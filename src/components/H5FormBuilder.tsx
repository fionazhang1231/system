'use client';

import React, { useRef, useState } from 'react';
import { Input, Switch, Button, Message, Radio, Tabs } from '@arco-design/web-react';
import {
  IconCheck, IconPlus, IconDelete, IconArrowUp, IconArrowDown, IconUpload, IconLock,
} from '@arco-design/web-react/icon';
import H5PhonePreview, { PreviewActivityInfo } from './H5PhonePreview';
import {
  H5Config, H5Field, FieldLibItem, createFieldFromLib,
  FIELD_LIBRARY, FIELD_TYPE_NAMES, THEME_COLORS, BG_COLORS, BUILTIN_BACKGROUNDS,
  DISPLAY_TYPES, OPTION_TYPES, PLACEHOLDER_TYPES, SINGLETON_LABELS,
} from '@/lib/h5-config';

const MAX_FIELDS = 20;

type DragPayload = { kind: 'lib'; item: FieldLibItem } | { kind: 'move'; index: number };

interface H5FormBuilderProps {
  value: H5Config;
  onChange: (config: H5Config) => void;
  activity: PreviewActivityInfo;
}

/**
 * H5 报名表三栏拖拽搭建器（参考麦客CRM）
 * 左侧：组件区（拖拽/点击添加） 中间：手机预览区（点选/拖拽排序/拖放插入） 右侧：组件规则与页面样式设置区
 */
export default function H5FormBuilder({ value, onChange, activity }: H5FormBuilderProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'field' | 'style' | 'submit'>('style');
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragPayload = useRef<DragPayload | null>(null);
  const middleRef = useRef<HTMLDivElement>(null);

  const fields = value.fields;

  /* ---------------- 基础操作 ---------------- */

  const setFields = (next: H5Field[]) => onChange({ ...value, fields: next });
  const patchStyle = (patch: Partial<H5Config['style']>) =>
    onChange({ ...value, style: { ...value.style, ...patch } });
  const patchSubmit = (patch: Partial<H5Config['submit']>) =>
    onChange({ ...value, submit: { ...value.submit, ...patch } });

  const addField = (item: FieldLibItem, at?: number) => {
    if (fields.length >= MAX_FIELDS) {
      Message.warning(`表单最多 ${MAX_FIELDS} 个组件`);
      return;
    }
    // 联系人唯一字段不可重复添加
    if (SINGLETON_LABELS.includes(item.label) && fields.some((f) => f.label === item.label)) {
      Message.info(`「${item.label}」已存在，无需重复添加`);
      return;
    }
    // 名称去重
    const labels = fields.map((f) => f.label);
    let label = item.label;
    let n = 2;
    while (labels.includes(label)) { label = `${item.label}${n}`; n += 1; }

    const field = createFieldFromLib(item, label);
    const next = [...fields];
    next.splice(at === undefined ? next.length : at, 0, field);
    setFields(next);
    setSelectedKey(field.key);
    setRightTab('field');
  };

  const updateField = (key: string, patch: Partial<H5Field>) => {
    setFields(fields.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  };

  const moveField = (key: string, dir: -1 | 1) => {
    const idx = fields.findIndex((f) => f.key === key);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next);
  };

  const removeField = (key: string) => {
    const f = fields.find((item) => item.key === key);
    if (f?.locked) return;
    setFields(fields.filter((item) => item.key !== key));
    if (selectedKey === key) setSelectedKey(null);
  };

  const reorderField = (from: number, to: number) => {
    const next = [...fields];
    const [moved] = next.splice(from, 1);
    let insertAt = to > from ? to - 1 : to;
    if (insertAt > next.length) insertAt = next.length;
    next.splice(insertAt, 0, moved);
    setFields(next);
  };

  /* ---------------- 拖拽 ---------------- */

  const handleMiddleDragOver = (e: React.DragEvent) => {
    if (!dragPayload.current) return;
    e.preventDefault();
    const target = (e.target as HTMLElement).closest('[data-field-index]') as HTMLElement | null;
    if (!target) {
      setDropIndex(fields.length);
      return;
    }
    const idx = Number(target.dataset.fieldIndex);
    const rect = target.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    setDropIndex(before ? idx : idx + 1);
  };

  const handleMiddleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const payload = dragPayload.current;
    dragPayload.current = null;
    const at = dropIndex === null ? fields.length : dropIndex;
    setDropIndex(null);
    if (!payload) return;
    if (payload.kind === 'lib') {
      addField(payload.item, at);
    } else {
      reorderField(payload.index, at);
    }
  };

  const handleMiddleDragLeave = (e: React.DragEvent) => {
    if (!middleRef.current?.contains(e.relatedTarget as Node)) {
      setDropIndex(null);
    }
  };

  /* ---------------- 图片上传 ---------------- */

  const pickImage = (cb: (dataUrl: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        Message.error('图片大小不能超过 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => cb(String(reader.result));
      reader.readAsDataURL(file);
    };
    input.click();
  };

  /* ---------------- 背景图选择器 ---------------- */

  const bgGallery = (current: string, onPick: (url: string) => void, onUpload: (url: string) => void) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {BUILTIN_BACKGROUNDS.map((bg) => (
          <div
            key={bg.key}
            onClick={() => onPick(bg.url)}
            title={bg.name}
            style={{
              height: 44,
              borderRadius: 6,
              backgroundImage: `url(${bg.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
              border: current === bg.url ? `2px solid ${value.style.themeColor}` : '2px solid transparent',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: '#fff',
                background: 'rgba(0,0,0,0.45)',
                width: '100%',
                textAlign: 'center',
                lineHeight: '16px',
              }}
            >
              {bg.name}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button size="small" icon={<IconUpload />} onClick={() => pickImage(onUpload)}>
          上传背景图
        </Button>
        {current && (
          <Button size="small" status="danger" type="text" onClick={() => onPick('')}>
            移除背景图
          </Button>
        )}
      </div>
      {current && !BUILTIN_BACKGROUNDS.some((b) => b.url === current) && (
        <div
          style={{
            marginTop: 8,
            height: 44,
            borderRadius: 6,
            backgroundImage: `url(${current})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: `2px solid ${value.style.themeColor}`,
          }}
        />
      )}
    </div>
  );

  /* ---------------- 右侧：组件设置 ---------------- */

  const selectedField = fields.find((f) => f.key === selectedKey) || null;
  const selectedIndex = fields.findIndex((f) => f.key === selectedKey);

  const fieldPanel = () => {
    if (!selectedField) {
      return (
        <div style={{ color: '#86909C', fontSize: 13, textAlign: 'center', padding: '48px 12px' }}>
          在中间预览区点击组件进行编辑
          <br />
          或从左侧组件区拖入新组件
        </div>
      );
    }
    const f = selectedField;
    const isDisplay = DISPLAY_TYPES.has(f.type);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          {FIELD_TYPE_NAMES[f.type]}
          {f.locked && (
            <span style={{ fontSize: 12, color: '#86909C', fontWeight: 400 }}>
              <IconLock style={{ fontSize: 12 }} /> 系统字段
            </span>
          )}
        </div>

        <div>
          <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>标题</div>
          <Input
            value={f.label}
            disabled={f.locked}
            maxLength={20}
            showWordLimit
            onChange={(v) => updateField(f.key, { label: v })}
          />
        </div>

        {f.type !== 'divider' && f.type !== 'pagebreak' && (
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>描述</div>
            <Input
              value={f.description || ''}
              placeholder="标题下方的辅助说明（选填）"
              maxLength={50}
              showWordLimit
              onChange={(v) => updateField(f.key, { description: v })}
            />
          </div>
        )}

        {PLACEHOLDER_TYPES.has(f.type) && (
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>占位提示</div>
            <Input
              value={f.placeholder || ''}
              maxLength={30}
              showWordLimit
              onChange={(v) => updateField(f.key, { placeholder: v })}
            />
          </div>
        )}

        {OPTION_TYPES.has(f.type) && (
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>选项（2-10 个）</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(f.options || []).map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <Input
                    value={opt}
                    maxLength={20}
                    onChange={(v) => {
                      const options = [...(f.options || [])];
                      options[i] = v;
                      updateField(f.key, { options });
                    }}
                  />
                  <Button
                    type="text"
                    status="danger"
                    size="small"
                    icon={<IconDelete />}
                    disabled={(f.options || []).length <= 2}
                    onClick={() => updateField(f.key, { options: (f.options || []).filter((_, j) => j !== i) })}
                  />
                </div>
              ))}
              <Button
                type="text"
                size="small"
                icon={<IconPlus />}
                disabled={(f.options || []).length >= 10}
                onClick={() => updateField(f.key, { options: [...(f.options || []), `选项${(f.options || []).length + 1}`] })}
                style={{ alignSelf: 'flex-start' }}
              >
                添加选项
              </Button>
            </div>
          </div>
        )}

        {f.type === 'rate' && (
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>最大分值</div>
            <Radio.Group
              type="button"
              value={f.maxScore || 5}
              onChange={(v) => updateField(f.key, { maxScore: v })}
              options={[
                { value: 5, label: '5 星' },
                { value: 10, label: '10 星' },
              ]}
            />
          </div>
        )}

        {(f.type === 'qrcode' || f.type === 'share') && (
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>展示文案</div>
            <Input
              value={f.text || ''}
              maxLength={20}
              showWordLimit
              onChange={(v) => updateField(f.key, { text: v })}
            />
          </div>
        )}

        {!isDisplay && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>必填项</span>
            <Switch
              size="small"
              checked={f.required}
              disabled={f.locked}
              onChange={(v) => updateField(f.key, { required: v })}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F2F3F5', paddingTop: 12 }}>
          <Button size="small" icon={<IconArrowUp />} disabled={selectedIndex <= 0} onClick={() => moveField(f.key, -1)}>
            上移
          </Button>
          <Button size="small" icon={<IconArrowDown />} disabled={selectedIndex === fields.length - 1} onClick={() => moveField(f.key, 1)}>
            下移
          </Button>
          <Button
            size="small"
            status="danger"
            icon={<IconDelete />}
            disabled={f.locked}
            onClick={() => removeField(f.key)}
          >
            删除
          </Button>
        </div>
      </div>
    );
  };

  /* ---------------- 右侧：页面样式 ---------------- */

  const headerMode = value.style.headerBgImage ? 'image' : value.style.headerBgColor ? 'custom' : 'theme';
  const pageBgMode = value.style.bgImage ? 'image' : 'color';

  const stylePanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>主题色</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {THEME_COLORS.map((c) => (
            <div
              key={c.value}
              onClick={() => patchStyle({ themeColor: c.value })}
              style={{
                width: 28, height: 28, borderRadius: 6, backgroundColor: c.value, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: value.style.themeColor === c.value ? '2px solid #1D2129' : '2px solid transparent',
              }}
            >
              {value.style.themeColor === c.value && <IconCheck style={{ color: '#fff', fontSize: 14 }} />}
            </div>
          ))}
          <Input
            value={value.style.themeColor}
            onChange={(v) => patchStyle({ themeColor: v })}
            placeholder="#1677FF"
            maxLength={7}
            style={{ width: 100 }}
            size="small"
          />
        </div>
      </div>

      <div>
        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>表头样式</div>
        <Radio.Group
          type="button"
          size="small"
          value={headerMode}
          onChange={(m) => {
            if (m === 'theme') patchStyle({ headerBgColor: '', headerBgImage: '' });
            if (m === 'custom') patchStyle({ headerBgColor: '#0FC6C2', headerBgImage: '' });
            if (m === 'image') patchStyle({ headerBgImage: BUILTIN_BACKGROUNDS[0].url });
          }}
          options={[
            { value: 'theme', label: '跟随主题色' },
            { value: 'custom', label: '自定义颜色' },
            { value: 'image', label: '背景图' },
          ]}
        />
        {headerMode === 'custom' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
            {THEME_COLORS.map((c) => (
              <div
                key={c.value}
                onClick={() => patchStyle({ headerBgColor: c.value })}
                style={{
                  width: 28, height: 28, borderRadius: 6, backgroundColor: c.value, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: value.style.headerBgColor === c.value ? '2px solid #1D2129' : '2px solid transparent',
                }}
              >
                {value.style.headerBgColor === c.value && <IconCheck style={{ color: '#fff', fontSize: 14 }} />}
              </div>
            ))}
            <Input
              value={value.style.headerBgColor}
              onChange={(v) => patchStyle({ headerBgColor: v })}
              maxLength={7}
              style={{ width: 100 }}
              size="small"
            />
          </div>
        )}
        {headerMode === 'image' && (
          <div style={{ marginTop: 8 }}>
            {bgGallery(
              value.style.headerBgImage,
              (url) => patchStyle({ headerBgImage: url }),
              (url) => patchStyle({ headerBgImage: url }),
            )}
          </div>
        )}
      </div>

      <div>
        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>页面背景</div>
        <Radio.Group
          type="button"
          size="small"
          value={pageBgMode}
          onChange={(m) => {
            if (m === 'color') patchStyle({ bgImage: '' });
            if (m === 'image') patchStyle({ bgImage: BUILTIN_BACKGROUNDS[0].url });
          }}
          options={[
            { value: 'color', label: '纯色' },
            { value: 'image', label: '背景图' },
          ]}
        />
        {pageBgMode === 'color' ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {BG_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => patchStyle({ bgColor: c })}
                style={{
                  width: 28, height: 28, borderRadius: 6, backgroundColor: c, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: value.style.bgColor === c && !value.style.bgImage ? '2px solid #1D2129' : '1px solid #E5E6EB',
                }}
              >
                {value.style.bgColor === c && !value.style.bgImage && <IconCheck style={{ color: '#1D2129', fontSize: 12 }} />}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {bgGallery(
              value.style.bgImage,
              (url) => patchStyle({ bgImage: url }),
              (url) => patchStyle({ bgImage: url }),
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 13 }}>背景不随表单滚动</span>
              <Switch size="small" checked={value.style.bgFixed} onChange={(v) => patchStyle({ bgFixed: v })} />
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>欢迎语</div>
        <Input
          value={value.style.welcomeText}
          onChange={(v) => patchStyle({ welcomeText: v })}
          placeholder="H5 页面顶部欢迎语"
          maxLength={30}
          showWordLimit
        />
      </div>
      <div>
        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>报名按钮文字</div>
        <Input
          value={value.style.buttonText}
          onChange={(v) => patchStyle({ buttonText: v })}
          placeholder="立即报名"
          maxLength={10}
          showWordLimit
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {([
          ['showTime', '显示活动时间'],
          ['showLocation', '显示活动地点'],
          ['showFee', '显示费用信息'],
          ['showDesc', '显示活动描述'],
        ] as const).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13 }}>{label}</span>
            <Switch
              size="small"
              checked={value.style[key]}
              onChange={(v) => patchStyle({ [key]: v } as Partial<H5Config['style']>)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  /* ---------------- 右侧：提交设置 ---------------- */

  const submitPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: '#86909C', fontSize: 12 }}>
        配置用户提交报名后看到的成功页面，中间预览已切换为提交成功效果
      </div>
      <div>
        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>成功提示标题</div>
        <Input
          value={value.submit.successTitle}
          onChange={(v) => patchSubmit({ successTitle: v })}
          placeholder="报名成功！"
          maxLength={30}
          showWordLimit
        />
      </div>
      <div>
        <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>成功提示描述</div>
        <Input.TextArea
          value={value.submit.successDesc}
          onChange={(v) => patchSubmit({ successDesc: v })}
          placeholder="我们已收到您的报名信息，请留意后续通知"
          maxLength={100}
          showWordLimit
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13 }}>显示"分享给朋友"按钮</span>
        <Switch size="small" checked={value.submit.showShare} onChange={(v) => patchSubmit({ showShare: v })} />
      </div>
    </div>
  );

  /* ---------------- 渲染 ---------------- */

  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid #E5E6EB',
        borderRadius: 8,
        overflow: 'hidden',
        height: 720,
        background: '#fff',
      }}
    >
      {/* 左侧：组件区 */}
      <div style={{ width: 216, flexShrink: 0, borderRight: '1px solid #E5E6EB', overflowY: 'auto', padding: 12 }}>
        <div style={{ fontSize: 12, color: '#86909C', marginBottom: 10 }}>
          拖拽组件到中间预览区，或点击直接添加
        </div>
        {FIELD_LIBRARY.map((g) => (
          <div key={g.group} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1D2129', marginBottom: 8 }}>{g.group}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {g.items.map((item) => (
                <div
                  key={item.label}
                  draggable
                  onDragStart={(e) => {
                    dragPayload.current = { kind: 'lib', item };
                    e.dataTransfer.setData('text/plain', item.label);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={() => {
                    dragPayload.current = null;
                    setDropIndex(null);
                  }}
                  onClick={() => addField(item)}
                  style={{
                    width: 'calc(50% - 4px)',
                    border: '1px solid #E5E6EB',
                    borderRadius: 6,
                    padding: '8px 0 6px',
                    textAlign: 'center',
                    cursor: 'grab',
                    userSelect: 'none',
                    background: '#fff',
                  }}
                  className="h5-lib-item"
                >
                  <div style={{ fontSize: 18, lineHeight: '22px' }}>{item.icon}</div>
                  <div style={{ fontSize: 12, color: '#4E5969', marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <style>{`.h5-lib-item:hover { border-color: #1677FF !important; box-shadow: 0 1px 4px rgba(22,119,255,0.2); }`}</style>
      </div>

      {/* 中间：预览区 */}
      <div
        ref={middleRef}
        style={{ flex: 1, minWidth: 0, background: '#F5F7FA', overflowY: 'auto', padding: '16px 12px' }}
        onDragOver={handleMiddleDragOver}
        onDrop={handleMiddleDrop}
        onDragLeave={handleMiddleDragLeave}
        onClick={() => {
          setSelectedKey(null);
          setRightTab('style');
        }}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <H5PhonePreview
            config={value}
            activity={activity}
            mode={rightTab === 'submit' ? 'success' : 'form'}
            editable
            selectedKey={selectedKey}
            dropIndicator={dropIndex}
            fieldListMaxHeight={420}
            onSelectField={(key) => {
              setSelectedKey(key);
              setRightTab('field');
            }}
            onMoveField={moveField}
            onDeleteField={removeField}
            onFieldDragStart={(e, index) => {
              dragPayload.current = { kind: 'move', index };
              e.dataTransfer.setData('text/plain', fields[index]?.label || '');
              e.dataTransfer.effectAllowed = 'move';
            }}
          />
        </div>
      </div>

      {/* 右侧：设置区 */}
      <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid #E5E6EB', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          activeTab={rightTab}
          onChange={(k) => setRightTab(k as typeof rightTab)}
          style={{ padding: '0 12px' }}
        >
          <Tabs.TabPane key="field" title="组件设置" />
          <Tabs.TabPane key="style" title="页面样式" />
          <Tabs.TabPane key="submit" title="提交设置" />
        </Tabs>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px' }}>
          {rightTab === 'field' && fieldPanel()}
          {rightTab === 'style' && stylePanel()}
          {rightTab === 'submit' && submitPanel()}
        </div>
      </div>
    </div>
  );
}
