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

  // 创建会员类型
  const memberTypes = await Promise.all([
    prisma.memberType.create({ data: { org_id: org.id, name: '普通会员', description: '基础会员，享受基本服务' } }),
    prisma.memberType.create({ data: { org_id: org.id, name: '高级会员', description: '享受更多专属权益' } }),
    prisma.memberType.create({ data: { org_id: org.id, name: 'VIP会员', description: '最高等级会员，享受全部权益' } }),
    prisma.memberType.create({ data: { org_id: org.id, name: '荣誉会员', description: '特殊贡献者，荣誉身份' } }),
    prisma.memberType.create({ data: { org_id: org.id, name: '志愿者', description: '社区志愿者，参与服务' } }),
  ]);

  // 创建会员等级
  const memberLevels = await Promise.all([
    prisma.memberLevel.create({ data: { org_id: org.id, name: '青铜', upgrade_condition: '注册即为青铜会员', benefits: '基本活动参与权', sort_order: 1 } }),
    prisma.memberLevel.create({ data: { org_id: org.id, name: '白银', upgrade_condition: '参与活动满5次', benefits: '优先报名权、专属活动', sort_order: 2 } }),
    prisma.memberLevel.create({ data: { org_id: org.id, name: '黄金', upgrade_condition: '参与活动满20次且服务满1年', benefits: 'VIP专属活动、免费培训、优先推荐', sort_order: 3 } }),
  ]);

  // 创建示例会员（10个）
  const memberData = [
    { name: '陈大文', phone: '13800138001', email: 'chen@example.com', gender: '男', birthday: '1985-03-15', address: '澳门半岛花地玛堂区', typeIdx: 0, levelIdx: 0, status: '正常' },
    { name: '李美玲', phone: '13800138002', email: 'limeiling@example.com', gender: '女', birthday: '1990-07-22', address: '香港九龙观塘区', typeIdx: 1, levelIdx: 1, status: '正常' },
    { name: '黄志强', phone: '13800138003', email: 'wong@example.com', gender: '男', birthday: '1978-11-08', address: '澳门氹仔嘉模堂区', typeIdx: 2, levelIdx: 2, status: '正常' },
    { name: '张小芳', phone: '13800138004', email: 'zhang@example.com', gender: '女', birthday: '1995-01-30', address: '香港新界沙田区', typeIdx: 0, levelIdx: 0, status: '冻结' },
    { name: '王建国', phone: '13800138005', email: 'wang@example.com', gender: '男', birthday: '1982-06-18', address: '澳门路环圣方济各堂区', typeIdx: 3, levelIdx: 2, status: '正常' },
    { name: '刘嘉欣', phone: '13800138006', email: 'liu@example.com', gender: '女', birthday: '1998-09-12', address: '香港岛湾仔区', typeIdx: 4, levelIdx: 0, status: '正常' },
    { name: '赵伟明', phone: '13800138007', email: 'chiu@example.com', gender: '男', birthday: '1975-12-25', address: '澳门半岛大堂区', typeIdx: 1, levelIdx: 1, status: '正常' },
    { name: '何雪梅', phone: '13800138008', email: 'ho@example.com', gender: '女', birthday: '1988-04-05', address: '香港九龙油尖旺区', typeIdx: 0, levelIdx: 0, status: '正常' },
    { name: '林志明', phone: '13800138009', email: 'lam@example.com', gender: '男', birthday: '1992-08-20', address: '澳门半岛望德堂区', typeIdx: 4, levelIdx: 1, status: '冻结' },
    { name: '吴家慧', phone: '13800138010', email: 'ng@example.com', gender: '女', birthday: '1986-02-14', address: '香港新界元朗区', typeIdx: 2, levelIdx: 2, status: '正常' },
  ];

  const users = [];
  for (const m of memberData) {
    const user = await prisma.user.create({
      data: {
        org_id: org.id,
        name: m.name,
        phone: m.phone,
        email: m.email,
        gender: m.gender,
        birthday: m.birthday,
        address: m.address,
      },
    });
    await prisma.memberExt.create({
      data: {
        user_id: user.id,
        org_id: org.id,
        member_type_id: memberTypes[m.typeIdx].id,
        member_level_id: memberLevels[m.levelIdx].id,
        join_date: '2024-01-01',
        expire_date: '2025-12-31',
        status: m.status,
      },
    });
    users.push(user);
  }

  // 创建示例活动
  const activity1 = await prisma.activity.create({
    data: {
      org_id: org.id,
      title: '社区中秋联欢晚会',
      type: '线下活动',
      start_time: '2025-10-06T18:00:00.000Z',
      end_time: '2025-10-06T21:00:00.000Z',
      location: '澳门社区活动中心大堂',
      description: '一年一度的中秋联欢晚会，欢迎携带家属参加。活动包括月饼品尝、灯笼制作、文艺表演等精彩环节。',
      status: '报名中',
      max_participants: 50,
      registration_start: '2025-09-01T00:00:00.000Z',
      registration_end: '2025-10-04T23:59:59.000Z',
      need_audit: false,
    },
  });

  const activity2 = await prisma.activity.create({
    data: {
      org_id: org.id,
      title: '义工培训工作坊',
      type: '培训',
      start_time: '2025-08-10T09:00:00.000Z',
      end_time: '2025-08-10T17:00:00.000Z',
      location: '香港社区服务中心3楼培训室',
      description: '面向新注册义工的基础培训课程，内容包括社区服务规范、应急处理、沟通技巧等。',
      status: '进行中',
      max_participants: 30,
      registration_start: '2025-07-15T00:00:00.000Z',
      registration_end: '2025-08-08T23:59:59.000Z',
      need_audit: true,
    },
  });

  const activity3 = await prisma.activity.create({
    data: {
      org_id: org.id,
      title: '年度会员大会',
      type: '会议',
      start_time: '2025-06-15T14:00:00.000Z',
      end_time: '2025-06-15T17:00:00.000Z',
      location: '澳门万豪酒店宴会厅',
      description: '年度会员大会，回顾过去一年工作成果，展望未来发展计划，并进行新一届理事会选举。',
      status: '已结束',
      max_participants: 50,
      registration_start: '2025-05-15T00:00:00.000Z',
      registration_end: '2025-06-10T23:59:59.000Z',
      need_audit: true,
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
      },
    });
  }

  console.log('种子数据创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
