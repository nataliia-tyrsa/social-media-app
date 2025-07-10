import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    if (this.isDevelopment && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
      console.log('📧 Email service running in development mode - emails will be logged to console');
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    } else {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"ICHGGRAM" <${process.env.EMAIL_USER || 'noreply@ichggram.com'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      if (this.isDevelopment && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
        console.log('\n📧 ===== EMAIL WOULD BE SENT =====');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Text: ${options.text}`);
        console.log('================================\n');
        return;
      }

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      

      if (this.isDevelopment) {
        console.log('📧 Email sending failed in development mode, but continuing...');
        return;
      }
      
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password-confirm?token=${resetToken}`;
    
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ICHGGRAM</h1>
        </div>
        
        <div style="padding: 40px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            You requested to reset your password. Click the button below to set a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #0095f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This link will expire in 15 minutes. If you didn't request this, please ignore this email.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Or copy and paste this link: <br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      </div>
    `;

    const textContent = `
      ICHGGRAM - Reset Your Password
      
      You requested to reset your password. 
      Click the link below to set a new password:
      
      ${resetUrl}
      
      This link will expire in 15 minutes.
      If you didn't request this, please ignore this email.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your ICHGGRAM Password',
      text: textContent,
      html: htmlContent
    });
  }

  async sendPasswordResetSuccess(email: string): Promise<void> {
    const subject = 'Password Changed Successfully - ICHGGRAM';
    
    const text = `
    Hi there!
    
    Your password has been successfully changed.
    
    If you didn't make this change, please contact our support immediately.
    
    Best regards,
    ICHGGRAM Team
    `;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #262626; font-size: 24px; margin: 0;">ICHGGRAM</h1>
      </div>
      
      <div style="background: #d4edda; padding: 30px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
        <h2 style="color: #155724; margin-top: 0;">Password Changed Successfully</h2>
        <p style="color: #155724; line-height: 1.5;">
          Your password has been successfully updated. You can now use your new password to log in.
        </p>
        <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
          If you didn't make this change, please contact our support team immediately.
        </p>
      </div>
      
      <div style="text-align: center; color: #888; font-size: 12px;">
        <p>© 2024 ICHGGRAM. All rights reserved.</p>
      </div>
    </div>
    `;

    await this.sendEmail({
      to: email,
      subject,
      text,
      html
    });
  }
}

const emailService = new EmailService();
export default emailService; 
