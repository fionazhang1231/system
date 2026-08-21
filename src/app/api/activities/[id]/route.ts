import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeActivityStatus } from '@/lib/activity-status';

/** GET /api/activities/[id] - 获取活动详情 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id);

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        registrations: {
          include: { user: true },
          orderBy: { register_time: 'desc' },
        },
      },
    });

    if (!activity) {
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }

    // 动态计算活动状态
    const computedStatus = computeActivityStatus(activity);

    // 统计报名数据
    const stats = {
      total: activity.registrations.length,
      pending: activity.registrations.filter((r) => r.audit_status === '待审核').length,
      approved: activity.registrations.filter((r) => r.audit_status === '已通过').length,
      rejected: activity.registrations.filter((r) => r.audit_status === '已拒绝').length,
      checkedIn: activity.registrations.filter((r) => r.check_in_time).length,
    };

    // 解析 H5 配置
    let h5Config = null;
    if (activity.h5_config) {
      try { h5Config = JSON.parse(activity.h5_config); } catch { /* ignore */ }
    }

    return NextResponse.json({
      success: true,
      data: { ...activity, status: computedStatus, stats, h5Config },
    });
  } catch (error) {
    console.error('获取活动详情失败:', error);
    return NextResponse.json({ success: false, error: '获取活动详情失败' }, { status: 500 });
  }
}

/** PUT /api/activities/[id] - 更新活动 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title, type, category, cover_image, start_time, end_time,
      location, description, max_participants,
      registration_start, registration_end, need_audit,
      visibility, fee, h5_config,
    } = body;

    // 状态不允许手动编辑（除非是设为草稿）
    const existing = await prisma.activity.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }

    await prisma.activity.update({
      where: { id: parseInt(id) },
      data: {
        title,
        type,
        category: category || 'other',
        cover_image: cover_image || null,
        start_time,
        end_time,
        location,
        description: description || null,
        // status 不从前端接收，保持数据库中的值（草稿/自动计算）
        visibility: visibility || 'member',
        max_participants: max_participants || null,
        registration_start: registration_start || null,
        registration_end: registration_end || null,
        need_audit,
        fee: fee || 0,
        h5_config: h5_config ? (typeof h5_config === 'string' ? h5_config : JSON.stringify(h5_config)) : existing.h5_config,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新活动失败:', error);
    return NextResponse.json({ success: false, error: '更新活动失败' }, { status: 500 });
  }
}

/** DELETE /api/activities/[id] - 删除活动（软删除） */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.activity.update({
      where: { id: parseInt(id) },
      data: { is_deleted: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除活动失败:', error);
    return NextResponse.json({ success: false, error: '删除活动失败' }, { status: 500 });
  }
}
