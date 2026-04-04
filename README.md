# Portfolio Site

Personal portfolio website built with Astro and deployed to Kubernetes.

**Live URL:** https://tohouri.com

## Project Structure

```
portfolio-site/
├── src/
│   ├── content/resume/          # Resume content (Markdown)
│   │   ├── romain-rolland-resume.md     # English resume
│   │   └── romain-rolland-resume-fr.md  # French resume
│   ├── pages/                   # Site pages
│   │   ├── index.astro          # Home page (EN)
│   │   ├── experience.astro     # Experience page (EN)
│   │   ├── projects.astro       # Projects page (EN)
│   │   ├── skills.astro         # Skills page (EN)
│   │   ├── contact.astro        # Contact page (EN)
│   │   └── fr/                  # French versions
│   ├── layouts/                 # Page layouts
│   ├── styles/                  # CSS styles
│   └── i18n/                    # Internationalization
├── public/images/               # Static images
├── k8s/                         # Kubernetes manifests
├── contact-api/                 # Contact form backend
├── Dockerfile                   # Multi-stage Docker build
└── package.json
```

## Updating Content

### Resume/CV Information
Edit the markdown files in `src/content/resume/`:
- **English:** `src/content/resume/romain-rolland-resume.md`
- **French:** `src/content/resume/romain-rolland-resume-fr.md`

### Page Content
Edit the `.astro` files in `src/pages/`:
- **Home:** `src/pages/index.astro` (EN) / `src/pages/fr/index.astro` (FR)
- **Experience:** `src/pages/experience.astro`
- **Projects:** `src/pages/projects.astro`
- **Skills:** `src/pages/skills.astro`
- **Contact:** `src/pages/contact.astro`

### Images
Add images to `public/images/` and reference them in your pages.

## Local Development

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev

# Preview at http://localhost:4321
```

## Build & Deploy

### Quick Deploy (One Command)

```bash
# From portfolio-site directory
VERSION=v1.6  # Increment version number

# Build, push, and deploy
docker buildx build --platform linux/amd64 -t romyt/rt-portfolio-site:$VERSION -t romyt/rt-portfolio-site:latest --push . && \
sed -i '' "s|image: romyt/rt-portfolio-site:v[0-9.]*|image: romyt/rt-portfolio-site:$VERSION|" k8s/deployment.yaml && \
../../yalim-kaas/scripts/kubectl.sh apply -f k8s/ && \
../../yalim-kaas/scripts/kubectl.sh rollout restart deployment/portfolio-site -n portfolio
```

### Step-by-Step Deploy

1. **Build Docker image for linux/amd64:**
   ```bash
   docker buildx build --platform linux/amd64 \
     -t romyt/rt-portfolio-site:v1.6 \
     -t romyt/rt-portfolio-site:latest \
     --push .
   ```

2. **Update deployment version in `k8s/deployment.yaml`:**
   ```yaml
   image: romyt/rt-portfolio-site:v1.6  # Update version
   ```

3. **Apply Kubernetes manifests:**
   ```bash
   ../../yalim-kaas/scripts/kubectl.sh apply -f k8s/
   ```

4. **Restart deployment to pull new image:**
   ```bash
   ../../yalim-kaas/scripts/kubectl.sh rollout restart deployment/portfolio-site -n portfolio
   ```

5. **Verify deployment:**
   ```bash
   ../../yalim-kaas/scripts/kubectl.sh rollout status deployment/portfolio-site -n portfolio
   ../../yalim-kaas/scripts/kubectl.sh get pods -n portfolio
   ```

## Important Notes

- **Platform:** Always build with `--platform linux/amd64` (cluster runs AMD64)
- **Image Registry:** Docker Hub (`romyt/rt-portfolio-site`)
- **Namespace:** `portfolio`
- **Current Version:** Check `k8s/deployment.yaml` for current image tag

## Troubleshooting

### ImagePullBackOff Error
Usually caused by wrong platform. Rebuild with:
```bash
docker buildx build --platform linux/amd64 -t romyt/rt-portfolio-site:vX.X --push .
```

### Check Pod Status
```bash
../../yalim-kaas/scripts/kubectl.sh get pods -n portfolio
../../yalim-kaas/scripts/kubectl.sh describe pod <pod-name> -n portfolio
../../yalim-kaas/scripts/kubectl.sh logs <pod-name> -n portfolio
```

### Force Pod Restart
```bash
../../yalim-kaas/scripts/kubectl.sh rollout restart deployment/portfolio-site -n portfolio
```
