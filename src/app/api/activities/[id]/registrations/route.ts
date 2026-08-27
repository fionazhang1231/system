import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isEmailConfigured, sendRegistrationConfirmation } from '@/lib/email';
import dayjs from 'dayjs';

const ORG_ID = 1;

/** GET /api/activities/[id]/registrations - 获取报名列表 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id);
    const registrations = await prisma.activityRegistration.findMany({
      where: { activity_id: activityId },
      include: { user: true },
      orderBy: { register_time: 'desc' },
    });
    return NextResponse.json({ success: true, data: registrations });
  } catch (error) {
    console.error('获取报名列表失败:', error);
    return NextResponse.json({ success: false, error: '获取报名列表失败' }, { status: 500 });
  }
}

/**
 * POST /api/activities/[id]/registrations - 新增报名（支持H5公开报名）
 * body: { name, phone, email?, form_data?, channel?, user_id? }
 * - 如果传了 user_id，直接关联已有用户
 * - 如果没传 user_id，按手机号查找；不存在则自动创建 guest 用户
 * - form_data 为 H5 表单动态字段的 JSON 数据
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id);
    const body = await request.json();
    const { name, phone, email, form_data, channel, user_id } = body;

    // 校验活动是否存在
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity || activity.is_deleted) {
      return NextResponse.json(
        { success: false, error: '活动不存在或已下架' },
        { status: 404 }
      );
    }

    // 校验活动状态（是否在报名期内）
    const now = new Date();
    if (activity.registration_start && new Date(activity.registration_start) > now) {
      return NextResponse.json(
        { success: false, error: '报名尚未开始' },
        { status: 400 }
      );
    }
    if (activity.registration_end && new Date(activity.registration_end) < now) {
      return NextResponse.json(
        { success: false, error: '报名已结束' },
        { status: 400 }
      );
    }

    // 校验人数是否已满
    if (activity.max_participants) {
      const currentCount = await prisma.activityRegistration.count({
        where: { activity_id: activityId, audit_status: { not: '已拒绝' } },
      });
      if (currentCount >= activity.max_participants) {
        return NextResponse.json(
          { success: false, error: '报名人数已满' },
          { status: 400 }
        );
      }
    }

    // 确定用户：优先用传入的 user_id，否则按手机号查找或创建
    let userId = user_id;
    if (!userId) {
      if (!name || !phone) {
        return NextResponse.json(
          { success: false, error: '姓名和手机号为必填项' },
          { status: 400 }
        );
      }
      // 按手机号查找用户
      let user = await prisma.user.findFirst({
        where: { phone, org_id: ORG_ID, is_deleted: false },
      });
      if (!user) {
        // 自动创建 guest 用户（H5公开报名）
        user = await prisma.user.create({
          data: {
            org_id: ORG_ID,
            name,
            phone,
            phone_region: '+852',
            email: email || null,
            identity_status: 'guest',
            registered_channel: 'h5',
            status: 'active',
          },
        });
      } else if (email && !user.email) {
        // 更新已有用户的邮箱
        await prisma.user.update({
          where: { id: user.id },
          data: { email },
        });
      }
      userId = user.id;
    }

    // 检查是否重复报名
    const existing = await prisma.activityRegistration.findFirst({
      where: { activity_id: activityId, user_id: userId },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: '您已报名该活动，请勿重复报名' },
        { status: 400 }
      );
    }

    // 创建报名记录
    const auditStatus = activity.need_audit ? '待审核' : '已通过';
    const registration = await prisma.activityRegistration.create({
      data: {
        activity_id: activityId,
        user_id: userId,
        org_id: ORG_ID,
        audit_status: auditStatus,
        channel: channel || 'h5',
        form_data: form_data ? JSON.stringify(form_data) : null,
      },
      include: { user: true },
    });

    // 异步发送报名确认邮件（不阻塞响应）
    const userEmail = registration.user.email || email;
    if (userEmail && isEmailConfigured()) {
      const activityTime = `${dayjs(activity.start_time).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(activity.end_time).format('MM-DD HH:mm')}`;
      sendRegistrationConfirmation(
        userEmail,
        activity.title,
        activityTime,
        activity.location,
        activity.need_audit
      ).catch((err) => console.error('发送报名确认邮件失败:', err));
    }

    return NextResponse.json({
      success: true,
      data: {
        id: registration.id,
        audit_status: registration.audit_status,
        need_audit: activity.need_audit,
        message: activity.need_audit
          ? '报名提交成功，请等待审核'
          : '报名成功！',
      },
    });
  } catch (error) {
    console.error('新增报名失败:', error);
    return NextResponse.json(
      { success: false, error: '报名失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/** PUT - 更新报名审核状态 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { registration_id, audit_status } = body;
    await prisma.activityRegistration.update({
      where: { id: registration_id },
      data: { audit_status },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新报名状态失败:', error);
    return NextResponse.json({ success: false, error: '更新报名状态失败' }, { status: 500 });
  }
}
