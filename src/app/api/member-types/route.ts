import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ORG_ID = 1;

/** GET /api/member-types - 获取会员类型列表 */
export async function GET() {
  try {
    const types = await prisma.memberType.findMany({
      where: { org_id: ORG_ID },
      orderBy: { sort_order: 'asc' },
    });
    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('获取会员类型失败:', error);
    return NextResponse.json({ success: false, error: '获取会员类型失败' }, { status: 500 });
  }
}

/** POST /api/member-types - 新增会员类型 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type_key, description, fee_mode, fee_amount, need_audit, audit_mode, sort_order } = body;
    if (!name) {
      return NextResponse.json({ success: false, error: '类型名称不能为空' }, { status: 400 });
    }
    const type = await prisma.memberType.create({
      data: {
        org_id: ORG_ID,
        name,
        type_key: type_key || 'custom',
        description: description || null,
        fee_mode: fee_mode || 'free',
        fee_amount: fee_amount || 0,
        need_audit: need_audit || false,
        audit_mode: audit_mode || 'none',
        sort_order: sort_order || 0,
      },
    });
    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    console.error('新增会员类型失败:', error);
    return NextResponse.json({ success: false, error: '新增会员类型失败' }, { status: 500 });
  }
}
