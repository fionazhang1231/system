import { NextResponse } from 'next/server';

/** POST /api/auth/login - 模拟登录 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code, mode } = body;

    // 手机验证码登录
    if (mode === 'phone' || (!mode && phone && code)) {
      // 提取纯数字手机号（去除区号中的+号等非数字字符）
      const cleanPhone = phone.replace(/[^\d]/g, '');
      if (!cleanPhone || cleanPhone.length < 8) {
        return NextResponse.json(
          { success: false, error: '请输入正确的手机号' },
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
    }

    // 账号密码登录
    if (mode === 'account' || (!mode && phone)) {
      const username = body.username || phone;
      const password = body.password || code;

      // 默认账号：admin / admin123
      if (username === 'admin' && password === 'admin123') {
        return NextResponse.json({
          success: true,
          data: {
            phone: 'admin',
            name: '管理员',
            org_id: 1,
          },
        });
      }

      // Demo模式：任意账号密码均可登录
      if (username && password) {
        return NextResponse.json({
          success: true,
          data: {
            phone: username,
            name: username === 'admin' ? '管理员' : '用户',
            org_id: 1,
          },
        });
      }

      return NextResponse.json(
        { success: false, error: '请输入账号和密码' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '缺少登录参数' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
