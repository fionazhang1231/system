import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** PUT /api/member-types/[id] - 更新会员类型 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;
    const type = await prisma.memberType.update({
      where: { id: parseInt(id) },
      data: { name, description: description || null },
    });
    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    console.error('更新会员类型失败:', error);
    return NextResponse.json({ success: false, error: '更新会员类型失败' }, { status: 500 });
  }
}

/** DELETE /api/member-types/[id] - 删除会员类型 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.memberType.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除会员类型失败:', error);
    return NextResponse.json({ success: false, error: '删除会员类型失败' }, { status: 500 });
  }
}
