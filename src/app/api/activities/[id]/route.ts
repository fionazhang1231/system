import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // 统计报名数据
    const stats = {
      total: activity.registrations.length,
      pending: activity.registrations.filter((r) => r.audit_status === '待审核').length,
      approved: activity.registrations.filter((r) => r.audit_status === '已通过').length,
      rejected: activity.registrations.filter((r) => r.audit_status === '已拒绝').length,
      checkedIn: activity.registrations.filter((r) => r.check_in_time).length,
    };

    return NextResponse.json({
      success: true,
      data: { ...activity, stats },
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
      title, type, cover_image, start_time, end_time,
      location, description, status, max_participants,
      registration_start, registration_end, need_audit,
    } = body;

    await prisma.activity.update({
      where: { id: parseInt(id) },
      data: {
        title,
        type,
        cover_image: cover_image || null,
        start_time,
        end_time,
        location,
        description: description || null,
        status,
        max_participants: max_participants || null,
        registration_start: registration_start || null,
        registration_end: registration_end || null,
        need_audit,
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
