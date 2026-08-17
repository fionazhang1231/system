import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET /api/members/[id] - 获取会员详情 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberExt: {
          include: {
            memberType: true,
            memberLevel: true,
          },
        },
        registrations: {
          include: { activity: true },
          orderBy: { register_time: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '会员不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        memberExt: user.memberExt,
        activities: user.registrations.map((r) => ({
          id: r.activity.id,
          title: r.activity.title,
          start_time: r.activity.start_time,
          status: r.activity.status,
          audit_status: r.audit_status,
          check_in_time: r.check_in_time,
        })),
      },
    });
  } catch (error) {
    console.error('获取会员详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取会员详情失败' },
      { status: 500 }
    );
  }
}

/** PUT /api/members/[id] - 更新会员 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const {
      name, phone, email, gender, birthday, address,
      member_type_id, member_level_id, join_date, expire_date,
      membership_status, growth_value, rfm_layer, remark,
    } = body;

    // 更新用户基本信息
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        email: email || null,
        gender: gender ?? 0,
        birthday: birthday || null,
        address: address || null,
      },
    });

    // 更新会员扩展信息
    const updateData: Record<string, unknown> = {};
    if (member_type_id) {
      updateData.member_type_id = member_type_id;
      // 同步更新字符串字段
      const mt = await prisma.memberType.findUnique({ where: { id: member_type_id } });
      if (mt) updateData.member_type = mt.type_key;
    }
    if (member_level_id) {
      updateData.member_level_id = member_level_id;
      const ml = await prisma.memberLevel.findUnique({ where: { id: member_level_id } });
      if (ml) updateData.member_level = ml.level_key;
    }
    if (join_date) updateData.join_date = join_date;
    if (expire_date) updateData.expire_date = expire_date;
    if (membership_status) updateData.membership_status = membership_status;
    if (growth_value !== undefined) updateData.growth_value = growth_value;
    if (rfm_layer) updateData.rfm_layer = rfm_layer;
    if (remark !== undefined) updateData.remark = remark;

    if (Object.keys(updateData).length > 0) {
      await prisma.memberExt.update({
        where: { user_id: userId },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新会员失败:', error);
    return NextResponse.json(
      { success: false, error: '更新会员失败' },
      { status: 500 }
    );
  }
}

/** DELETE /api/members/[id] - 删除会员（软删除） */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    await prisma.user.update({
      where: { id: userId },
      data: { is_deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除会员失败:', error);
    return NextResponse.json(
      { success: false, error: '删除会员失败' },
      { status: 500 }
    );
  }
}
