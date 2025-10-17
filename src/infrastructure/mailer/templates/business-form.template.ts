export function businessApprovedTemplate(
  storeName: string,
  email: string,
  username: string,
  password: string,
  durationInDays: number,
  startDate: Date,
  endDate: Date,
) {
  const fmtStart = startDate ? new Date(startDate).toLocaleDateString() : '';
  const fmtEnd = endDate ? new Date(endDate).toLocaleDateString() : '';
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Business Approved</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#f6f9fc; margin:0; padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr style="background:linear-gradient(90deg,#1e3a8a,#3b82f6); color:#fff;">
        <td style="padding:20px 24px;">
          <h1 style="margin:0; font-size:20px;">Business Approved</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px; color:#0f172a;">
          <p style="font-size:16px; margin:0 0 12px;">Hi <strong>${storeName}</strong>,</p>
          <p style="margin:0 0 16px;">Good news — your business account has been <strong>approved</strong>. You can now access the business features in your dashboard.</p>

          <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; margin:16px 0;">
            <tr><td colspan="2" style="font-weight:600; padding:6px 0;">Account information</td></tr>
            <tr style="background:#f8fafc"><td style="width:180px;">Email</td><td>${email}</td></tr>
            <tr><td>Username</td><td>${username}</td></tr>
            <tr style="background:#f8fafc"><td>Password</td><td>${password}</td></tr>
          </table>

          <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse; margin:8px 0 20px;">
            <tr><td colspan="2" style="font-weight:600; padding:6px 0;">Subscription</td></tr>
            <tr style="background:#f8fafc"><td style="width:180px;">Duration</td><td>${durationInDays} day(s)</td></tr>
            <tr><td>Start date</td><td>${fmtStart}</td></tr>
            <tr style="background:#f8fafc"><td>End date</td><td>${fmtEnd}</td></tr>
          </table>

          <div style="text-align:center; margin:18px 0;">
            <a href="#" style="display:inline-block; background:#2563eb; color:#fff; padding:12px 20px; border-radius:6px; text-decoration:none;">Go to Dashboard</a>
          </div>

          <p style="color:#475569; font-size:13px; margin:8px 0 0;">For security, please change your password after logging in for the first time.</p>
          <p style="color:#94a3b8; font-size:12px; margin:14px 0 0;">If you didn't request this or need help, contact our support.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f1f5f9; padding:12px 24px; font-size:12px; color:#64748b; text-align:center;">© ${new Date().getFullYear()} Back 2 Use — Support</td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export function businessRejectedTemplate(storeName: string, note: string) {
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Business Rejected</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#f6f9fc; margin:0; padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <tr style="background:#ef4444; color:#fff;"><td style="padding:18px 24px;"><h1 style="margin:0; font-size:18px;">Business Application Update</h1></td></tr>
      <tr><td style="padding:18px 24px; color:#0f172a;"><p style="margin:0 0 12px;">Hello <strong>${storeName}</strong>,</p>
      <p style="margin:0 0 12px;">We reviewed your business application and unfortunately it was <strong>not approved</strong>.</p>
      <p style="background:#fff3f2; padding:12px; border-radius:6px; color:#7f1d1d;">Reason: ${note}</p>
      <p style="margin:12px 0 0;">If you believe this is an error, please contact our support for guidance on next steps.</p>
      </td></tr>
      <tr><td style="background:#f1f5f9; padding:12px 24px; font-size:12px; color:#64748b; text-align:center;">© ${new Date().getFullYear()} Back 2 Use — Support</td></tr>
    </table>
  </body>
  </html>
  `;
}
