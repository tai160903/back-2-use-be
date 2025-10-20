export function blockNotificationTemplate(
  name: string,
  isBlocked: boolean,
  reason?: string,
): string {
  const statusColor = isBlocked ? '#dc2626' : '#16a34a';
  const title = isBlocked
    ? 'Your Account Has Been Blocked'
    : 'Your Account Has Been Unblocked';
  const message = isBlocked
    ? `We regret to inform you that your account has been temporarily <b>blocked</b> due to the following reason:`
    : `Good news! Your account has been <b>unblocked</b> and you can now continue using our services.`;
  const reasonText = `<p style="margin: 10px 0; font-style: italic; color: #374151;">Reason: ${
    reason || 'No reason provided.'
  }</p>`;

  return `
  <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://i.ibb.co/prK2dhJH/logo-back2use.jpg" alt="Back2Use" width="100" />
      </div>
      <h2 style="color: ${statusColor}; text-align: center;">${title}</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>${message}</p>
      ${reasonText}
      <p>
        If you believe this was a mistake or need assistance,
        please contact our support team at
        <a href="mailto:passback2use@gmail.com" style="color: #3b82f6; text-decoration: none;">
          passback2use@gmail.com
        </a>.
      </p>
      <br />
      <p style="color: #6b7280;">Thank you,<br />The Back2Use Support Team</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        © ${new Date().getFullYear()} Back2Use. All rights reserved.
      </p>
    </div>
  </div>
  `;
}
