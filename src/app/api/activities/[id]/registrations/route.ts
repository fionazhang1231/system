import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

/** POST /api/activities/[id]/registrations - 新增报名 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = parseInt(id);
    const body = await request.json();
    const { user_id, audit_status } = body;

    const registration = await prisma.activityRegistration.create({
      data: {
        activity_id: activityId,
        user_id: user_id || 1,
        org_id: ORG_ID,
        audit_status: audit_status || '待审核',
      },
    });

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    console.error('新增报名失败:', error);
    return NextResponse.json({ success: false, error: '新增报名失败' }, { status: 500 });
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
