// 连心社群管理平台 - 类型定义

// 机构
export interface Organization {
  id: number;
  name: string;
}

// 用户/会员基础信息
export interface User {
  id: number;
  org_id: number;
  name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  birthday?: string | null;
  address?: string | null;
  avatar?: string | null;
  created_at: string;
}

// 会员扩展信息
export interface MemberExt {
  id: number;
  user_id: number;
  org_id: number;
  member_type_id: number;
  member_level_id: number;
  join_date: string;
  expire_date: string;
  status: '正常' | '冻结';
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
  avatar?: string | null;
  memberType: MemberType;
  memberLevel: MemberLevel;
  status: '正常' | '冻结';
  created_at: string;
}

// 会员类型
export interface MemberType {
  id: number;
  org_id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

// 会员等级
export interface MemberLevel {
  id: number;
  org_id: number;
  name: string;
  upgrade_condition?: string | null;
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
  gender?: string;
  birthday?: string;
  address?: string;
  member_type_id: number;
  member_level_id: number;
  join_date: string;
  expire_date: string;
}

// 活动表单数据
export interface ActivityFormData {
  title: string;
  type: string;
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
