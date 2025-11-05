export function businessApprovedTemplate(
  username: string,
  transferAmount?: number,
) {
  const transferBlock =
    transferAmount && transferAmount > 0
      ? `
          <div
            style="
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 12px 16px;
              margin: 16px 0;
              border-radius: 4px;
            "
          >
            <p style="margin: 0; color: #1e40af; font-weight: 600">💼 Wallet Update</p>
            <p style="margin: 6px 0 0; color: #1e3a8a">
              Your customer wallet balance of <strong>${transferAmount.toLocaleString()}</strong> has been
              transferred to your <strong>business wallet</strong> so you can start trading immediately.
            </p>
          </div>
        `
      : '';
  return `
 <!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Business Approved</title>
  </head>
  <body
    style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial;
      background: #f6f9fc;
      margin: 0;
      padding: 20px;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="
        max-width: 700px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      "
    >
      <tr
        style="
          background: linear-gradient(90deg, #1e3a8a, #3b82f6);
          color: #fff;
        "
      >
        <td style="padding: 20px 24px">
          <h1 style="margin: 0; font-size: 20px">🎉 Business Approved!</h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px; color: #0f172a">
          <p style="font-size: 16px; margin: 0 0 12px">
            Hi <strong>${username}</strong>,
          </p>
          <p style="margin: 0 0 16px">
            Your business registration has been <strong>approved</strong>. You
            can now access all business features in your dashboard using your
            existing account.
          </p>

          <div
            style="
              background: #ecfdf5;
              border-left: 4px solid #10b981;
              padding: 12px 16px;
              margin: 16px 0;
              border-radius: 4px;
            "
          >
            <p style="margin: 0; color: #065f46; font-weight: 600">
              🎁 Welcome Gift!
            </p>
            <p style="margin: 6px 0 0; color: #047857">
              You have been gifted a <strong>free trial subscription</strong> to
              get started with all premium features!
            </p>
          </div>

          ${transferBlock}

          <div
            style="
              background: #f8fafc;
              border-left: 4px solid #94a3b8;
              padding: 12px 16px;
              margin: 16px 0;
              border-radius: 4px;
            "
          >
            <p style="margin: 0; color: #0f172a; font-weight: 600">
              👁️ Customer Profile Access
            </p>
            <p style="margin: 6px 0 0; color: #334155">
              You can still view your previous <strong>customer profile</strong> and
              <strong>history</strong>, but you can no longer use or edit customer features.
              For transactions and settings, please use your <strong>business dashboard</strong>.
            </p>
          </div>

          <p
            style="
              color: #475569;
              font-size: 13px;
              margin: 8px 0 0;
              line-height: 1.6;
            "
          >
            🔑 You can log in with your existing credentials and start using all
            business features immediately.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 14px 0 0">
            💡 Need help getting started? Contact our support team anytime.
          </p>
        </td>
      </tr>
      <tr>
        <td
          style="
            background: #f1f5f9;
            padding: 16px 24px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          "
        >
          <p style="margin: 0">
            © ${new Date().getFullYear()} Back 2 Use — All Rights Reserved
          </p>
          <p style="margin: 4px 0 0">
            Questions?
            <a
              href="mailto:support@back2use.com"
              style="color: #2563eb; text-decoration: none"
              >Contact Support</a
            >
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

export function businessRejectedTemplate(username: string, note: string) {
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
  <tr><td style="padding:18px 24px; color:#0f172a;"><p style="margin:0 0 12px;">Hello <strong>${username}</strong>,</p>
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
