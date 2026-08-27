'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import H5FormRenderer from '@/components/H5FormRenderer';
import { normalizeH5Config, type H5Config } from '@/lib/h5-config';
import dayjs from 'dayjs';

interface ActivityData {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  fee: number;
  description: string | null;
  h5_config: string | null;
  max_participants: number | null;
  need_audit: boolean;
  status: string;
  is_deleted: boolean;
}

export default function H5ActivityRegisterPage() {
  const params = useParams();
  const activityId = params?.id as string;

  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [config, setConfig] = useState<H5Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // 获取活动信息
  useEffect(() => {
    if (!activityId) return;
    fetch(`/api/activities/${activityId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const act = data.data as ActivityData;
          setActivity(act);
          // 解析 h5_config
          if (act.h5_config) {
            try {
              const parsed = JSON.parse(act.h5_config);
              setConfig(normalizeH5Config(parsed));
            } catch {
              setConfig(normalizeH5Config(null));
            }
          } else {
            setConfig(normalizeH5Config(null));
          }
        } else {
          setError(data.error || '活动不存在');
        }
      })
      .catch(() => setError('加载活动信息失败'))
      .finally(() => setLoading(false));
  }, [activityId]);

  // 提交报名
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!activity) return;
    setSubmitting(true);
    try {
      // 从表单值中提取姓名、手机号、邮箱
      const nameField = config?.fields.find((f) => f.label === '姓名' || f.key === 'name');
      const phoneField = config?.fields.find((f) => f.label === '手机号' || f.key === 'phone');
      const emailField = config?.fields.find((f) => f.label === '邮箱' || f.key === 'email');

      const name = nameField ? String(values[nameField.key] || '') : '';
      const phone = phoneField ? String(values[phoneField.key] || '') : '';
      const email = emailField ? String(values[emailField.key] || '') : '';

      const res = await fetch(`/api/activities/${activity.id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          form_data: values,
          channel: 'h5',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMessage(data.data?.message || '报名成功！');
        setSubmitted(true);
      } else {
        alert(data.error || '报名失败，请稍后重试');
      }
    } catch {
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 加载中
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <div style={{ color: '#86909C', fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  // 错误
  if (error || !activity || !config) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ color: '#4E5969', fontSize: 16, marginBottom: 8 }}>{error || '活动不存在'}</div>
        <div style={{ color: '#86909C', fontSize: 13 }}>请确认链接是否正确，或联系活动组织者</div>
      </div>
    );
  }

  // 活动已结束或已下架
  if (activity.is_deleted || activity.status === '已结束' || activity.status === '报名已结束') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
        <div style={{ color: '#4E5969', fontSize: 16, marginBottom: 8 }}>
          {activity.is_deleted ? '活动已下架' : '报名已结束'}
        </div>
        <div style={{ color: '#86909C', fontSize: 13 }}>感谢您的关注</div>
      </div>
    );
  }

  // 提交成功页
  if (submitted) {
    const { style, submit } = config;
    const headerBg = style.headerBgImage
      ? { backgroundImage: `url(${style.headerBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: style.headerBgColor || style.themeColor };
    return (
      <div style={{ minHeight: '100vh', background: style.bgColor }}>
        <div style={{ ...headerBg, padding: '40px 20px 32px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>{activity.title}</div>
        </div>
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: style.themeColor,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: 32 }}>✓</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 20, color: '#1D2129' }}>
            {submit.successTitle}
          </div>
          <div style={{ fontSize: 14, color: '#86909C', marginTop: 10, lineHeight: 1.6 }}>
            {submitMessage || submit.successDesc}
          </div>
          {activity.need_audit && (
            <div style={{ fontSize: 13, color: '#FF7D00', marginTop: 12, padding: '8px 16px', background: '#FFF7E8', borderRadius: 6 }}>
              报名需审核，请留意后续通知
            </div>
          )}
          <button
            onClick={() => {
              setSubmitted(false);
              setSubmitMessage('');
            }}
            style={{
              marginTop: 32,
              padding: '10px 32px',
              background: style.themeColor,
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 格式化活动信息
  const timeText = `${dayjs(activity.start_time).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(activity.end_time).format('MM-DD HH:mm')}`;
  const feeText = activity.fee > 0 ? `HKD ${activity.fee.toLocaleString()}` : '免费';

  return (
    <H5FormRenderer
      config={config}
      activity={{
        title: activity.title,
        timeText,
        location: activity.location,
        feeText,
        description: activity.description || undefined,
      }}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}
