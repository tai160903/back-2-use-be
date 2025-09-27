export const forgotPasswordTemplate = (name: string, resetLink: string) => `
  <div style="font-family: Arial, sans-serif;">
    <h2>Hello ${name},</h2>
    <p>You have requested to reset your account password.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetLink}" style="color: #1976d2;">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
    <br>
    <p>Best regards,<br>Back2Use Team</p>
  </div>
`;
