/**
 * 邮件发送工具
 * 基于 nodemailer，支持 SMTP 发送
 * 环境变量配置：
 *   SMTP_HOST - SMTP 服务器地址
 *   SMTP_PORT - SMTP 端口（默认 587）
 *   SMTP_USER - SMTP 用户名
 *   SMTP_PASS - SMTP 密码
 *   SMTP_FROM - 发件人地址（如 "连心社群 <noreply@example.com>"）
 *   SMTP_SECURE - 是否使用 SSL（默认 false，端口 465 时设为 true）
 */

let transporter: unknown = null;

/** 获取 SMTP 配置 */
function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || '';
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return { host, port, user, pass, from, secure };
}

/** 检查邮件功能是否已配置 */
export function isEmailConfigured(): boolean {
  const { host, user, pass } = getSmtpConfig();
  return !!(host && user && pass);
}

/** 初始化邮件传输器（懒加载） */
async function getTransporter() {
  if (transporter) return transporter;
  const { host, port, user, pass, secure } = getSmtpConfig();
  if (!host || !user || !pass) {
    throw new Error('SMTP 未配置，请设置 SMTP_HOST / SMTP_USER / SMTP_PASS 环境变量');
  }
  // 动态导入 nodemailer，避免未安装时报错
  const nodemailer = await import('nodemailer');
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

/**
 * 发送邮件
 * @param to 收件人邮箱
 * @param subject 邮件主题
 * @param html HTML 邮件内容
 * @param text 纯文本邮件内容（可选）
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { from } = getSmtpConfig();
    const t = await getTransporter();
    // 使用类型断言，因为 transporter 是 unknown
    const sendMail = (t as { sendMail: (opts: unknown) => Promise<unknown> }).sendMail;
    await sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    return { success: true };
  } catch (error) {
    console.error('发送邮件失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 发送活动报名确认邮件
 * @param to 收件人邮箱
 * @param activityTitle 活动名称
 * @param activityTime 活动时间
 * @param activityLocation 活动地点
 * @param needAudit 是否需要审核
 */
export async function sendRegistrationConfirmation(
  to: string,
  activityTitle: string,
  activityTime: string,
  activityLocation: string,
  needAudit: boolean
): Promise<{ success: boolean; error?: string }> {
  const subject = needAudit
    ? `【报名提交成功】${activityTitle}`
    : `【报名成功】${activityTitle}`;

  const statusText = needAudit
    ? '您的报名已提交，正在等待审核。审核通过后我们将另行通知。'
    : '您已成功报名本次活动，期待您的参与！';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1677FF; padding: 24px 32px; color: #fff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .content { padding: 24px 32px; }
    .status { font-size: 16px; color: #1D2129; margin-bottom: 16px; line-height: 1.6; }
    .info-card { background: #f7f8fa; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
    .info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #86909C; width: 70px; flex-shrink: 0; }
    .info-value { color: #1D2129; flex: 1; }
    .tip { font-size: 13px; color: #86909C; line-height: 1.6; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e6eb; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #86909C; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <div class="status">${statusText}</div>
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">活动名称</span>
          <span class="info-value">${activityTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">活动时间</span>
          <span class="info-value">${activityTime}</span>
        </div>
        <div class="info-row">
          <span class="info-label">活动地点</span>
          <span class="info-value">${activityLocation}</span>
        </div>
      </div>
      <div class="tip">
        如有疑问，请联系活动组织者。<br/>
        本邮件由系统自动发送，请勿直接回复。
      </div>
    </div>
    <div class="footer">
      连心社群管理平台
    </div>
  </div>
</body>
</html>
`;

  return sendEmail(to, subject, html);
}
