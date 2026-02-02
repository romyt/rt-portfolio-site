# Portfolio Contact API

A lightweight Node.js/Express API service that handles contact form submissions for the portfolio site using Brevo (formerly Sendinblue) email service.

## Features

- ✉️ Contact form submission handling
- 🔒 Input validation (name, email, message)
- 🌐 CORS support with configurable origins
- 🏥 Health check endpoint
- 📧 Brevo transactional email integration
- 🎨 HTML and plain text email formatting

## Prerequisites

- Node.js 20+ 
- Brevo API key ([Get one here](https://app.brevo.com/settings/keys/api))
- Docker (for containerized deployment)

## Local Development

1. **Install dependencies**:
   ```bash
   cd contact-api
   npm install
   ```

2. **Create `.env` file** from example:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** in `.env`:
   ```env
   BREVO_API_KEY=your-actual-brevo-api-key
   FROM_NAME=Romain Tohouri
   FROM_EMAIL=no-reply@tohouri.com
   TO_EMAIL=romain@tohouri.com
   TO_NAME=Romain Tohouri
   ALLOWED_ORIGINS=http://localhost:4321,https://tohouri.com
   PORT=3000
   ```

4. **Run in development**:
   ```bash
   npm run dev
   ```

5. **Test the API**:
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Submit contact form
   curl -X POST http://localhost:3000/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "subject": "Test Message",
       "message": "This is a test message from the contact form."
     }'
   ```

## Docker Build

```bash
cd contact-api

# Build image
docker build -t romyt/portfolio-contact-api:v1.0 .

# Run locally
docker run -p 3000:3000 \
  -e BREVO_API_KEY=your-key \
  -e FROM_EMAIL=no-reply@tohouri.com \
  -e TO_EMAIL=romain@tohouri.com \
  romyt/portfolio-contact-api:v1.0

# Build multi-platform and push
docker buildx build --platform linux/amd64,linux/arm64 \
  -t romyt/portfolio-contact-api:v1.0 --push .
```

## Kubernetes Deployment

1. **Update the secret** with your Brevo API key:
   ```bash
   cd ../k8s
   
   # Edit contact-api-secret.yaml and add your BREVO_API_KEY
   nano contact-api-secret.yaml
   ```

2. **Deploy to cluster**:
   ```bash
   # Apply secret
   kubectl apply -f contact-api-secret.yaml -n portfolio
   
   # Deploy API
   kubectl apply -f contact-api-deployment.yaml -n portfolio
   
   # Update ingress (already configured)
   kubectl apply -f ingress.yaml -n portfolio
   ```

3. **Verify deployment**:
   ```bash
   kubectl get pods -n portfolio -l app=contact-api
   kubectl logs -n portfolio -l app=contact-api --tail=50
   ```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-30T23:00:00.000Z"
}
```

### `POST /api/contact`
Submit contact form.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Optional subject line",
  "message": "Your message here"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Your message has been sent successfully. I will get back to you soon!",
  "messageId": "brevo-message-id"
}
```

**Error Response** (400/500):
```json
{
  "error": "Error description"
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BREVO_API_KEY` | Yes | - | Brevo API key for sending emails |
| `FROM_NAME` | No | Portfolio Contact | Sender name in emails |
| `FROM_EMAIL` | No | no-reply@tohouri.com | Sender email address |
| `TO_EMAIL` | No | romain@tohouri.com | Recipient email address |
| `TO_NAME` | No | Romain Tohouri | Recipient name |
| `ALLOWED_ORIGINS` | No | * | Comma-separated list of allowed CORS origins |
| `PORT` | No | 3000 | Server port |

## Security Considerations

- ✅ CORS is configured to only allow requests from tohouri.com domains
- ✅ Input validation prevents empty or malformed data
- ✅ Email addresses are validated using regex
- ✅ Internal errors are not exposed to clients
- ⚠️ **TODO**: Add rate limiting (consider using express-rate-limit or Redis)
- ⚠️ **TODO**: Add honeypot field to prevent spam bots
- ⚠️ **TODO**: Add CAPTCHA (optional, based on spam volume)

## Troubleshooting

### Email not sending
1. Check Brevo API key is correct
2. Verify Brevo account is active and has remaining email quota
3. Check logs: `kubectl logs -n portfolio -l app=contact-api`
4. Test Brevo API directly: https://api.brevo.com/v3/smtp/email

### CORS errors
- Verify `ALLOWED_ORIGINS` includes your domain
- Check browser console for specific CORS error
- Test with curl (bypasses CORS): `curl -X POST https://tohouri.com/api/contact ...`

### Pod not starting
```bash
# Check pod status
kubectl describe pod -n portfolio -l app=contact-api

# Common issues:
# - Missing secret: kubectl get secret contact-api-secret -n portfolio
# - Image pull error: Verify image exists on Docker Hub
# - Crash loop: Check logs for startup errors
```

## License

Private - Part of Romain Tohouri's portfolio infrastructure.
