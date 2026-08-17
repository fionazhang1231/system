'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Message, Grid } from '@arco-design/web-react';
import { IconPhone, IconLock } from '@arco-design/web-react/icon';
import { useAuth } from '@/hooks/useAuth';

const { Row, Col } = Grid;

/** 登录页面 */
export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const { login } = useAuth();

  // 发送验证码（Mock）
  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone || phone.length !== 11) {
      Message.warning('请输入正确的11位手机号');
      return;
    }
    setCountdown(60);
    Message.success('验证码已发送（Demo模式：任意6位数字即可登录）');
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 登录
  const handleLogin = async (values: { phone: string; code: string }) => {
    if (!values.phone || values.phone.length !== 11) {
      Message.warning('请输入正确的手机号');
      return;
    }
    if (!values.code || values.code.length !== 6) {
      Message.warning('请输入6位验证码');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        login(values.phone);
        Message.success('登录成功');
        router.push('/members');
      } else {
        Message.error(data.error || '登录失败');
      }
    } catch {
      Message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0E7C7B 0%, #0A5F5E 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 900,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex',
          overflow: 'hidden',
          minHeight: 500,
        }}
      >
        {/* 左侧品牌区 */}
        <div
          style={{
            flex: '0 0 380px',
            background: 'linear-gradient(180deg, #0E7C7B 0%, #0A5F5E 100%)',
            padding: '60px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            连
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px 0' }}>
            连心社群管理平台
          </h1>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, margin: 0 }}>
            为港澳社团提供专业数字化管理解决方案
            <br />
            高效管理会员、组织活动、连接社区
          </p>
          <div style={{ marginTop: 40, display: 'flex', gap: 24, opacity: 0.7, fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>1000+</div>
              <div>活跃会员</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>50+</div>
              <div>社区活动</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>10+</div>
              <div>合作机构</div>
            </div>
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div
          style={{
            flex: 1,
            padding: '60px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1D2129', margin: '0 0 8px 0' }}>
            欢迎登录
          </h2>
          <p style={{ color: '#86909C', margin: '0 0 36px 0', fontSize: 14 }}>
            使用手机号和验证码登录管理后台
          </p>

          <Form
            form={form}
            layout="vertical"
            onSubmit={handleLogin}
            style={{ maxWidth: 360 }}
          >
            <Form.Item
              field="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { match: /^1\d{10}$/, message: '请输入正确的11位手机号' },
              ]}
            >
              <Input
                prefix={<IconPhone />}
                placeholder="请输入手机号"
                size="large"
                maxLength={11}
              />
            </Form.Item>

            <Form.Item
              field="code"
              rules={[
                { required: true, message: '请输入验证码' },
                { length: 6, message: '请输入6位验证码' },
              ]}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  prefix={<IconLock />}
                  placeholder="请输入验证码"
                  size="large"
                  maxLength={6}
                  style={{ flex: 1 }}
                />
                <Button
                  size="large"
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                  style={{ width: 120 }}
                >
                  {countdown > 0 ? `${countdown}s` : '发送验证码'}
                </Button>
              </div>
            </Form.Item>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                long
                size="large"
                loading={loading}
                style={{ height: 44, fontSize: 16, background: '#0E7C7B', borderColor: '#0E7C7B' }}
              >
                登 录
              </Button>
            </Form.Item>
          </Form>

          <p style={{ color: '#C9CDD4', fontSize: 12, marginTop: 24 }}>
            Demo模式：输入任意11位手机号 + 任意6位验证码即可登录
          </p>
        </div>
      </div>
    </div>
  );
}
