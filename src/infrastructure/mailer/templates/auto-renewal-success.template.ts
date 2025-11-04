export function autoRenewalSuccessTemplate(
  businessName: string,
  subscriptionName: string,
  startDate: string,
  endDate: string,
  amount: number,
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Subscription Auto-Renewed</h1>
          </div>
          <div class="content">
            <p>Dear ${businessName},</p>
            
            <p>Great news! Your subscription has been automatically renewed.</p>
            
            <div class="details">
              <p><strong>Subscription:</strong> ${subscriptionName}</p>
              <p><strong>Start Date:</strong> ${startDate}</p>
              <p><strong>End Date:</strong> ${endDate}</p>
              <p><strong>Amount Charged:</strong> ${amount.toLocaleString()} VND</p>
            </div>
            
            <p>Your subscription will seamlessly continue without any interruption to your service.</p>
            
            <p>You can manage your auto-renewal settings anytime from your account dashboard.</p>
            
            <p>Thank you for your continued trust in our service!</p>
            
            <div class="footer">
              <p>This is an automated message from Back2Use</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
