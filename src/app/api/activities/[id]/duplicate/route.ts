import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ORG_ID = 1;

/** POST /api/activities/[id]/duplicate - 一键复制活动（生成草稿副本，不含报名数据） */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: '无效的活动ID' }, { status: 400 });
    }

    const source = await prisma.activity.findFirst({
      where: { id, org_id: ORG_ID, is_deleted: false },
    });
    if (!source) {
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }

    const copy = await prisma.activity.create({
      data: {
        org_id: ORG_ID,
        title: `${source.title}（副本）`,
        type: source.type,
        category: source.category,
        cover_image: source.cover_image,
        start_time: source.start_time,
        end_time: source.end_time,
        location: source.location,
        description: source.description,
        status: '草稿', // 副本一律为未发布草稿，由管理员调整后发布
        visibility: source.visibility,
        max_participants: source.max_participants,
        registration_start: source.registration_start,
        registration_end: source.registration_end,
        need_audit: source.need_audit,
        fee: source.fee,
        h5_config: source.h5_config,
      },
    });

    return NextResponse.json({ success: true, data: copy });
  } catch (error) {
    console.error('复制活动失败:', error);
    return NextResponse.json({ success: false, error: '复制活动失败' }, { status: 500 });
  }
}
