import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET /api/activities/[id]/export - 导出报名列表CSV */
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

    // 生成CSV
    const BOM = '\uFEFF';
    const header = '姓名,手机号,报名时间,审核状态,签到状态,签到时间\n';
    const rows = registrations.map((r) => {
      return [
        r.user.name,
        r.user.phone,
        new Date(r.register_time).toLocaleString('zh-CN'),
        r.audit_status,
        r.check_in_time ? '已签到' : '未签到',
        r.check_in_time ? new Date(r.check_in_time).toLocaleString('zh-CN') : '',
      ].join(',');
    }).join('\n');

    const csv = BOM + header + rows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=registrations_${activityId}.csv`,
      },
    });
  } catch (error) {
    console.error('导出失败:', error);
    return NextResponse.json({ success: false, error: '导出失败' }, { status: 500 });
  }
}
