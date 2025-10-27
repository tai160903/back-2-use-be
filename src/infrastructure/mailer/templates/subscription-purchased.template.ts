export function subscriptionPurchasedTemplate(
  businessName: string,
  subscriptionName: string,
  startDate: string,
  endDate: string,
  isScheduled: boolean,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Subscription Purchased Successfully</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Hello ${businessName},</p>
        
        <p>Thank you for purchasing the <strong>${subscriptionName}</strong> subscription!</p>
        
        ${
          isScheduled
            ? '<p style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;"><strong>Note:</strong> Your new subscription will activate automatically after your current plan expires.</p>'
            : '<p style="background-color: #d4edda; padding: 10px; border-left: 4px solid #28a745;">Your subscription is now active!</p>'
        }
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Subscription Details:</h3>
          <p><strong>Plan:</strong> ${subscriptionName}</p>
          <p><strong>Start Date:</strong> ${startDate}</p>
          <p><strong>End Date:</strong> ${endDate}</p>
        </div>
        
        <p>You can now enjoy all the benefits of your subscription plan.</p>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        
        <br>
        <p>Best regards,<br><strong>Back2Use Team</strong></p>
      </div>
      
      <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Back2Use. All rights reserved.</p>
      </div>
    </div>
  `;
}
