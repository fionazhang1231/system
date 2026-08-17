import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ORG_ID = 1;

/** GET /api/members - 获取会员列表 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const keyword = searchParams.get('keyword') || '';
    const memberTypeId = searchParams.get('memberTypeId');
    const membershipStatus = searchParams.get('membershipStatus');

    // 构建查询条件
    const where: Record<string, unknown> = {
      org_id: ORG_ID,
      is_deleted: false,
    };

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    // 先查询总数
    const totalCount = await prisma.user.count({ where });

    // 查询会员列表（带会员扩展信息）
    const users = await prisma.user.findMany({
      where,
      include: {
        memberExt: {
          include: {
            memberType: true,
            memberLevel: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 过滤条件
    let filteredUsers = users;
    if (memberTypeId) {
      filteredUsers = filteredUsers.filter(
        (u) => u.memberExt?.member_type_id === parseInt(memberTypeId)
      );
    }
    if (membershipStatus) {
      filteredUsers = filteredUsers.filter(
        (u) => u.memberExt?.membership_status === membershipStatus
      );
    }

    // 格式化返回数据（对齐需求文档字段）
    const members = filteredUsers.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      phone_region: u.phone_region,
      avatar: u.avatar_url,
      email: u.email,
      gender: u.gender,
      birthday: u.birthday,
      address: u.address,
      identity_status: u.identity_status,
      member_no: u.memberExt?.member_no || null,
      memberType: u.memberExt?.memberType || null,
      memberLevel: u.memberExt?.memberLevel || null,
      member_type: u.memberExt?.member_type || null,
      member_level: u.memberExt?.member_level || null,
      membership_status: u.memberExt?.membership_status || 'active',
      growth_value: u.memberExt?.growth_value || 0,
      rfm_layer: u.memberExt?.rfm_layer || 'potential',
      rfm_score: u.memberExt?.rfm_score || 0,
      join_date: u.memberExt?.join_date,
      expire_date: u.memberExt?.expire_date,
      remark: u.memberExt?.remark || null,
      created_at: u.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: members,
      total: totalCount,
    });
  } catch (error) {
    console.error('获取会员列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取会员列表失败' },
      { status: 500 }
    );
  }
}

/** POST /api/members - 新增会员 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, phone, email, gender, birthday, address,
      member_type_id, member_level_id, join_date, expire_date, remark,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: '姓名和手机号为必填项' },
        { status: 400 }
      );
    }

    // 检查手机号是否已存在
    const existing = await prisma.user.findFirst({
      where: { phone, org_id: ORG_ID, is_deleted: false },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: '该手机号已注册' },
        { status: 400 }
      );
    }

    // 获取会员类型信息
    const memberType = member_type_id
      ? await prisma.memberType.findUnique({ where: { id: member_type_id } })
      : await prisma.memberType.findFirst({ where: { org_id: ORG_ID } });

    const memberLevel = member_level_id
      ? await prisma.memberLevel.findUnique({ where: { id: member_level_id } })
      : await prisma.memberLevel.findFirst({ where: { org_id: ORG_ID } });

    // 生成会员编号
    const memberCount = await prisma.memberExt.count({ where: { org_id: ORG_ID } });
    const memberNo = `M${String(1000 + memberCount + 1).padStart(4, '0')}`;

    // 创建用户（对齐需求文档字段）
    const user = await prisma.user.create({
      data: {
        org_id: ORG_ID,
        name,
        phone,
        phone_region: '+852',
        email: email || null,
        gender: gender || 0,
        birthday: birthday || null,
        address: address || null,
        identity_status: 'member',
        registered_channel: 'web',
        status: 'active',
      },
    });

    // 创建会员扩展（对齐需求文档字段）
    await prisma.memberExt.create({
      data: {
        user_id: user.id,
        org_id: ORG_ID,
        member_no: memberNo,
        member_type: memberType?.type_key || 'individual',
        member_level: memberLevel?.level_key || 'VIP1',
        member_type_id: member_type_id || 1,
        member_level_id: member_level_id || 1,
        join_date: join_date || new Date().toISOString().split('T')[0],
        expire_date: expire_date || '2025-12-31',
        membership_status: 'active',
        rfm_layer: 'new',
        rfm_score: 0,
        growth_value: 0,
        remark: remark || null,
      },
    });

    return NextResponse.json({ success: true, data: { id: user.id, member_no: memberNo } });
  } catch (error) {
    console.error('新增会员失败:', error);
    return NextResponse.json(
      { success: false, error: '新增会员失败' },
      { status: 500 }
    );
  }
}
