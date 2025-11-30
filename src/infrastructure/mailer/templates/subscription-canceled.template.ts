export const subscriptionCanceledTemplate = (
  businessName: string,
  subscriptionName: string,
  refundAmount: number,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f44336;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
          border-top: none;
        }
        .info-box {
          background-color: white;
          border-left: 4px solid #f44336;
          padding: 15px;
          margin: 20px 0;
        }
        .refund-box {
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
        h1 {
          margin: 0;
          font-size: 24px;
        }
        h2 {
          color: #f44336;
          font-size: 20px;
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #4caf50;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Subscription Cancelled</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${businessName}</strong>,</p>
        
        <p>This email confirms that your pending subscription has been successfully cancelled.</p>
        
        <div class="info-box">
          <h2>Cancelled Subscription Details</h2>
          <p><strong>Subscription Plan:</strong> ${subscriptionName}</p>
          <p><strong>Status:</strong> Cancelled</p>
        </div>
        
        <div class="refund-box">
          <h2>Refund Processed</h2>
          <p>The subscription fee has been refunded to your wallet:</p>
          <p class="amount">$${refundAmount.toFixed(2)}</p>
          <p>The refunded amount is now available in your wallet balance.</p>
        </div>
        
        <p>You can purchase a new subscription anytime from your business dashboard.</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Thank you for using our service!</p>
        
        <p>Best regards,<br>
        <strong>Back2Use Team</strong></p>
      </div>
      <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;
};
