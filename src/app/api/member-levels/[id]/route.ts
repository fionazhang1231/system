import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** PUT /api/member-levels/[id] - 更新会员等级 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, upgrade_condition, benefits, sort_order } = body;
    const level = await prisma.memberLevel.update({
      where: { id: parseInt(id) },
      data: {
        name,
        upgrade_condition: upgrade_condition || null,
        benefits: benefits || null,
        sort_order: sort_order || 0,
      },
    });
    return NextResponse.json({ success: true, data: level });
  } catch (error) {
    console.error('更新会员等级失败:', error);
    return NextResponse.json({ success: false, error: '更新会员等级失败' }, { status: 500 });
  }
}

/** DELETE /api/member-levels/[id] - 删除会员等级 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.memberLevel.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除会员等级失败:', error);
    return NextResponse.json({ success: false, error: '删除会员等级失败' }, { status: 500 });
  }
}
