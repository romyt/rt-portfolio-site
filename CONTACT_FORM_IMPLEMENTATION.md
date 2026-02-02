# Contact Form Implementation Summary

## ✅ What Was Implemented

Your portfolio now has a **secure contact form** instead of displaying your email address directly, protecting you from spam while using the same Brevo email service as your DHIS2-Portal application.

## 📦 New Components

### 1. Contact API Service (`/contact-api/`)
A lightweight Node.js/Express microservice that:
- Receives contact form submissions via POST `/api/contact`
- Validates input (name, email, message)
- Sends emails via Brevo API
- Includes health check endpoint at `/health`
- Runs as a separate containerized service alongside your portfolio

**Files created:**
- `contact-api/server.js` - Main API server
- `contact-api/package.json` - Node.js dependencies  
- `contact-api/Dockerfile` - Multi-stage Docker build
- `contact-api/.env.example` - Environment variables template
- `contact-api/README.md` - Complete documentation

### 2. Updated Portfolio Pages
- `src/pages/contact.astro` - English contact form with live validation
- `src/pages/fr/contact.astro` - French contact form (bilingual support)

Both pages now feature:
- Clean, modern contact form (name, email, subject, message)
- Client-side validation
- Loading states during submission
- Success/error messages
- No email address displayed (spam protection!)

### 3. Kubernetes Resources (`/k8s/`)
- `contact-api-secret.yaml` - Stores Brevo API key securely
- `contact-api-deployment.yaml` - Deploys 2 replicas with health checks
- `ingress.yaml` - Updated to route `/api/*` to contact API

## 🚀 Deployment Steps

### Step 1: Get Your Brevo API Key

