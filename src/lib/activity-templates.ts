/**
 * 活动广场 - 内置 H5 报名模板库
 * 模板为平台内置数据，按 活动分类 / 所属行业 / 价格类型 筛选
 * priceType: free=免费 | paid=付费模板 | enterprise=企业高级版专属
 */
import type { H5Config, H5Field, H5StyleConfig, H5SubmitConfig } from './h5-config';
import { DEFAULT_H5_CONFIG } from './h5-config';

export interface ActivityTemplate {
  id: string;
  name: string;
  desc: string;
  /** 活动分类（与活动管理分类一致） */
  category: string;
  /** 所属行业 */
  industry: string;
  priceType: 'free' | 'paid' | 'enterprise';
  /** 付费模板价格（HKD） */
  price?: number;
  /** 累计使用次数 */
  uses: number;
  /** 封面主视觉（emoji + 渐变色） */
  emoji: string;
  gradient: string;
  /** 使用模板时预填的活动基本信息 */
  prefill: {
    title: string;
    type: string;
    category: string;
    description: string;
    location?: string;
  };
  h5Config: H5Config;
}

export const TEMPLATE_INDUSTRIES = ['社团协会', '教育培训', '公益慈善', '文体康乐', '工商企业', '青年组织'];
export const TEMPLATE_CATEGORIES = ['文娱', '体育', '培训', '公益', '会议', '其他'];

/** 组装模板 H5 配置的辅助函数 */
function tplConfig(
  fields: H5Field[],
  style?: Partial<H5StyleConfig>,
  submit?: Partial<H5SubmitConfig>
): H5Config {
  return {
    version: 2,
    fields,
    style: { ...DEFAULT_H5_CONFIG.style, ...style },
    submit: { ...DEFAULT_H5_CONFIG.submit, ...submit },
  };
}

const base: H5Field[] = [
  { key: 'name', label: '姓名', type: 'text', placeholder: '请输入姓名', required: true, locked: true },
  { key: 'phone', label: '手机号', type: 'phone', placeholder: '请输入手机号', required: true, locked: true },
];

