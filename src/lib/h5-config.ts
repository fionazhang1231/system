/**
 * H5 报名页配置
 * - 类型定义 / 默认配置 / 拖拽组件库 / 内置背景图
 * - normalizeH5Config: 兼容旧版 v1 配置（formFields 字符串数组），统一转换为 v2 结构
 */

export type H5FieldType =
  // 输入类
  | 'text'
  | 'phone'
  | 'email'
  | 'number'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'rate'
  | 'address'
  | 'attachment'
  | 'signature'
  | 'vote'
  // 展示/布局类
  | 'section'
  | 'divider'
  | 'pagebreak'
  | 'qrcode'
  | 'share';

export interface H5Field {
  key: string;
  label: string;
  type: H5FieldType;
  placeholder?: string;
  required: boolean;
  /** 系统锁定字段（姓名/手机号），不可删除、不可取消必填 */
  locked?: boolean;
  /** radio / checkbox / select / vote 的选项 */
  options?: string[];
  /** 字段描述（标题下方的辅助说明） */
  description?: string;
  /** rate 评分的最大分值（默认 5） */
  maxScore?: number;
  /** qrcode / share 的展示文案 */
  text?: string;
}

export interface H5StyleConfig {
  themeColor: string;
  /** 页面背景色（bgImage 为空时生效） */
  bgColor: string;
  /** 页面背景图：内置路径 /h5-bg/xxx.svg 或用户上传的 dataURL，空串表示不用背景图 */
  bgImage: string;
  /** 背景图是否固定（不随表单内容滚动） */
  bgFixed: boolean;
  /** 表头区背景色，空串表示跟随主题色 */
  headerBgColor: string;
  /** 表头区背景图，优先于 headerBgColor */
  headerBgImage: string;
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

/* ---------------- 预设 ---------------- */

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

/** 内置页面背景图（public/h5-bg/） */
export interface BgItem {
  key: string;
  name: string;
  url: string;
}

export const BUILTIN_BACKGROUNDS: BgItem[] = [
  { key: 'aurora', name: '极光幻彩', url: '/h5-bg/aurora.svg' },
  { key: 'business', name: '商务深蓝', url: '/h5-bg/business.svg' },
  { key: 'festival', name: '节日红金', url: '/h5-bg/festival.svg' },
  { key: 'nature', name: '山野清风', url: '/h5-bg/nature.svg' },
  { key: 'ocean', name: '碧海蓝湾', url: '/h5-bg/ocean.svg' },
  { key: 'starry', name: '星空夜幕', url: '/h5-bg/starry.svg' },
  { key: 'youth', name: '青春活力', url: '/h5-bg/youth.svg' },
  { key: 'pattern', name: '雅韵花纹', url: '/h5-bg/pattern.svg' },
];

/* ---------------- 默认配置 ---------------- */

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
    bgImage: '',
    bgFixed: true,
    headerBgColor: '',
    headerBgImage: '',
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

/* ---------------- 组件库 ---------------- */

/** 展示/布局类组件（无必填、无占位提示） */
export const DISPLAY_TYPES: ReadonlySet<H5FieldType> = new Set([
  'section', 'divider', 'pagebreak', 'qrcode', 'share',
]);

/** 带选项的组件 */
export const OPTION_TYPES: ReadonlySet<H5FieldType> = new Set(['radio', 'checkbox', 'select', 'vote']);

/** 有占位提示的输入类组件 */
export const PLACEHOLDER_TYPES: ReadonlySet<H5FieldType> = new Set([
  'text', 'phone', 'email', 'number', 'textarea', 'address',
]);

/** 联系人唯一字段（同一表单只能添加一次） */
export const SINGLETON_LABELS = ['姓名', '手机号', '邮箱', '性别', '生日', '公司', '部门', '职位', '地址'];

/** 字段组件库（搭建器左侧组件区，支持拖拽/点击添加） */
export interface FieldLibItem {
  type: H5FieldType;
  label: string;
  icon: string;
  options?: string[];
  text?: string;
  maxScore?: number;
}

export const FIELD_LIBRARY: { group: string; items: FieldLibItem[] }[] = [
  {
    group: '联系人组件',
    items: [
      { type: 'text', label: '姓名', icon: '👤' },
      { type: 'phone', label: '手机号', icon: '📱' },
      { type: 'email', label: '邮箱', icon: '📧' },
      { type: 'radio', label: '性别', icon: '🚻', options: ['男', '女'] },
      { type: 'date', label: '生日', icon: '🎂' },
      { type: 'text', label: '公司', icon: '🏢' },
      { type: 'text', label: '部门', icon: '🏬' },
      { type: 'text', label: '职位', icon: '💼' },
      { type: 'address', label: '地址', icon: '📍' },
    ],
  },
  {
    group: '表单组件',
    items: [
      { type: 'text', label: '单行文本', icon: '📝' },
      { type: 'textarea', label: '多行文本', icon: '📄' },
      { type: 'number', label: '数字', icon: '🔢' },
      { type: 'radio', label: '单选', icon: '🔘', options: ['选项1', '选项2'] },
      { type: 'checkbox', label: '多选', icon: '☑️', options: ['选项1', '选项2'] },
      { type: 'select', label: '下拉选择', icon: '🔽', options: ['选项1', '选项2'] },
      { type: 'date', label: '日期时间', icon: '📅' },
      { type: 'rate', label: '评分', icon: '⭐', maxScore: 5 },
      { type: 'vote', label: '投票', icon: '🗳️', options: ['选项1', '选项2'] },
      { type: 'attachment', label: '附件', icon: '📎' },
      { type: 'signature', label: '签名', icon: '✍️' },
    ],
  },
  {
    group: '布局与展示',
    items: [
      { type: 'section', label: '分段标题', icon: '🔖' },
      { type: 'divider', label: '下划线', icon: '➖' },
      { type: 'pagebreak', label: '分页', icon: '📑' },
      { type: 'qrcode', label: '二维码', icon: '🔳', text: '扫码分享给好友' },
      { type: 'share', label: '分享按钮', icon: '🔗', text: '分享给好友' },
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
  date: '日期时间',
  rate: '评分',
  address: '地址',
  attachment: '附件',
  signature: '签名',
  vote: '投票',
  section: '分段标题',
  divider: '下划线',
  pagebreak: '分页',
  qrcode: '二维码',
  share: '分享按钮',
};

let fieldSeq = 0;

/** 从组件库条目创建字段实例（生成唯一 key） */
export function createFieldFromLib(item: FieldLibItem, label: string): H5Field {
  fieldSeq += 1;
  const key = `f_${Date.now().toString(36)}_${fieldSeq.toString(36)}`;
  const verb = item.type === 'select' || item.type === 'date' ? '请选择' : '请输入';
  return {
    key,
    label,
    type: item.type,
    placeholder: PLACEHOLDER_TYPES.has(item.type) ? `${verb}${label}` : undefined,
    required: false,
    options: item.options ? [...item.options] : undefined,
    maxScore: item.maxScore,
    text: item.text,
  };
}

/* ---------------- 兼容归一化 ---------------- */

/** 旧版 v1 字段 key → v2 字段定义 */
const V1_FIELD_MAP: Record<string, H5Field> = {
  email: { key: 'email', label: '邮箱', type: 'email', required: false, placeholder: '请输入邮箱' },
  gender: { key: 'gender', label: '性别', type: 'radio', required: false, options: ['男', '女'] },
  birthday: { key: 'birthday', label: '生日', type: 'date', required: false, placeholder: '请选择生日' },
  address: { key: 'address', label: '地址', type: 'address', required: false, placeholder: '请输入地址' },
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