1. Log in to [Brevo](https://app.brevo.com/)
2. Go to Settings → API Keys → Create a new API key
3. Copy the key (starts with `xkeysib-...`)

### Step 2: Update Kubernetes Secret

```bash
cd /Users/rtohouri/Documents/CloudStation/DevOps/yalim-infrastructure/portfolio-site/k8s

# Edit the secret file
nano contact-api-secret.yaml

# Replace YOUR_BREVO_API_KEY_HERE with your actual Brevo API key
```

### Step 3: Build and Push Contact API Docker Image

```bash
cd ../contact-api

# Install dependencies first
npm install

# Build and push multi-platform image
docker buildx build --platform linux/amd64,linux/arm64 \
  -t romyt/portfolio-contact-api:v1.0 --push .
```

### Step 4: Rebuild Portfolio with Updated Contact Pages

```bash
cd ..

# Build portfolio site
docker buildx build --no-cache --platform linux/amd64,linux/arm64 \
  -t romyt/rt-portfolio-site:v1.3 --push .
```

### Step 5: Deploy to Kubernetes

```bash
cd ../yalim-kaas

# Deploy contact API secret
./scripts/kubectl.sh apply -f ../portfolio-site/k8s/contact-api-secret.yaml

# Deploy contact API service
./scripts/kubectl.sh apply -f ../portfolio-site/k8s/contact-api-deployment.yaml

# Update portfolio deployment image tag
# Edit ../portfolio-site/k8s/deployment.yaml and change image to v1.3

# Apply updated portfolio deployment
./scripts/kubectl.sh apply -f ../portfolio-site/k8s/deployment.yaml

# Update ingress to route /api/* to contact-api
./scripts/kubectl.sh apply -f ../portfolio-site/k8s/ingress.yaml
```

### Step 6: Verify Deployment

```bash
# Check all pods are running
./scripts/kubectl.sh get pods -n portfolio

# Expected output:
# NAME                             READY   STATUS    RESTARTS   AGE
# contact-api-xxx                  1/1     Running   0          1m
# contact-api-yyy                  1/1     Running   0          1m
# portfolio-site-xxx               1/1     Running   0          2m

# Check contact API logs
./scripts/kubectl.sh logs -n portfolio -l app=contact-api --tail=20

# Test health endpoint
curl https://tohouri.com/api/health
```

### Step 7: Test Contact Form

1. Open https://tohouri.com/contact in your browser
2. Fill out the contact form with test data
3. Click "Send Message"
4. You should see a success message and receive an email at romain@tohouri.com

Test French version: https://tohouri.com/fr/contact

## 🔒 Security Features

✅ **No email exposure** - Email address no longer visible on website  
✅ **CORS protection** - Only tohouri.com domains can submit forms  
✅ **Input validation** - Server-side validation prevents invalid data  
✅ **Email validation** - Regex check ensures valid email format  
✅ **Rate limiting ready** - TODO: Add Redis-based rate limiting in production  
✅ **Reply-to header** - Emails include sender's email for easy replies  
✅ **Error handling** - Internal errors not exposed to clients

## 📧 Email Format

When someone submits the contact form, you'll receive an email with:

**From**: Portfolio Contact <no-reply@tohouri.com>  
**Reply-To**: [Sender's actual email]  
**Subject**: [Custom subject] or "New Contact Form Submission from [Name]"

The email includes:
- Sender's name
- Sender's email (clickable mailto link)
- Message content  
- Timestamp

## 🛠️ How It Works

```
User fills form → tohouri.com/contact
        ↓
JavaScript POST → /api/contact
        ↓
Nginx Ingress routes to contact-api service
        ↓
Express validates input
        ↓
Brevo API sends email to romain@tohouri.com
        ↓
Success message shown to user
```

## 📝 Environment Variables (Already Configured in Secret)

- `BREVO_API_KEY` - Your Brevo API key **(REQUIRED - UPDATE THIS!)**
- `FROM_NAME` - "Romain Tohouri"
- `FROM_EMAIL` - "no-reply@tohouri.com"
- `TO_EMAIL` - "romain@tohouri.com"  
- `TO_NAME` - "Romain Tohouri"
- `ALLOWED_ORIGINS` - "https://tohouri.com,https://www.tohouri.com"

## 🐛 Troubleshooting

### Form submission fails with network error
```bash
# Check contact API is running
./scripts/kubectl.sh get pods -n portfolio -l app=contact-api

# Check API logs for errors
./scripts/kubectl.sh logs -n portfolio -l app=contact-api --tail=50

# Test API directly (bypass frontend)
curl -X POST https://tohouri.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

### Email not received
1. Check Brevo dashboard for email delivery status
2. Verify Brevo API key is correct in the secret
3. Check spam folder
4. Verify sender domain (no-reply@tohouri.com) is authorized in Brevo

### CORS error in browser
- Verify `ALLOWED_ORIGINS` in secret includes your domain
- Check browser console for specific error
- Ensure ingress is routing `/api/*` correctly

## 🎯 Next Steps (Optional Enhancements)

1. **Add rate limiting** - Prevent abuse with express-rate-limit or Redis
2. **Add CAPTCHA** - Integrate Cloudflare Turnstile (you already use it in dhis2-portal)
3. **Add honeypot field** - Hidden field to catch spam bots
4. **Email notifications** - Get notified immediately via push/SMS
5. **Auto-responder** - Send confirmation email to form submitters
6. **Save to database** - Store form submissions for reference

## 📄 Files Modified/Created

**New files:**
- `portfolio-site/contact-api/*` (all files)
- `portfolio-site/k8s/contact-api-secret.yaml`
- `portfolio-site/k8s/contact-api-deployment.yaml`
- `portfolio-site/CONTACT_FORM_IMPLEMENTATION.md` (this file)

**Modified files:**
- `portfolio-site/src/pages/contact.astro` - Contact form instead of email display
- `portfolio-site/src/pages/fr/contact.astro` - French contact form
- `portfolio-site/k8s/ingress.yaml` - Added `/api/*` route to contact-api

## ✅ Benefits

1. **Spam protection** - Email not visible to scrapers/bots
2. **User experience** - No need to open email client
3. **Professional** - Matches modern web standards  
4. **Proven technology** - Same stack as your dhis2-portal
5. **Bilingual** - Works in both English and French
6. **Scalable** - Runs 2 replicas with health checks
7. **Maintainable** - Simple Node.js/Express code

---

**Status**: ✅ Implementation complete - Ready for deployment!

**Next action**: Follow deployment steps above to make contact form live.