export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    id: 'tpl-agm',
    name: '周年会员大会',
    desc: '庄重正式的会员大会报名页，含公司与职位收集，适用于社团周年大会、理事会选举等场景',
    category: '会议',
    industry: '社团协会',
    priceType: 'free',
    uses: 1286,
    emoji: '🏛️',
    gradient: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 100%)',
    prefill: {
      title: '周年会员大会',
      type: '线下活动',
      category: '会议',
      description: '回顾过去一年工作成果，展望未来发展计划，并进行新一届理事会选举。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_company', label: '公司', type: 'text', placeholder: '请输入公司名称', required: false },
        { key: 'f_position', label: '职位', type: 'text', placeholder: '请输入职位', required: false },
        { key: 'remark', label: '备注', type: 'textarea', placeholder: '请输入备注（选填）', required: false },
      ],
      { themeColor: '#165DFF', welcomeText: '诚邀您出席会员大会' },
      { successDesc: '报名成功，会议议程将发送至您的手机，请准时出席' }
    ),
  },
  {
    id: 'tpl-gala',
    name: '新春联欢晚会',
    desc: '喜庆红色主题，含出席人数与晚宴意向统计，适用于节庆联欢、周年晚宴',
    category: '文娱',
    industry: '社团协会',
    priceType: 'free',
    uses: 942,
    emoji: '🧨',
    gradient: 'linear-gradient(135deg, #F53F3F 0%, #B71C1C 100%)',
    prefill: {
      title: '新春联欢晚会',
      type: '线下活动',
      category: '文娱',
      description: '欢聚一堂，共贺新禧。精彩表演、抽奖环节与团圆晚宴，期待您的参与。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_count', label: '同行人数', type: 'number', placeholder: '含本人共几人出席', required: true },
        { key: 'f_dinner', label: '是否出席晚宴', type: 'radio', required: true, options: ['出席', '不出席'] },
        { key: 'remark', label: '备注', type: 'textarea', placeholder: '饮食禁忌或其他需求（选填）', required: false },
      ],
      { themeColor: '#F53F3F', welcomeText: '恭贺新禧 · 诚邀莅临', buttonText: '报名参加' },
      { successTitle: '报名成功！', successDesc: '新春晚宴席位已为您预留，请留意后续通知' }
    ),
  },
  {
    id: 'tpl-volunteer',
    name: '义工招募报名',
    desc: '公益绿色主题，收集服务经验与可服务时段，适用于社区义工、慈善活动招募',
    category: '公益',
    industry: '公益慈善',
    priceType: 'free',
    uses: 1731,
    emoji: '💚',
    gradient: 'linear-gradient(135deg, #00B42A 0%, #007A2E 100%)',
    prefill: {
      title: '社区义工招募',
      type: '线下活动',
      category: '公益',
      description: '招募热心公益的义工朋友，参与社区探访、物资派发等志愿服务。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_gender', label: '性别', type: 'radio', required: true, options: ['男', '女'] },
        { key: 'f_birth', label: '生日', type: 'date', placeholder: '请选择生日', required: false },
        { key: 'f_time', label: '可服务时段', type: 'checkbox', required: true, options: ['平日上午', '平日下午', '周末上午', '周末下午'] },
        { key: 'f_exp', label: '服务经验', type: 'textarea', placeholder: '请简述您的义工服务经验（选填）', required: false },
      ],
      { themeColor: '#00B42A', welcomeText: '公益同行 · 期待有你', buttonText: '申请成为义工' },
      { successDesc: '感谢您的热心！我们将在 3 个工作日内与您联系' }
    ),
  },
  {
    id: 'tpl-badminton',
    name: '羽毛球友谊赛',
    desc: '活力橙色运动主题，含参赛组别选择，适用于球类比赛、运动会报名',
    category: '体育',
    industry: '文体康乐',
    priceType: 'free',
    uses: 654,
    emoji: '🏸',
    gradient: 'linear-gradient(135deg, #FF7D00 0%, #D45500 100%)',
    prefill: {
      title: '羽毛球友谊赛',
      type: '线下活动',
      category: '体育',
      description: '以球会友，强身健体。分组循环赛制，设男单、女单及双打项目。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_gender', label: '性别', type: 'radio', required: true, options: ['男', '女'] },
        { key: 'f_group', label: '参赛组别', type: 'radio', required: true, options: ['男子单打', '女子单打', '双打'] },
        { key: 'f_level', label: '球龄', type: 'select', required: false, options: ['1年以下', '1-3年', '3-5年', '5年以上'] },
      ],
      { themeColor: '#FF7D00', welcomeText: '挥洒汗水 · 以球会友', buttonText: '立即报名参赛' },
      { successDesc: '报名成功！赛程安排将于赛前一周公布' }
    ),
  },
  {
    id: 'tpl-health',
    name: '社区健康讲座',
    desc: '简洁青蓝主题，一键报名，适用于健康讲座、社区义诊、普法宣传',
    category: '培训',
    industry: '公益慈善',
    priceType: 'free',
    uses: 508,
    emoji: '🩺',
    gradient: 'linear-gradient(135deg, #0FC6C2 0%, #0A8F8C 100%)',
    prefill: {
      title: '社区健康讲座',
      type: '线下活动',
      category: '培训',
      description: '邀请注册医生主讲常见慢性病预防与健康管理，现场设免费健康咨询。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_age', label: '年龄段', type: 'select', required: false, options: ['18岁以下', '18-40岁', '41-60岁', '60岁以上'] },
        { key: 'f_topic', label: '关心的话题', type: 'checkbox', required: false, options: ['心血管健康', '糖尿病预防', '骨骼健康', '心理健康'] },
      ],
      { themeColor: '#0FC6C2', welcomeText: '关爱健康 · 从预防开始' },
      { successDesc: '报名成功！讲座当天请提前 15 分钟入场' }
    ),
  },
  {
    id: 'tpl-mandarin',
    name: '普通话培训班',
    desc: '教育蓝主题，收集基础水平与学习目标，适用于语言班、技能培训课程',
    category: '培训',
    industry: '教育培训',
    priceType: 'paid',
    price: 49,
    uses: 389,
    emoji: '🗣️',
    gradient: 'linear-gradient(135deg, #3C7EFF 0%, #1D4ED8 100%)',
    prefill: {
      title: '普通话培训班',
      type: '线下活动',
      category: '培训',
      description: '专业导师授课，小班教学，从发音纠正到日常会话，共 10 节课。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_level', label: '普通话基础', type: 'radio', required: true, options: ['零基础', '会听不会说', '基本会话'] },
        { key: 'f_goal', label: '学习目标', type: 'textarea', placeholder: '请简述您的学习目标（选填）', required: false },
      ],
      { themeColor: '#3C7EFF', welcomeText: '开口说普通话 · 自信表达', buttonText: '报名课程' },
      { successDesc: '报名成功！开课前将发送课表与缴费方式' }
    ),
  },
  {
    id: 'tpl-family',
    name: '亲子同乐日',
    desc: '温馨粉色主题，含儿童人数与年龄段统计，适用于亲子嘉年华、家庭日',
    category: '文娱',
    industry: '社团协会',
    priceType: 'paid',
    price: 49,
    uses: 467,
    emoji: '🎈',
    gradient: 'linear-gradient(135deg, #F772AC 0%, #D9378A 100%)',
    prefill: {
      title: '亲子同乐日',
      type: '线下活动',
      category: '文娱',
      description: '游戏摊位、亲子手工、魔术表演，带上小朋友一起度过欢乐周末。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_kids', label: '小朋友人数', type: 'number', placeholder: '请输入同行小朋友人数', required: true },
        { key: 'f_kidage', label: '小朋友年龄段', type: 'radio', required: true, options: ['3岁以下', '3-6岁', '7-12岁'] },
        { key: 'f_need', label: '特殊需求', type: 'textarea', placeholder: '如食物过敏等（选填）', required: false },
      ],
      { themeColor: '#F772AC', welcomeText: '欢乐亲子时光', buttonText: '报名参与' },
      { successDesc: '报名成功！活动当天凭报名手机号签到入场' }
    ),
  },
  {
    id: 'tpl-networking',
    name: '商业交流酒会',
    desc: '高端紫金主题，收集公司与行业信息，适用于商务酒会、行业交流会',
    category: '会议',
    industry: '工商企业',
    priceType: 'paid',
    price: 99,
    uses: 276,
    emoji: '🥂',
    gradient: 'linear-gradient(135deg, #722ED1 0%, #3C0D8C 100%)',
    prefill: {
      title: '商业交流酒会',
      type: '线下活动',
      category: '会议',
      description: '汇聚业界精英，拓展人脉网络，探讨大湾区商业合作新机遇。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_company', label: '公司', type: 'text', placeholder: '请输入公司名称', required: true },
        { key: 'f_position', label: '职位', type: 'text', placeholder: '请输入职位', required: true },
        { key: 'f_industry', label: '所属行业', type: 'select', required: true, options: ['金融', '科技', '贸易', '制造', '服务业', '其他'] },
        { key: 'f_email', label: '邮箱', type: 'email', placeholder: '用于接收活动资料', required: false },
      ],
      { themeColor: '#722ED1', welcomeText: '精英汇聚 · 共话商机', buttonText: '预约席位' },
      { successTitle: '预约成功！', successDesc: '请着正装出席，电子邀请函将发送至您的手机' }
    ),
  },
  {
    id: 'tpl-charity',
    name: '慈善义卖嘉年华',
    desc: '企业高级版专属：嘉年华主题活动模板，含摊位意向与捐赠品类收集',
    category: '公益',
    industry: '公益慈善',
    priceType: 'enterprise',
    uses: 158,
    emoji: '🎪',
    gradient: 'linear-gradient(135deg, #B45AED 0%, #6A0DAD 100%)',
    prefill: {
      title: '慈善义卖嘉年华',
      type: '线下活动',
      category: '公益',
      description: '义卖所得全数捐赠慈善基金，现场设游戏摊位、表演舞台与美食区。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_role', label: '参与方式', type: 'radio', required: true, options: ['逛展购物', '申请摊位', '现场义工'] },
        { key: 'f_goods', label: '义卖品类', type: 'checkbox', required: false, options: ['手工艺品', '二手闲置', '自制食品', '书画作品'] },
        { key: 'remark', label: '备注', type: 'textarea', placeholder: '其他说明（选填）', required: false },
      ],
      { themeColor: '#B45AED', welcomeText: '爱心汇聚 · 温暖同行', buttonText: '我要参与' },
      { successDesc: '感谢您的爱心！摊位申请将于 5 个工作日内审核' }
    ),
  },
  {
    id: 'tpl-youth-forum',
    name: '大湾区青年论坛',
    desc: '企业高级版专属：论坛峰会模板，含议题偏好与身份收集，格调专业',
    category: '会议',
    industry: '青年组织',
    priceType: 'enterprise',
    uses: 203,
    emoji: '🌉',
    gradient: 'linear-gradient(135deg, #00C1DE 0%, #0053A6 100%)',
    prefill: {
      title: '大湾区青年论坛',
      type: '线下活动',
      category: '会议',
      description: '汇聚三地青年才俊，探讨创新创业、文化交流与湾区融合发展。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_identity', label: '身份', type: 'radio', required: true, options: ['在校学生', '创业者', '职场人士', '其他'] },
        { key: 'f_topic', label: '关注议题', type: 'checkbox', required: true, options: ['创新创业', '就业前景', '文化交流', '政策解读'] },
        { key: 'f_email', label: '邮箱', type: 'email', placeholder: '用于接收论坛资料', required: true },
      ],
      { themeColor: '#00C1DE', welcomeText: '青年力量 · 对话未来', buttonText: '报名参会' },
      { successDesc: '报名成功！论坛议程与嘉宾名单将发送至您的邮箱' }
    ),
  },
  {
    id: 'tpl-opera',
    name: '粤剧欣赏之夜',
    desc: '企业高级版专属：传统文化演出模板，典雅绛红主题，含座位区选择',
    category: '文娱',
    industry: '文体康乐',
    priceType: 'enterprise',
    uses: 129,
    emoji: '🎭',
    gradient: 'linear-gradient(135deg, #C22831 0%, #6B0F1A 100%)',
    prefill: {
      title: '粤剧欣赏之夜',
      type: '线下活动',
      category: '文娱',
      description: '特邀著名粤剧团献演经典折子戏，弘扬岭南传统文化。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_seat', label: '座位区域', type: 'radio', required: true, options: ['A区（前排）', 'B区（中区）', 'C区（后排）'] },
        { key: 'f_count', label: '票数', type: 'number', placeholder: '请输入所需票数', required: true },
      ],
      { themeColor: '#C22831', welcomeText: '粤韵风华 · 经典再现', buttonText: '预订戏票' },
      { successTitle: '订票成功！', successDesc: '演出当晚凭手机号到票务处领取实体票' }
    ),
  },
  {
    id: 'tpl-lantern',
    name: '中秋灯谜晚会',
    desc: '节庆橙红主题，含摊位游戏报名与月饼口味统计，适用于中秋、元宵活动',
    category: '文娱',
    industry: '社团协会',
    priceType: 'paid',
    price: 49,
    uses: 531,
    emoji: '🏮',
    gradient: 'linear-gradient(135deg, #FF7D00 0%, #C2300A 100%)',
    prefill: {
      title: '中秋灯谜晚会',
      type: '线下活动',
      category: '文娱',
      description: '猜灯谜、赏花灯、品月饼，与街坊邻里共度团圆中秋夜。',
    },
    h5Config: tplConfig(
      [
        ...base,
        { key: 'f_game', label: '报名游戏摊位', type: 'checkbox', required: false, options: ['猜灯谜', '花灯DIY', '投壶', '套圈'] },
        { key: 'f_mooncake', label: '月饼口味偏好', type: 'radio', required: false, options: ['莲蓉', '五仁', '冰皮', '奶黄'] },
      ],
      { themeColor: '#FF7D00', welcomeText: '花好月圆 · 情满中秋', buttonText: '报名赏月' },
      { successDesc: '报名成功！中秋夜不见不散' }
    ),
  },
];
