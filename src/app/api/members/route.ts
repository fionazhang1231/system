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
    const memberTypeId = searchParams.get('member_type');
    const memberLevelId = searchParams.get('member_level');
    const membershipStatus = searchParams.get('membership_status');

    // 构建查询条件
    const where: Record<string, unknown> = {
      org_id: ORG_ID,
      is_deleted: false,
    };

    // 关键词模糊搜索：同时匹配姓名、手机号、会员编号
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
        { memberExt: { member_no: { contains: keyword } } },
      ];
    }

    // memberExt 关联筛选条件
    const memberExtWhere: Record<string, unknown> = {};
    if (memberTypeId) {
      memberExtWhere.member_type_id = parseInt(memberTypeId);
    }
    if (memberLevelId) {
      memberExtWhere.member_level_id = parseInt(memberLevelId);
    }
    if (membershipStatus) {
      memberExtWhere.membership_status = membershipStatus;
    }

    // 先查询总数
    const totalCount = await prisma.user.count({
      where: {
        ...where,
        ...(Object.keys(memberExtWhere).length > 0
          ? { memberExt: memberExtWhere }
          : {}),
      },
    });

    // 查询会员列表（带会员扩展信息）
    const users = await prisma.user.findMany({
      where: {
        ...where,
        ...(Object.keys(memberExtWhere).length > 0
          ? { memberExt: memberExtWhere }
          : {}),
      },
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

    // 格式化返回数据（对齐需求文档字段）
    const members = users.map((u) => ({
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

    // 生成会员编号：查询当前最大编号+1，避免删除后重复/并发冲突
    const generateMemberNo = async (): Promise<string> => {
      const lastMember = await prisma.memberExt.findFirst({
        where: { org_id: ORG_ID },
        orderBy: { member_no: 'desc' },
        select: { member_no: true },
      });
      const lastNum = lastMember?.member_no
        ? parseInt(lastMember.member_no.replace(/^M/, ''), 10) || 1000
        : 1000;
      return `M${String(lastNum + 1).padStart(4, '0')}`;
    };
    const memberNo = await generateMemberNo();

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
        // 到期日期默认取入会日期 + 1 年（未显式传入时）
        expire_date: expire_date || new Date(new Date(join_date || Date.now()).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
