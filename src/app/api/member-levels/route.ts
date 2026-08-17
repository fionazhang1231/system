import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ORG_ID = 1;

/** GET /api/member-levels - 获取会员等级列表 */
export async function GET() {
  try {
    const levels = await prisma.memberLevel.findMany({
      where: { org_id: ORG_ID },
      orderBy: { sort_order: 'asc' },
    });
    return NextResponse.json({ success: true, data: levels });
  } catch (error) {
    console.error('获取会员等级失败:', error);
    return NextResponse.json({ success: false, error: '获取会员等级失败' }, { status: 500 });
  }
}

/** POST /api/member-levels - 新增会员等级 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, level_key, growth_threshold, benefits, sort_order } = body;
    if (!name) {
      return NextResponse.json({ success: false, error: '等级名称不能为空' }, { status: 400 });
    }
    const level = await prisma.memberLevel.create({
      data: {
        org_id: ORG_ID,
        name,
        level_key: level_key || name,
        growth_threshold: growth_threshold || 0,
        benefits: benefits || null,
        sort_order: sort_order || 0,
      },
    });
    return NextResponse.json({ success: true, data: level });
  } catch (error) {
    console.error('新增会员等级失败:', error);
    return NextResponse.json({ success: false, error: '新增会员等级失败' }, { status: 500 });
  }
}
