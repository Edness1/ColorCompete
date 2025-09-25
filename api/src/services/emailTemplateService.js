// Simple email template registry with variable interpolation
// Usage: const { subject, html } = EmailTemplateService.render('reset_password', { resetLink, firstName });

class EmailTemplateService {
  constructor() {
    this.templates = {
      reset_password: {
        subject: 'Reset your ColorCompete password',
        html: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                  <tr>
                    <td style="padding:24px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;">
                      <h1 style="margin:0;font-size:20px;">Password Reset</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 32px 12px 32px;">
                      <p style="margin:0 0 16px 0;font-size:16px;">Hello {{firstName}},</p>
                      <p style="margin:0 0 16px 0;line-height:1.5;color:#334155;font-size:15px;">We received a request to reset your ColorCompete password. Click the button below to choose a new password. This link will expire in 1 hour.</p>
                      <p style="text-align:center;margin:32px 0;">
                        <a href="{{resetLink}}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block;font-size:15px;">Reset Password</a>
                      </p>
                      <p style="margin:0 0 16px 0;color:#475569;font-size:14px;">If the button doesn’t work, copy and paste this URL into your browser:</p>
                      <p style="word-break:break-all;font-size:13px;background:#f1f5f9;padding:12px;border-radius:6px;color:#334155;">{{resetLink}}</p>
                      <p style="margin:24px 0 0 0;color:#64748b;font-size:13px;">If you didn’t request this, you can safely ignore this email.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 32px;background:#f8fafc;font-size:12px;color:#94a3b8;text-align:center;">
                      © {{year}} ColorCompete. All rights reserved.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      }
    };
  }

  // Render template with variables
  render(name, variables = {}) {
    const tpl = this.templates[name];
    if (!tpl) throw new Error(`Email template not found: ${name}`);
    const year = new Date().getFullYear();
    let html = tpl.html;
    const mergedVars = { year, ...variables };
    Object.entries(mergedVars).forEach(([k, v]) => {
      const regex = new RegExp(`{{${k}}}`, 'g');
      html = html.replace(regex, String(v ?? ''));
    });
    return { subject: tpl.subject, html };
  }
}

module.exports = new EmailTemplateService();
