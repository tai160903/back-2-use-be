export function autoRenewalFailedTemplate(
  businessName: string,
  subscriptionName: string,
  expiryDate: string,
  requiredAmount: number,
  availableBalance: number,
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #f44336; }
          .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Auto-Renewal Failed</h1>
          </div>
          <div class="content">
            <p>Dear ${businessName},</p>
            
            <div class="alert">
              <p><strong>Action Required:</strong> Your subscription auto-renewal could not be processed due to insufficient wallet balance.</p>
            </div>
            
            <div class="details">
              <p><strong>Subscription:</strong> ${subscriptionName}</p>
              <p><strong>Expiry Date:</strong> ${expiryDate}</p>
              <p><strong>Required Amount:</strong> ${requiredAmount.toLocaleString()} VND</p>
              <p><strong>Available Balance:</strong> ${availableBalance.toLocaleString()} VND</p>
              <p><strong>Shortage:</strong> ${(requiredAmount - availableBalance).toLocaleString()} VND</p>
            </div>
            
            <p>To ensure uninterrupted service, please add funds to your wallet before your subscription expires.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://back2use.com'}/wallet" class="button">
                Add Funds to Wallet
              </a>
            </div>
            
            <p>Alternatively, you can manually renew your subscription or disable auto-renewal from your account settings.</p>
            
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
