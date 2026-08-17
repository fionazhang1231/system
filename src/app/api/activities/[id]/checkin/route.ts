import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** POST /api/activities/[id]/checkin - 签到 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _activityId = parseInt(id);
    const body = await request.json();
    const { registration_ids, method } = body;

    if (!registration_ids || !Array.isArray(registration_ids)) {
      return NextResponse.json(
        { success: false, error: '请选择需要签到的报名记录' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    await prisma.activityRegistration.updateMany({
      where: { id: { in: registration_ids } },
      data: {
        check_in_time: now,
        check_in_method: method || '手动',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('签到失败:', error);
    return NextResponse.json({ success: false, error: '签到失败' }, { status: 500 });
  }
}
