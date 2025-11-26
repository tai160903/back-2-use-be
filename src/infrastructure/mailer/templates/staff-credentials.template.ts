export function staffCredentialsTemplate(params: {
  fullName?: string;
  username: string;
  tempPassword: string;
}) {
  const displayName = params.fullName || 'Bạn';
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Staff Credentials</title>
  </head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial;background:#f6f9fc;margin:0;padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr style="background:linear-gradient(90deg,#1e3a8a,#3b82f6);color:#fff;">
        <td style="padding:20px 24px">
          <h1 style="margin:0;font-size:18px;">Staff Credentials</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;color:#0f172a">
          <p style="margin:0 0 12px;font-size:15px;">Dear <strong>${displayName}</strong>,</p>
          <p style="margin:0 0 12px;">Your staff account has been created. Please use the information below to log in and change your password immediately.</p>
          <table style="margin:16px 0;border-collapse:collapse;width:100%;">
            <tbody>
              <tr>
                <td style="padding:8px 0;color:#64748b;width:140px;">Username:</td>
                <td style="padding:8px 0;color:#0f172a;"><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${params.username}</code></td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;">Temporary Password:</td>
                <td style="padding:8px 0;color:#0f172a;"><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${params.tempPassword}</code></td>
              </tr>
            </tbody>
          </table>
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;color:#92400e;">
            <p style="margin:0;">For security reasons, please change your password immediately.</p>
          </div>
          <p style="color:#64748b;font-size:12px;margin:16px 0 0;">If you did not perform this action, please contact the store administrator.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f1f5f9;padding:16px 24px;font-size:12px;color:#64748b;text-align:center;">
          Copyright ${new Date().getFullYear()} Back 2 Use — All Rights Reserved
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
