export function otpEmailTemplate(name: string, otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>Account Verification</h2>
      <p>Hello ${name},</p>
      <p>Your OTP code for account verification is:</p>
      <p style="font-size: 2em; font-weight: bold; letter-spacing: 2px;">${otp}</p>
      <p>Please enter this code to verify your account.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br>
      <p>Thank you,<br>Back2Use Team</p>
    </div>
  `;
}
