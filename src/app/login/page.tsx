'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Message, Tabs, Select } from '@arco-design/web-react';
import { IconLock, IconUser } from '@arco-design/web-react/icon';
import { useAuth } from '@/hooks/useAuth';
import { phoneRegionOptions, getPhoneValidator, getPhoneMaxLength, getPhonePlaceholder } from '@/lib/phone';

/** 登录页面：支持账号密码 + 手机验证码两种方式 */
export default function LoginPage() {
  const [accountForm] = Form.useForm();
  const [phoneForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneRegion, setPhoneRegion] = useState('+86');
  const [activeTab, setActiveTab] = useState('account');
  const router = useRouter();
  const { login } = useAuth();

  // 发送验证码（Mock）
  const handleSendCode = async () => {
    const phone = phoneForm.getFieldValue('phone');
    if (!phone) {
      Message.warning('请输入手机号');
      return;
    }
    const validator = getPhoneValidator(phoneRegion);
    if (!validator(phone)) {
      Message.warning('请输入正确格式的手机号');
      return;
    }
    setCountdown(60);
    Message.info('验证码已发送，Demo模式请输入：123456');
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

  // 账号密码登录
  const handleAccountLogin = async () => {
    try {
      const errors = await accountForm.validate();
      if (errors && Object.keys(errors).length > 0) return;
    } catch {
      return;
    }

    const values = accountForm.getFieldsValue();
    const username = values.username as string;
    const password = values.password as string;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'account', username, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(username);
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

  // 手机验证码登录
  const handlePhoneLogin = async () => {
    try {
      const errors = await phoneForm.validate();
      if (errors && Object.keys(errors).length > 0) return;
    } catch {
      return;
    }

    const values = phoneForm.getFieldsValue();
    const phone = values.phone as string;
    const code = values.code as string;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'phone',
          phone: `${phoneRegion}${phone}`,
          code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        login(`${phoneRegion}${phone}`);
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
        background: 'linear-gradient(135deg, #1677FF 0%, #0958D9 100%)',
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
          minHeight: 520,
        }}
      >
        {/* 左侧品牌区 */}
        <div
          style={{
            flex: '0 0 380px',
            background: 'linear-gradient(180deg, #1677FF 0%, #0958D9 100%)',
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
            padding: '40px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1D2129', margin: '0 0 8px 0' }}>
            欢迎登录
          </h2>
          <p style={{ color: '#86909C', margin: '0 0 20px 0', fontSize: 14 }}>
            请选择登录方式进入管理后台
          </p>

          {/* Demo 默认账号提示 */}
          <div
            style={{
              background: '#E8F3FF',
              border: '1px solid #BEDAFF',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#1677FF',
              lineHeight: 1.6,
            }}
          >
            <b>Demo 默认账号：</b>admin / admin123
            <br />
            <b>手机验证码：</b>任意手机号 + 123456
          </div>

          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            style={{ maxWidth: 380 }}
          >
            {/* 账号密码登录 - 默认Tab */}
            <Tabs.TabPane key="account" title="账号密码">
              <Form
                form={accountForm}
                layout="vertical"
                style={{ marginTop: 16 }}
              >
                <Form.Item
                  field="username"
                  initialValue="admin"
                  rules={[{ required: true, message: '请输入账号' }]}
                >
                  <Input
                    prefix={<IconUser />}
                    placeholder="请输入账号"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  field="password"
                  initialValue="admin123"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={<IconLock />}
                    placeholder="请输入密码"
                    size="large"
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: 8 }}>
                  <Button
                    type="primary"
                    long
                    size="large"
                    loading={loading}
                    onClick={handleAccountLogin}
                    style={{ height: 44, fontSize: 16 }}
                  >
                    登 录
                  </Button>
                </Form.Item>
              </Form>
            </Tabs.TabPane>

            {/* 手机验证码登录 */}
            <Tabs.TabPane key="phone" title="手机验证码">
              <Form
                form={phoneForm}
                layout="vertical"
                style={{ marginTop: 16 }}
              >
                <Form.Item
                  field="phone"
                  initialValue="13800138000"
                  rules={[{ required: true, message: '请输入手机号' }]}
                >
                  <Input
                    addBefore={
                      <Select
                        value={phoneRegion}
                        onChange={setPhoneRegion}
                        style={{ width: 110 }}
                        options={phoneRegionOptions}
                      />
                    }
                    placeholder={getPhonePlaceholder(phoneRegion)}
                    size="large"
                    maxLength={getPhoneMaxLength(phoneRegion)}
                  />
                </Form.Item>

                <Form.Item
                  field="code"
                  initialValue="123456"
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
                    long
                    size="large"
                    loading={loading}
                    onClick={handlePhoneLogin}
                    style={{ height: 44, fontSize: 16 }}
                  >
                    登 录
                  </Button>
                </Form.Item>
              </Form>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
