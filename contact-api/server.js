import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BrevoClient } from '@getbrevo/brevo';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Initialize Brevo API v6
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

// Validation helper
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message, subject } = req.body;

  // Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Rate limiting check (basic)
  // In production, use Redis or similar for distributed rate limiting
  
  try {
    // Prepare email data using Brevo v6 API
    const emailData = {
      sender: {
        name: process.env.FROM_NAME || 'Portfolio Contact',
        email: process.env.FROM_EMAIL || 'no-reply@tohouri.com'
      },
      to: [{
        email: process.env.TO_EMAIL || 'romain@tohouri.com',
        name: process.env.TO_NAME || 'Romain Tohouri'
      }],
      subject: subject || `New Contact Form Submission from ${name}`,
      replyTo: {
        email: email,
        name: name
      },
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Contact Form Submission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #666; }
        .field-value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 4px; }
        .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
            <div class="field">
                <div class="field-label">From:</div>
                <div class="field-value">${name}</div>
            </div>
            <div class="field">
                <div class="field-label">Email:</div>
                <div class="field-value"><a href="mailto:${email}">${email}</a></div>
            </div>
            <div class="field">
                <div class="field-label">Message:</div>
                <div class="field-value">${message.replace(/\n/g, '<br>')}</div>
            </div>
        </div>
        <div class="footer">
            <p>This message was sent via the contact form on tohouri.com</p>
            <p>Received at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST</p>
        </div>
    </div>
</body>
</html>`,
      textContent: `
New Contact Form Submission

From: ${name}
Email: ${email}

Message:
${message}

---
This message was sent via the contact form on tohouri.com
Received at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
`
    };

    // Send email via Brevo v6 API
    const data = await brevo.transactionalEmails.sendTransacEmail(emailData);
    
    console.log(`[${new Date().toISOString()}] Contact form email sent successfully.`);
    console.log(`[DEBUG] Brevo API response:`, JSON.stringify(data, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Your message has been sent successfully. I will get back to you soon!',
      messageId: data.messageId || data.response?.messageId || 'sent'
    });
    
  } catch (error) {
    console.error('[ERROR] Failed to send contact form email:');
    console.error('[ERROR] Error type:', error.constructor.name);
    console.error('[ERROR] Error message:', error.message);
    if (error.response) {
      console.error('[ERROR] Brevo API response:', JSON.stringify(error.response, null, 2));
    }
    if (error.body) {
      console.error('[ERROR] Brevo API body:', JSON.stringify(error.body, null, 2));
    }
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: 'Failed to send message. Please try again later or email directly at romain@tohouri.com' 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio Contact API running on port ${PORT}`);
  console.log(`Brevo API configured: ${!!process.env.BREVO_API_KEY}`);
  console.log(`Allowed origins: ${process.env.ALLOWED_ORIGINS || '*'}`);
});
