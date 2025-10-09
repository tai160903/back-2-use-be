export function otpForgotPasswordTemplate(name: string, otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>Password Reset OTP</h2>
      <p>Hello <b>${name}</b>,</p>
      <p>You requested to reset your password. Please use the OTP code below to proceed:</p>
      <div style="font-size: 2em; font-weight: bold; color: #007bff; margin: 16px 0;">${otp}</div>
      <p>This OTP is valid for a limited time. If you did not request a password reset, please ignore this email.</p>
      <br>
      <p>Thank you,<br>Back2Use Team</p>
    </div>
  `;
}
