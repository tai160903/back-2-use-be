export function subscriptionExpiredTemplate(
  businessName: string,
  subscriptionName: string,
  endDate: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f44336; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Subscription Expired</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Hello ${businessName},</p>
        
        <p>Your <strong>${subscriptionName}</strong> subscription has expired on <strong>${endDate}</strong>.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 5px;">
          <p style="margin: 0;"><strong>⚠️ Important:</strong> Your access to premium features has been suspended. Please renew your subscription to continue enjoying our services.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://back2use.com'}/subscriptions" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Renew Subscription
          </a>
        </div>
        
        <p>We'd love to have you back! Renew now to regain access to all features.</p>
        
        <p>If you have any questions, our support team is here to help.</p>
        
        <br>
        <p>Best regards,<br><strong>Back2Use Team</strong></p>
      </div>
      
      <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Back2Use. All rights reserved.</p>
      </div>
    </div>
  `;
}
