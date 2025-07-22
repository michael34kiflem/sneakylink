import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendPasswordReset = async ({ email, name, OTP }) => {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 25px;">
              <h2 style="color: #059669; margin: 0;">Password Reset Request</h2>
            </div>
            
            <p style="margin-bottom: 20px;">Dear ${name},</p>
            
            <p style="margin-bottom: 20px;">We received a request to reset your password. Use the following OTP to verify your identity:</p>
            
            <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; margin: 25px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #059669;">
              ${OTP}
            </div>
            
            <p style="margin-bottom: 20px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email or contact our support team immediately.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p style="margin: 5px 0;">For security reasons, never share this code with anyone.</p>
              <p style="margin: 5px 0;">If you need assistance, contact our support team at support@yourcompany.com</p>
              <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'michaelkifle321@gmail.com',
              pass: 'mryi qknl iafu zszd',
            }
        });

        const mailOptions = {
          from: 'michaelkifle321@gmail.com',
          to: email,
          subject: 'Password reset OTP',
          html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`, info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};