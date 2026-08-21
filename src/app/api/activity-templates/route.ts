import { NextResponse } from 'next/server';
import { ACTIVITY_TEMPLATES } from '@/lib/activity-templates';

/**
 * GET /api/activity-templates - 活动广场模板列表
 * Query: id（取单个模板详情）/ keyword / category / industry / priceType
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 单个模板详情（使用模板预填 / 预览）
    if (id) {
      const tpl = ACTIVITY_TEMPLATES.find((t) => t.id === id);
      if (!tpl) {
        return NextResponse.json({ success: false, error: '模板不存在' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: tpl });
    }

    const keyword = (searchParams.get('keyword') || '').trim().toLowerCase();
    const category = searchParams.get('category') || '';
    const industry = searchParams.get('industry') || '';
    const priceType = searchParams.get('priceType') || '';

    let result = ACTIVITY_TEMPLATES;
    if (keyword) {
      result = result.filter(
        (t) => t.name.toLowerCase().includes(keyword) || t.desc.toLowerCase().includes(keyword)
      );
    }
    if (category) {
      result = result.filter((t) => t.category === category);
    }
    if (industry) {
      result = result.filter((t) => t.industry === industry);
    }
    if (priceType) {
      result = result.filter((t) => t.priceType === priceType);
    }

    return NextResponse.json({ success: true, data: result, total: result.length });
  } catch (error) {
    console.error('获取活动模板失败:', error);
    return NextResponse.json({ success: false, error: '获取活动模板失败' }, { status: 500 });
  }
}
