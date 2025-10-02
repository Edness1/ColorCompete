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
      ,
      // Contest announcement (admin-configurable copy, safe HTML for SendPulse)
      contest_announcement: {
        subject: 'New Contest: {{contestTitle}} — Join Now',
        html: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                  <tr>
                    <td style="padding:24px 32px;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;">
                      <h1 style="margin:0;font-size:20px;">New Contest</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px;">
                      <p style="margin:0 0 10px 0;font-size:16px;color:#0f172a;">Hey {{userName}},</p>
                      <p style="margin:0 0 16px 0;line-height:1.55;color:#334155;font-size:15px;">{{contestDescription}}</p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                        <tr>
                          <td style="padding:16px 18px;">
                            <p style="margin:0 0 6px 0;color:#334155;font-size:14px;"><strong>Prize:</strong> {{contestPrize}}</p>
                            <p style="margin:0;color:#334155;font-size:14px;"><strong>Deadline:</strong> {{contestDeadline}}</p>
                          </td>
                        </tr>
                      </table>
                      <p style="text-align:center;margin:22px 0;">
                        <a href="{{contestUrl}}" style="background:#0ea5e9;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block;font-size:15px;">View Contest</a>
                      </p>
                      <p style="margin:24px 0 0 0;color:#64748b;font-size:13px;text-align:center;">If the button doesn’t work, use: {{contestUrl}}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:#f8fafc;font-size:12px;color:#94a3b8;text-align:center;">
                      © {{year}} ColorCompete • <a href="{{unsubscribeUrl}}" style="color:#94a3b8;">Unsubscribe</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      },
      // Weekly summary
      weekly_summary: {
        subject: 'Your Weekly Summary — {{user_name}}',
        html: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                  <tr>
                    <td style="padding:24px 32px;background:linear-gradient(135deg,#22c55e,#14b8a6);color:#fff;">
                      <h1 style="margin:0;font-size:20px;">Weekly Summary</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px;">
                      <p style="margin:0 0 12px 0;font-size:16px;color:#0f172a;">Hi {{user_name}}, here’s your week at a glance:</p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:10px 0 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                        <tr>
                          <td style="padding:16px 18px;">
                            <p style="margin:0 0 6px 0;color:#334155;font-size:14px;">Submissions: <strong>{{user_submissions_count}}</strong></p>
                            <p style="margin:0 0 6px 0;color:#334155;font-size:14px;">Wins: <strong>{{user_wins_count}}</strong></p>
                            <p style="margin:0;color:#334155;font-size:14px;">Total Votes (all-time): <strong>{{user_total_votes}}</strong></p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
                        <tr>
                          <td style="padding:14px 18px;">
                            <p style="margin:0 0 6px 0;color:#9a3412;font-size:14px;">Active Contests: <strong>{{active_contests}}</strong></p>
                            <p style="margin:0 0 6px 0;color:#9a3412;font-size:14px;">New Members: <strong>{{new_members}}</strong></p>
                            <p style="margin:0;color:#9a3412;font-size:14px;">Submissions this week: <strong>{{total_submissions}}</strong></p>
                          </td>
                        </tr>
                      </table>
                      <p style="text-align:center;margin:22px 0;">
                        <a href="{{dashboard_url}}" style="background:#22c55e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block;font-size:14px;">ColorCompete</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:#f8fafc;font-size:12px;color:#94a3b8;text-align:center;">
                      © {{year}} ColorCompete • <a href="{{unsubscribeUrl}}" style="color:#94a3b8;">Unsubscribe</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      },
      // Voting results (supports simple loop with {{#winners}})
      voting_results: {
        subject: 'Results: {{contestTitle}} — See Winners',
        html: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                  <tr>
                    <td style="padding:24px 32px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;">
                      <h1 style="margin:0;font-size:20px;">Voting Results</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px;">
                      <p style="margin:0 0 10px 0;font-size:16px;color:#0f172a;">Hi {{userName}}, here are the results for <strong>{{contestTitle}}</strong>:</p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:10px 0 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                        <tr>
                          <td style="padding:16px 18px;">
                            <p style="margin:0 0 6px 0;color:#334155;font-size:14px;">Total Submissions: <strong>{{totalSubmissions}}</strong></p>
                            <p style="margin:0 0 6px 0;color:#334155;font-size:14px;">Total Votes: <strong>{{totalVotes}}</strong></p>
                            <p style="margin:0;color:#334155;font-size:14px;">Participants: <strong>{{totalParticipants}}</strong></p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0 8px;">
                        {{#winners}}
                        <tr>
                          <td style="padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;">
                            <p style="margin:0 0 6px 0;color:#0f172a;font-weight:600;font-size:14px;">{{rank}} — {{winnerName}} ({{prize}})</p>
                            <p style="margin:0;color:#334155;font-size:13px;">Votes: {{voteCount}}</p>
                          </td>
                        </tr>
                        {{/winners}}
                      </table>
                      <p style="text-align:center;margin:22px 0;">
                        <a href="{{contestUrl}}" style="background:#f59e0b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block;font-size:14px;">View Full Results</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:#f8fafc;font-size:12px;color:#94a3b8;text-align:center;">
                      © {{year}} ColorCompete • <a href="{{unsubscribeUrl}}" style="color:#94a3b8;">Unsubscribe</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      },
      // Admin broadcast (manual send from dashboard)
      admin_broadcast: {
        subject: '{{subject}}',
        html: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                  <tr>
                    <td style="padding:24px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;">
                      <h1 style="margin:0;font-size:20px;">Announcement</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px;">
                      <p style="margin:0 0 12px 0;font-size:16px;color:#0f172a;">Hi {{userName}},</p>
                      <div style="margin:0 0 10px 0;line-height:1.6;color:#334155;font-size:15px;">{{bodyHtml}}</div>
                      <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;">Sent from the ColorCompete admin dashboard.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:#f8fafc;font-size:12px;color:#94a3b8;text-align:center;">
                      © {{year}} ColorCompete • <a href="{{unsubscribeUrl}}" style="color:#94a3b8;">Unsubscribe</a>
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
    let subject = tpl.subject;
    const mergedVars = { year, ...variables };
    Object.entries(mergedVars).forEach(([k, v]) => {
      const regex = new RegExp(`{{${k}}}`, 'g');
      html = html.replace(regex, String(v ?? ''));
      subject = subject.replace(regex, String(v ?? ''));
    });

    // Wrap with a minimal, email-safe HTML document to improve rendering in providers
    const wrapped = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject ? String(subject).replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'ColorCompete'}</title>
  <!-- Keep CSS minimal; rely on inline styles in body/table -->
</head>
<body style="margin:0;padding:0;background:#f5f7fa;">
${html}
</body>
</html>`;

    return { subject, html: wrapped };
  }
}

module.exports = new EmailTemplateService();
