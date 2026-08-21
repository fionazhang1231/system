/**
 * 活动状态自动计算工具
 *
 * 状态枚举及判断逻辑：
 * ┌──────────────┬─────────────────────────────────────────────────┐
 * │ 状态         │ 判断逻辑                                         │
 * ├──────────────┼─────────────────────────────────────────────────┤
 * │ 草稿         │ 手动标记，未发布，不参与自动计算                    │
 * │ 报名未开始   │ now < registration_start                         │
 * │ 报名中       │ reg_start ≤ now ≤ reg_end 且 now < start_time    │
 * │ 报名已结束   │ now > registration_end 且 now < start_time        │
 * │ 进行中       │ start_time ≤ now ≤ end_time                      │
 * │ 已结束       │ now > end_time                                   │
 * └──────────────┴─────────────────────────────────────────────────┘
 */

interface ActivityTimeFields {
  registration_start?: string | null;
  registration_end?: string | null;
  start_time: string;
  end_time: string;
  status: string; // 数据库中存储的状态（仅"草稿"为手动状态）
}

/** 计算活动当前状态 */
export function computeActivityStatus(activity: ActivityTimeFields): string {
  // 草稿是手动状态，不参与自动计算
  if (activity.status === '草稿') return '草稿';

  const now = new Date();
  const actStart = new Date(activity.start_time);
  const actEnd = new Date(activity.end_time);

  // 活动已结束
  if (now > actEnd) return '已结束';

  // 活动进行中
  if (now >= actStart) return '进行中';

  // 活动未开始，判断报名阶段
  const regStart = activity.registration_start ? new Date(activity.registration_start) : null;
  const regEnd = activity.registration_end ? new Date(activity.registration_end) : null;

  if (regStart && regEnd) {
    if (now < regStart) return '报名未开始';
    if (now <= regEnd) return '报名中';
    return '报名已结束';
  }

  // 未设置报名时间，默认活动开始前都可报名
  return '报名中';
}

/** 状态对应的 Tag 颜色 */
export const statusColorMap: Record<string, string> = {
  '草稿': 'orange',
  '报名未开始': 'gray',
  '报名中': 'green',
  '报名已结束': 'orangered',
  '进行中': 'blue',
  '已结束': 'gray',
};

/** 所有可选状态（用于筛选下拉） */
export const allActivityStatuses = [
  { value: '草稿', label: '草稿' },
  { value: '报名未开始', label: '报名未开始' },
  { value: '报名中', label: '报名中' },
  { value: '报名已结束', label: '报名已结束' },
  { value: '进行中', label: '进行中' },
  { value: '已结束', label: '已结束' },
];
