/**
 * H5 报名页配置
 * - 类型定义 / 默认配置 / 字段组件库
 * - normalizeH5Config: 兼容旧版 v1 配置（formFields 字符串数组），统一转换为 v2 结构
 */

export type H5FieldType =
  | 'text'
  | 'phone'
  | 'email'
  | 'number'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'date';

export interface H5Field {
  key: string;
  label: string;
  type: H5FieldType;
  placeholder?: string;
  required: boolean;
  /** 系统锁定字段（姓名/手机号），不可删除、不可取消必填 */
  locked?: boolean;
  /** radio / checkbox / select 的选项 */
  options?: string[];
}

export interface H5StyleConfig {
  themeColor: string;
  bgColor: string;
  welcomeText: string;
  buttonText: string;
  showLocation: boolean;
  showTime: boolean;
  showFee: boolean;
  showDesc: boolean;
}

export interface H5SubmitConfig {
  successTitle: string;
  successDesc: string;
  showShare: boolean;
}

export interface H5Config {
  version: 2;
  fields: H5Field[];
  style: H5StyleConfig;
  submit: H5SubmitConfig;
}

/** 主题色预设 */
export const THEME_COLORS = [
  { value: '#1677FF', label: '蓝色' },
  { value: '#0FC6C2', label: '青蓝' },
  { value: '#00B42A', label: '绿色' },
  { value: '#FF7D00', label: '橙色' },
  { value: '#F53F3F', label: '红色' },
  { value: '#722ED1', label: '紫色' },
];

/** 页面背景色预设 */
export const BG_COLORS = ['#F5F7FA', '#FFFFFF', '#FFF7E8', '#F0F5FF', '#F6FFF9', '#FFF1F0'];

/** 默认字段：姓名/手机号锁定，备注默认开启 */
export const DEFAULT_FIELDS: H5Field[] = [
  { key: 'name', label: '姓名', type: 'text', placeholder: '请输入姓名', required: true, locked: true },
  { key: 'phone', label: '手机号', type: 'phone', placeholder: '请输入手机号', required: true, locked: true },
  { key: 'remark', label: '备注', type: 'textarea', placeholder: '请输入备注（选填）', required: false },
];

export const DEFAULT_H5_CONFIG: H5Config = {
  version: 2,
  fields: DEFAULT_FIELDS,
  style: {
    themeColor: '#1677FF',
    bgColor: '#F5F7FA',
    welcomeText: '欢迎参加本次活动',
    buttonText: '立即报名',
    showLocation: true,
    showTime: true,
    showFee: true,
    showDesc: true,
  },
  submit: {
    successTitle: '报名成功！',
    successDesc: '我们已收到您的报名信息，请留意后续通知',
    showShare: true,
  },
};

/** 深拷贝默认配置 */
export function createDefaultH5Config(): H5Config {
  return JSON.parse(JSON.stringify(DEFAULT_H5_CONFIG)) as H5Config;
}

/** 字段组件库（表单搭建器左侧"添加字段"面板） */
export interface FieldLibItem {
  type: H5FieldType;
  label: string;
  options?: string[];
}

export const FIELD_LIBRARY: { group: string; items: FieldLibItem[] }[] = [
  {
    group: '联系人组件',
    items: [
      { type: 'email', label: '邮箱' },
      { type: 'radio', label: '性别', options: ['男', '女'] },
      { type: 'date', label: '生日' },
      { type: 'text', label: '公司' },
      { type: 'text', label: '职位' },
      { type: 'text', label: '地址' },
    ],
  },
  {
    group: '通用组件',
    items: [
      { type: 'text', label: '单行文本' },
      { type: 'textarea', label: '多行文本' },
      { type: 'number', label: '数字' },
      { type: 'radio', label: '单选', options: ['选项1', '选项2'] },
      { type: 'checkbox', label: '多选', options: ['选项1', '选项2'] },
      { type: 'select', label: '下拉选择', options: ['选项1', '选项2'] },
      { type: 'date', label: '日期' },
    ],
  },
];

/** 字段类型中文名 */
export const FIELD_TYPE_NAMES: Record<H5FieldType, string> = {
  text: '单行文本',
  phone: '手机号',
  email: '邮箱',
  number: '数字',
  textarea: '多行文本',
  radio: '单选',
  checkbox: '多选',
  select: '下拉选择',
  date: '日期',
};

/** 旧版 v1 字段 key → v2 字段定义 */
const V1_FIELD_MAP: Record<string, H5Field> = {
  email: { key: 'email', label: '邮箱', type: 'email', required: false, placeholder: '请输入邮箱' },
  gender: { key: 'gender', label: '性别', type: 'radio', required: false, options: ['男', '女'] },
  birthday: { key: 'birthday', label: '生日', type: 'date', required: false, placeholder: '请选择生日' },
  address: { key: 'address', label: '地址', type: 'text', required: false, placeholder: '请输入地址' },
  remark: { key: 'remark', label: '备注', type: 'textarea', required: false, placeholder: '请输入备注（选填）' },
};

/**
 * 将任意历史格式配置统一为 v2 结构
 * v1: { formFields: string[], themeColor, welcomeText, showLocation, showTime, showFee, showDesc }
 */
export function normalizeH5Config(raw: unknown): H5Config {
  const base = createDefaultH5Config();
  if (!raw || typeof raw !== 'object') return base;

  const obj = raw as Record<string, unknown>;

  // v2：直接合并默认值（防止缺字段）
  if (obj.version === 2 && Array.isArray(obj.fields)) {
    return {
      version: 2,
      fields: obj.fields as H5Field[],
      style: { ...base.style, ...(obj.style as Partial<H5StyleConfig> | undefined) },
      submit: { ...base.submit, ...(obj.submit as Partial<H5SubmitConfig> | undefined) },
    };
  }

  // v1 兼容
  const oldKeys = Array.isArray(obj.formFields) ? (obj.formFields as string[]) : [];
  const fields: H5Field[] = [
    ...base.fields.slice(0, 2), // 姓名 + 手机号
    ...oldKeys.map((k) => V1_FIELD_MAP[k]).filter(Boolean),
  ];
  // v1 默认带备注，若 formFields 里没有则补一个备注（保持旧页面体验）
  if (!fields.some((f) => f.key === 'remark') && oldKeys.length === 0) {
    fields.push(V1_FIELD_MAP.remark);
  }

  return {
    version: 2,
    fields,
    style: {
      ...base.style,
      themeColor: typeof obj.themeColor === 'string' ? obj.themeColor : base.style.themeColor,
      welcomeText: typeof obj.welcomeText === 'string' ? obj.welcomeText : base.style.welcomeText,
      showLocation: obj.showLocation !== false,
      showTime: obj.showTime !== false,
      showFee: obj.showFee !== false,
      showDesc: obj.showDesc !== false,
    },
    submit: base.submit,
  };
}
