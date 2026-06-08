import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

/**
 * 邮件发送服务
 *
 * 设计目标：
 * - SMTP 配置缺失时降级为日志输出，运维可通过 docker logs 抄 token 完成找回
 * - SMTP 配置存在时自动用 nodemailer 发送
 * - 不抛 SMTP 错误给上层：邮件是「最佳努力」，不能让找回流程因发不出邮件而彻底失败
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter | null = null
  private smtpEnabled = false
  private fromAddress = 'no-reply@homepage.local'

  constructor() {
    this.init()
  }

  private init() {
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 465)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM
    const secureEnv = process.env.SMTP_SECURE

    if (from) this.fromAddress = from
    else if (user) this.fromAddress = user

    if (!host || !user || !pass) {
      this.logger.warn(
        '[MailService] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). ' +
          'Password reset tokens will be printed to logs as a fallback.',
      )
      this.smtpEnabled = false
      return
    }

    const secure = secureEnv === undefined ? port === 465 : secureEnv === 'true' || secureEnv === '1'

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        // 主流邮箱对未签发证书或自签证书较敏感，给个宽松兜底（生产仍建议用真实证书）
        tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false' },
      })
      this.smtpEnabled = true
      this.logger.log(`[MailService] SMTP configured host=${host}:${port} secure=${secure} from=${this.fromAddress}`)
    } catch (err: any) {
      this.logger.error(`[MailService] Failed to create transporter: ${err?.message}`)
      this.smtpEnabled = false
    }
  }

  isSmtpEnabled(): boolean {
    return this.smtpEnabled
  }

  /**
   * 发送密码重置邮件。失败时降级到日志输出，绝不抛错。
   */
  async sendPasswordResetEmail(to: string, username: string, resetUrl: string, rawToken: string): Promise<void> {
    const subject = '【homepage】密码重置请求'
    const html = this.renderResetHtml(username, resetUrl)
    const text = this.renderResetText(username, resetUrl)

    if (!this.smtpEnabled || !this.transporter) {
      this.logFallback({ to, username, resetUrl, rawToken, reason: 'SMTP 未配置' })
      return
    }

    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, text, html })
      this.logger.log(`[MailService] Password reset email sent to ${this.maskEmail(to)}`)
    } catch (err: any) {
      this.logger.error(`[MailService] SMTP send failed: ${err?.message}`)
      this.logFallback({ to, username, resetUrl, rawToken, reason: `SMTP 发送失败: ${err?.message}` })
    }
  }

  private logFallback(params: { to: string; username: string; resetUrl: string; rawToken: string; reason: string }) {
    const banner = [
      '',
      '═══════════════════════════════════════════════════════════════',
      '  📬  密码重置请求（邮件降级输出）',
      '═══════════════════════════════════════════════════════════════',
      `  收件人          : ${this.maskEmail(params.to)}`,
      `  用户名          : ${params.username}`,
      `  重置链接        : ${params.resetUrl}`,
      `  重置 token (原样): ${params.rawToken}`,
      `  原因            : ${params.reason}`,
      '  过期时间        : 1 小时',
      '═══════════════════════════════════════════════════════════════',
      '',
    ].join('\n')
    // 走 console.log 才能保证 docker logs 立即可见且不被 JSON driver 吞掉
    console.log(banner)
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***'
    const [name, domain] = email.split('@')
    if (name.length <= 2) return `${name[0] || '*'}***@${domain}`
    return `${name.slice(0, 2)}***@${domain}`
  }

  private renderResetText(username: string, url: string): string {
    return [
      `你好 ${username}，`,
      '',
      '我们收到了你的密码重置请求。点击下方链接在 1 小时内完成重置：',
      url,
      '',
      '如果不是你本人操作，请忽略此邮件。',
      '— homepage 管理后台',
    ].join('\n')
  }

  private renderResetHtml(username: string, url: string): string {
    // 极简 HTML，避免被主流邮箱（QQ/163/Gmail/Outlook）判定为垃圾邮件
    return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f5f5f5;padding:24px;color:#1f1f1f;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #eee;">
    <h2 style="margin:0 0 16px;font-size:20px;">密码重置</h2>
    <p style="margin:0 0 12px;line-height:1.6;">你好 <b>${username}</b>，</p>
    <p style="margin:0 0 16px;line-height:1.6;">我们收到了你的密码重置请求。点击下方按钮在 <b>1 小时</b> 内完成重置：</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${url}" style="display:inline-block;padding:12px 28px;background:#1677ff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">立即重置密码</a>
    </p>
    <p style="margin:16px 0 4px;font-size:13px;color:#888;">或复制链接到浏览器打开：</p>
    <p style="word-break:break-all;background:#f5f5f5;padding:10px;border-radius:6px;font-size:12px;color:#555;">${url}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="margin:0;font-size:12px;color:#999;">如果不是你本人操作，请忽略此邮件。你的账号仍然安全。</p>
  </div>
</body></html>`
  }
}
