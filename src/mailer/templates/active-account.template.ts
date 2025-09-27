export const activeAccountTemplate = (name: string, activeLink: string) => `
  <div style="font-family: Arial, sans-serif;">
    <h2>Hello ${name},</h2>
    <p>Thank you for registering an account with Back2Use.</p>
    <p>Please click the link below to activate your account:</p>
    <a href="${activeLink}" style="color: #1976d2;">Activate Account</a>
    <p>If you did not register, please ignore this email.</p>
    <br>
    <p>Best regards,<br>Back2Use Team</p>
  </div>
`;
