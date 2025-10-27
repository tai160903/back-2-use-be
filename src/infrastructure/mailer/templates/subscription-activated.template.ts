export function subscriptionActivatedTemplate(
  businessName: string,
  subscriptionName: string,
  startDate: string,
  endDate: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2196F3; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Subscription Activated</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Hello ${businessName},</p>
        
        <p>Great news! Your <strong>${subscriptionName}</strong> subscription is now active.</p>
        
        <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745; border-radius: 5px;">
          <p style="margin: 0;"><strong>✅ Your subscription is active!</strong> You now have full access to all premium features.</p>
        </div>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Subscription Details:</h3>
          <p><strong>Plan:</strong> ${subscriptionName}</p>
          <p><strong>Started:</strong> ${startDate}</p>
          <p><strong>Valid Until:</strong> ${endDate}</p>
        </div>
        
        <p>Make the most of your subscription and enjoy all the premium features we offer.</p>
        
        <p>If you need any assistance, our support team is always ready to help.</p>
        
        <br>
        <p>Best regards,<br><strong>Back2Use Team</strong></p>
      </div>
      
      <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Back2Use. All rights reserved.</p>
      </div>
    </div>
  `;
}
