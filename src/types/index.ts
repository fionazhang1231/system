// 连心社群管理平台 - 类型定义（对齐需求文档字段设计）

// 机构
export interface Organization {
  id: number;
  name: string;
}

// 用户/会员基础信息（user_base）
export interface User {
  id: number;
  org_id: number;
  name: string;
  phone: string;
  phone_region?: string;
  email?: string | null;
  gender?: number | null;  // 0=未知 1=男 2=女
  birthday?: string | null;
  address?: string | null;
  avatar?: string | null;
  identity_status?: 'visitor' | 'registered' | 'member' | 'volunteer' | 'both';
  registered_channel?: string;
  status?: 'active' | 'disabled';
  is_deleted?: boolean;
  created_at: string;
}

// 会员扩展信息（user_member_ext）
export interface MemberExt {
  id: number;
  user_id: number;
  org_id: number;
  member_no?: string;
  member_type?: string;
  member_level?: string;
  member_type_id: number;
  member_level_id: number;
  join_date: string;
  expire_date: string;
  membership_status?: 'active' | 'expired' | 'revoked';
  rfm_layer?: 'high_value' | 'potential' | 'stable' | 'sleeping' | 'new';
  rfm_score?: number;
  growth_value?: number;
  remark?: string;
}

// 会员详情（合并用户+会员扩展）
export interface MemberDetail extends User {
  memberExt: MemberExt & {
    memberType: MemberType;
    memberLevel: MemberLevel;
  };
}

// 会员列表项
export interface MemberListItem {
  id: number;
  name: string;
  phone: string;
  phone_region?: string;
  avatar?: string | null;
  email?: string | null;
  gender?: number | null;
  birthday?: string | null;
  address?: string | null;
  identity_status?: string;
  member_no?: string | null;
  memberType: MemberType;
  memberLevel: MemberLevel;
  member_type?: string | null;
  member_level?: string | null;
  membership_status: 'active' | 'expired' | 'revoked';
  growth_value?: number;
  rfm_layer?: string;
  rfm_score?: number;
  join_date?: string;
  expire_date?: string;
  remark?: string | null;
  created_at: string;
}

// 会员类型
export interface MemberType {
  id: number;
  org_id: number;
  name: string;
  type_key?: string;
  description?: string | null;
  fee_mode?: string;
  fee_amount?: number;
  need_audit?: boolean;
  audit_mode?: string;
  sort_order?: number;
  created_at: string;
}

// 会员等级
export interface MemberLevel {
  id: number;
  org_id: number;
  name: string;
  level_key?: string;
  growth_threshold?: number;
  benefits?: string | null;
  sort_order: number;
  created_at: string;
}

// 活动
export interface Activity {
  id: number;
  org_id: number;
  title: string;
  type: '线下活动' | '线上活动' | '培训' | '会议' | '其他';
  category?: string;
  visibility?: 'member' | 'public';
  fee?: number;
  cover_image?: string | null;
  start_time: string;
  end_time: string;
  location: string;
  description?: string | null;
  status: '草稿' | '报名中' | '进行中' | '已结束';
  max_participants?: number | null;
  registration_start?: string | null;
  registration_end?: string | null;
  need_audit: boolean;
  created_at: string;
  _count?: {
    registrations: number;
  };
}

// 活动报名
export interface ActivityRegistration {
  id: number;
  activity_id: number;
  user_id: number;
  org_id: number;
  register_time: string;
  audit_status: '待审核' | '已通过' | '已拒绝';
  check_in_time?: string | null;
  check_in_method?: string | null;
  channel?: string | null;
  user: User;
}

// 报名统计
export interface RegistrationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  checkedIn: number;
}

// API 通用响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 会员表单数据
export interface MemberFormData {
  name: string;
  phone: string;
  email?: string;
  gender?: number;
  birthday?: string;
  address?: string;
  member_type_id: number;
  member_level_id: number;
  join_date: string;
  expire_date: string;
  remark?: string;
}

// 活动表单数据
export interface ActivityFormData {
  title: string;
  type: string;
  category?: string;
  visibility?: string;
  fee?: number;
  cover_image?: string;
  start_time: string;
  end_time: string;
  location: string;
  description?: string;
  status: string;
  max_participants?: number;
  registration_start?: string;
  registration_end?: string;
  need_audit: boolean;
}
