export function subscriptionExpiringSoonTemplate(
  businessName: string,
  subscriptionName: string,
  endDate: string,
  daysRemaining: number,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #FF9800; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Subscription Expiring Soon</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Hello ${businessName},</p>
        
        <p>This is a friendly reminder that your <strong>${subscriptionName}</strong> subscription will expire soon.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 5px;">
          <p style="margin: 0; font-size: 16px;"><strong>⏰ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining!</strong></p>
          <p style="margin: 10px 0 0 0;">Expiration Date: <strong>${endDate}</strong></p>
        </div>
        
        <p>Don't miss out on your premium features! Renew your subscription now to avoid any interruption in service.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://back2use.com'}/subscriptions" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Renew Now
          </a>
        </div>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">What happens after expiration?</h3>
          <ul style="line-height: 1.8;">
            <li>Access to premium features will be suspended</li>
            <li>You can renew anytime to restore your access</li>
            <li>Your data will be safely preserved</li>
          </ul>
        </div>
        
        <p>If you have any questions or need assistance with renewal, please contact our support team.</p>
        
        <br>
        <p>Best regards,<br><strong>Back2Use Team</strong></p>
      </div>
      
      <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Back2Use. All rights reserved.</p>
      </div>
    </div>
  `;
}
