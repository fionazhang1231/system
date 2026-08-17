import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清空数据
  await prisma.activityRegistration.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.memberExt.deleteMany();
  await prisma.memberType.deleteMany();
  await prisma.memberLevel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 创建机构
  const org = await prisma.organization.create({
    data: { name: '连心社区服务中心' },
  });

  // 创建会员类型（对齐需求文档：普通会员 + 自定义类型）
  const memberTypes = await Promise.all([
    prisma.memberType.create({
      data: {
        org_id: org.id,
        name: '普通会员',
        type_key: 'individual',
        description: '基础会员，享受基本服务',
        fee_mode: 'free',
        fee_amount: 0,
        need_audit: false,
        audit_mode: 'none',
        sort_order: 1,
      },
    }),
    prisma.memberType.create({
      data: {
        org_id: org.id,
        name: '高级会员',
        type_key: 'group',
        description: '享受更多专属权益',
        fee_mode: 'yearly',
        fee_amount: 500,
        need_audit: true,
        audit_mode: 'single',
        sort_order: 2,
      },
    }),
    prisma.memberType.create({
      data: {
        org_id: org.id,
        name: 'VIP会员',
        type_key: 'honorary',
        description: '最高等级会员，享受全部权益',
        fee_mode: 'yearly',
        fee_amount: 2000,
        need_audit: true,
        audit_mode: 'double',
        sort_order: 3,
      },
    }),
    prisma.memberType.create({
      data: {
        org_id: org.id,
        name: '学生会员',
        type_key: 'student',
        description: '在读学生专属类型',
        fee_mode: 'free',
        fee_amount: 0,
        need_audit: true,
        audit_mode: 'single',
        sort_order: 4,
      },
    }),
    prisma.memberType.create({
      data: {
        org_id: org.id,
        name: '志愿者',
        type_key: 'volunteer',
        description: '社区志愿者，参与服务',
        fee_mode: 'free',
        fee_amount: 0,
        need_audit: true,
        audit_mode: 'single',
        sort_order: 5,
      },
    }),
  ]);

  // 创建会员等级（对齐需求文档：VIP1-VIP5）
  const memberLevels = await Promise.all([
    prisma.memberLevel.create({
      data: {
        org_id: org.id,
        name: 'VIP1',
        level_key: 'VIP1',
        growth_threshold: 0,
        benefits: '基本活动参与权',
        sort_order: 1,
      },
    }),
    prisma.memberLevel.create({
      data: {
        org_id: org.id,
        name: 'VIP2',
        level_key: 'VIP2',
        growth_threshold: 1000,
        benefits: '优先报名权、专属活动',
        sort_order: 2,
      },
    }),
    prisma.memberLevel.create({
      data: {
        org_id: org.id,
        name: 'VIP3',
        level_key: 'VIP3',
        growth_threshold: 5000,
        benefits: 'VIP专属活动、免费培训、优先推荐',
        sort_order: 3,
      },
    }),
    prisma.memberLevel.create({
      data: {
        org_id: org.id,
        name: 'VIP4',
        level_key: 'VIP4',
        growth_threshold: 15000,
        benefits: '专属沙龙、生日礼遇、双倍积分',
        sort_order: 4,
      },
    }),
    prisma.memberLevel.create({
      data: {
        org_id: org.id,
        name: 'VIP5',
        level_key: 'VIP5',
        growth_threshold: 50000,
        benefits: '顶级权益、专属客服、理事会邀请',
        sort_order: 5,
      },
    }),
  ]);

  // 创建示例会员（10个，对齐字段设计文档）
  const memberData = [
    { name: '陈大文', phone: '13800138001', email: 'chen@example.com', gender: 1, birthday: '1985-03-15', address: '澳门半岛花地玛堂区', typeIdx: 0, levelIdx: 0, growth: 120, rfm: 'potential' },
    { name: '李美玲', phone: '13800138002', email: 'limeiling@example.com', gender: 2, birthday: '1990-07-22', address: '香港九龙观塘区', typeIdx: 1, levelIdx: 1, growth: 2500, rfm: 'high_value' },
    { name: '黄志强', phone: '13800138003', email: 'wong@example.com', gender: 1, birthday: '1978-11-08', address: '澳门氹仔嘉模堂区', typeIdx: 2, levelIdx: 2, growth: 8000, rfm: 'high_value' },
    { name: '张小芳', phone: '13800138004', email: 'zhang@example.com', gender: 2, birthday: '1995-01-30', address: '香港新界沙田区', typeIdx: 0, levelIdx: 0, growth: 50, rfm: 'sleeping' },
    { name: '王建国', phone: '13800138005', email: 'wang@example.com', gender: 1, birthday: '1982-06-18', address: '澳门路环圣方济各堂区', typeIdx: 3, levelIdx: 2, growth: 6500, rfm: 'high_value' },
    { name: '刘嘉欣', phone: '13800138006', email: 'liu@example.com', gender: 2, birthday: '1998-09-12', address: '香港岛湾仔区', typeIdx: 4, levelIdx: 0, growth: 300, rfm: 'stable' },
    { name: '赵伟明', phone: '13800138007', email: 'chiu@example.com', gender: 1, birthday: '1975-12-25', address: '澳门半岛大堂区', typeIdx: 1, levelIdx: 1, growth: 3200, rfm: 'potential' },
    { name: '何雪梅', phone: '13800138008', email: 'ho@example.com', gender: 2, birthday: '1988-04-05', address: '香港九龙油尖旺区', typeIdx: 0, levelIdx: 0, growth: 180, rfm: 'stable' },
    { name: '林志明', phone: '13800138009', email: 'lam@example.com', gender: 1, birthday: '1992-08-20', address: '澳门半岛望德堂区', typeIdx: 4, levelIdx: 1, growth: 1200, rfm: 'stable' },
    { name: '吴家慧', phone: '13800138010', email: 'ng@example.com', gender: 2, birthday: '1986-02-14', address: '香港新界元朗区', typeIdx: 2, levelIdx: 2, growth: 5500, rfm: 'high_value' },
  ];

  const users = [];
  for (let i = 0; i < memberData.length; i++) {
    const m = memberData[i];
    const user = await prisma.user.create({
      data: {
        org_id: org.id,
        name: m.name,
        phone: m.phone,
        phone_region: '+852',
        email: m.email,
        gender: m.gender,
        birthday: m.birthday,
        address: m.address,
        identity_status: 'member',
        registered_channel: 'web',
        status: 'active',
      },
    });

    // 生成会员编号
    const memberNo = `M${String(1000 + i + 1).padStart(4, '0')}`;

    await prisma.memberExt.create({
      data: {
        user_id: user.id,
        org_id: org.id,
        member_no: memberNo,
        member_type: memberTypes[m.typeIdx].type_key,
        member_level: memberLevels[m.levelIdx].level_key,
        member_type_id: memberTypes[m.typeIdx].id,
        member_level_id: memberLevels[m.levelIdx].id,
        join_date: '2024-01-01',
        expire_date: '2025-12-31',
        membership_status: 'active',
        rfm_layer: m.rfm,
        rfm_score: m.rfm === 'high_value' ? 4.2 : m.rfm === 'potential' ? 3.5 : m.rfm === 'stable' ? 2.5 : m.rfm === 'sleeping' ? 1.5 : 0.8,
        growth_value: m.growth,
        approved_at: new Date('2024-01-02'),
      },
    });
    users.push(user);
  }

  // 创建示例活动（对齐需求文档：分类、开放度）
  const activity1 = await prisma.activity.create({
    data: {
      org_id: org.id,
      title: '社区中秋联欢晚会',
      type: '线下活动',
      category: '文娱',
      start_time: '2025-10-06T18:00:00.000Z',
      end_time: '2025-10-06T21:00:00.000Z',
      location: '澳门社区活动中心大堂',
      description: '一年一度的中秋联欢晚会，欢迎携带家属参加。活动包括月饼品尝、灯笼制作、文艺表演等精彩环节。',
      status: '报名中',
      visibility: 'member',
      max_participants: 50,
      registration_start: '2025-09-01T00:00:00.000Z',
      registration_end: '2025-10-04T23:59:59.000Z',
      need_audit: false,
      fee: 0,
    },
  });

  const activity2 = await prisma.activity.create({
    data: {
      org_id: org.id,
      title: '义工培训工作坊',
      type: '培训',
      category: '培训',
      start_time: '2025-08-10T09:00:00.000Z',
      end_time: '2025-08-10T17:00:00.000Z',
      location: '香港社区服务中心3楼培训室',
      description: '面向新注册义工的基础培训课程，内容包括社区服务规范、应急处理、沟通技巧等。',
      status: '进行中',
      visibility: 'member',
      max_participants: 30,
      registration_start: '2025-07-15T00:00:00.000Z',
      registration_end: '2025-08-08T23:59:59.000Z',
      need_audit: true,
      fee: 0,
    },
  });

  const activity3 = await prisma.activity.create({
    data: {
      org_id: org.id,
      title: '年度会员大会',
      type: '会议',
      category: '会议',
      start_time: '2025-06-15T14:00:00.000Z',
      end_time: '2025-06-15T17:00:00.000Z',
      location: '澳门万豪酒店宴会厅',
      description: '年度会员大会，回顾过去一年工作成果，展望未来发展计划，并进行新一届理事会选举。',
      status: '已结束',
      visibility: 'member',
      max_participants: 50,
      registration_start: '2025-05-15T00:00:00.000Z',
      registration_end: '2025-06-10T23:59:59.000Z',
      need_audit: true,
      fee: 0,
    },
  });

  // 活动1报名记录（20人）
  for (let i = 0; i < 20; i++) {
    await prisma.activityRegistration.create({
      data: {
        activity_id: activity1.id,
        user_id: users[i % 10].id,
        org_id: org.id,
        audit_status: '已通过',
        channel: 'web',
      },
    });
  }

  // 活动2报名记录（15人，含不同审核状态）
  const auditStatuses2 = ['已通过', '已通过', '已通过', '已通过', '已通过', '已通过', '已通过', '已通过', '已通过', '已通过', '待审核', '待审核', '待审核', '已拒绝', '已拒绝'];
  for (let i = 0; i < 15; i++) {
    await prisma.activityRegistration.create({
      data: {
        activity_id: activity2.id,
        user_id: users[i % 10].id,
        org_id: org.id,
        audit_status: auditStatuses2[i],
        check_in_time: i < 8 ? '2025-08-10T08:50:00.000Z' : null,
        check_in_method: i < 8 ? '手动' : null,
        channel: i % 3 === 0 ? 'wechat' : i % 3 === 1 ? 'web' : 'app',
      },
    });
  }

  // 活动3报名记录（45人）
  for (let i = 0; i < 45; i++) {
    await prisma.activityRegistration.create({
      data: {
        activity_id: activity3.id,
        user_id: users[i % 10].id,
        org_id: org.id,
        audit_status: '已通过',
        check_in_time: i < 40 ? '2025-06-15T13:50:00.000Z' : null,
        check_in_method: i < 40 ? (i % 2 === 0 ? '扫码' : '手动') : null,
        channel: 'web',
      },
    });
  }

  console.log('种子数据创建完成！');
  console.log(`- 机构: ${org.name}`);
  console.log(`- 会员类型: ${memberTypes.length} 个`);
  console.log(`- 会员等级: ${memberLevels.length} 个 (VIP1-VIP5)`);
  console.log(`- 会员: ${users.length} 个`);
  console.log(`- 活动: 3 个`);
  console.log(`- 报名记录: ${20 + 15 + 45} 条`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
