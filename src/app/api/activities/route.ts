import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeActivityStatus } from '@/lib/activity-status';

const ORG_ID = 1;

/** GET /api/activities - 获取活动列表（状态自动计算） */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {
      org_id: ORG_ID,
      is_deleted: false,
    };

    if (keyword) {
      where.title = { contains: keyword };
    }
    if (category) {
      where.category = category;
    }

    // 状态筛选需要查全部再计算（因为状态是动态计算的）
    // 草稿可以直接查数据库，其他状态需要内存计算
    if (status === '草稿') {
      where.status = '草稿';
    }

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        include: {
          _count: { select: { registrations: true } },
        },
        orderBy: { created_at: 'desc' },
        // 草稿状态直接分页；其他状态需要全量查再过滤
        ...(status && status !== '草稿' ? {} : {
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      }),
    ]);

    // 动态计算每个活动的状态
    let result = activities.map((a) => ({
      ...a,
      status: computeActivityStatus(a),
    }));

    // 非草稿状态筛选：在计算后的结果中过滤
    if (status && status !== '草稿') {
      result = result.filter((a) => a.status === status);
      // 手动分页
      const startIdx = (page - 1) * pageSize;
      result = result.slice(startIdx, startIdx + pageSize);
    }

    return NextResponse.json({
      success: true,
      data: result,
      total: status && status !== '草稿' ? result.length : total,
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
      location, description, max_participants,
      registration_start, registration_end, need_audit,
      visibility, fee, h5_config,
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
        status: '草稿', // 新建活动默认为草稿，由用户发布后系统自动计算状态
        visibility: visibility || 'member',
        max_participants: max_participants || null,
        registration_start: registration_start || null,
        registration_end: registration_end || null,
        need_audit: need_audit || false,
        fee: fee || 0,
        h5_config: h5_config ? (typeof h5_config === 'string' ? h5_config : JSON.stringify(h5_config)) : null,
      },
    });

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    console.error('创建活动失败:', error);
    return NextResponse.json({ success: false, error: '创建活动失败' }, { status: 500 });
  }
}
