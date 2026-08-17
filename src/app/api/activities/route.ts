import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ORG_ID = 1;

/** GET /api/activities - 获取活动列表 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      org_id: ORG_ID,
      is_deleted: false,
    };

    if (keyword) {
      where.title = { contains: keyword };
    }
    if (status) {
      where.status = status;
    }

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        include: {
          _count: { select: { registrations: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: activities,
      total,
    });
  } catch (error) {
    console.error('获取活动列表失败:', error);
    return NextResponse.json({ success: false, error: '获取活动列表失败' }, { status: 500 });
  }
}

/** POST /api/activities - 创建活动 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title, type, category, cover_image, start_time, end_time,
      location, description, status, max_participants,
      registration_start, registration_end, need_audit,
      visibility, fee,
    } = body;

    if (!title || !start_time || !end_time || !location) {
      return NextResponse.json(
        { success: false, error: '活动名称、时间、地点为必填项' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        org_id: ORG_ID,
        title,
        type: type || '线下活动',
        category: category || 'other',
        cover_image: cover_image || null,
        start_time,
        end_time,
        location,
        description: description || null,
        status: status || '草稿',
        visibility: visibility || 'member',
        max_participants: max_participants || null,
        registration_start: registration_start || null,
        registration_end: registration_end || null,
        need_audit: need_audit || false,
        fee: fee || 0,
      },
    });

    return NextResponse.json({ success: true, data: { id: activity.id } });
  } catch (error) {
    console.error('创建活动失败:', error);
    return NextResponse.json({ success: false, error: '创建活动失败' }, { status: 500 });
  }
}
