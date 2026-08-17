import { NextResponse } from 'next/server';

/** POST /api/auth/login - 模拟登录 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || phone.length !== 11) {
      return NextResponse.json(
        { success: false, error: '请输入正确的11位手机号' },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: '请输入6位验证码' },
        { status: 400 }
      );
    }

    // Mock登录：任意手机号+6位验证码均可登录
    return NextResponse.json({
      success: true,
      data: {
        phone,
        name: '管理员',
        org_id: 1,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
