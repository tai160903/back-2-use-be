export function rewardPointsPurchasedTemplate(
  businessName: string,
  packageName: string,
  points: number,
  amount: number,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #FF9800; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎁 Reward Points Purchased</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Hello ${businessName},</p>
        
        <p>Great news! You have successfully purchased reward points for your business.</p>
        
        <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745; border-radius: 5px;">
          <p style="margin: 0;"><strong>✅ Purchase Confirmed!</strong> Your reward points have been added to your account.</p>
        </div>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #FF9800;">
          <h3 style="margin-top: 0; color: #FF9800;">Purchase Details</h3>
          <p><strong>Package:</strong> ${packageName}</p>
          <p><strong>Reward Points:</strong> <span style="color: #FF9800; font-weight: bold; font-size: 18px;">+${points}</span></p>
          <p><strong>Amount Paid:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
        </div>
        
        <div style="background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h4 style="margin-top: 0; color: #2e7d32;">💡 How to Use Your Reward Points</h4>
          <p>Your reward points can be used to:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Redeem for discounts on subscriptions</li>
            <li>Unlock exclusive features</li>
            <li>Access premium services</li>
          </ul>
        </div>
        
        <p>View your current reward points balance anytime in your account dashboard.</p>
        
        <p>Thank you for choosing Back2Use! If you have any questions, our support team is here to help.</p>
        
        <br>
        <p>Best regards,<br><strong>Back2Use Team</strong></p>
      </div>
      
      <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Back2Use. All rights reserved.</p>
      </div>
    </div>
  `;
}
