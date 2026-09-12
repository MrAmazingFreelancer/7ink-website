# 7ink.com.au Website

Website source and Vercel deployment for 7ink.com.au.

Vercel hosts and deploys this website. DNS is managed separately with the domain's current provider.
The static site is served from the repository root, as configured in `vercel.json`.
`npm run build` does not generate or copy assets. Deploy through the existing Vercel Git integration.

## Quick Start

See [QUICK_SETUP.md](QUICK_SETUP.md) for deployment instructions.

## Setup

- **Domain**: Crazy Domains (7ink.com.au)
- **DNS**: Current domain DNS provider; use the records shown by Vercel
- **Deployment**: Vercel
- **Repository**: GitHub

## Files

- `package.json` - Build configuration
- `vercel.json` - Vercel deployment settings
- `.gitignore` - Git ignore rules
- `DEPLOYMENT_GUIDE.md` - Complete setup guide
- `QUICK_SETUP.md` - Quick reference guide
- `CODEX_CONNECTOR.md` - ChatGPT Codex Connector setup guide

## Development

Work on files in this website repository:
```bash
D:\MyProjects-Dashboard\7Ink\7Ink-Website
```

When ready to deploy, push to this repo for Vercel auto-deployment.

## Local Development

```bash
cd D:\MyProjects-Dashboard\7Ink\7Ink-Website
# Edit files
# Test locally
```

## Deploy to Vercel

Push to this repository:
```bash
git push origin main
```

Vercel will automatically detect changes and deploy.

## Cloudflare Stream Direct Upload Setup

To enable direct creator uploads from `CloudflareVideoPlayer.html`, add these Vercel Environment Variables:

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID.
- `CLOUDFLARE_STREAM_API_TOKEN` - API token with Stream write permissions.

After adding environment variables, redeploy the project so `/api/stream-upload-url` can issue one-time upload URLs securely.

## ChatGPT Codex Connector

This repo includes a TypeScript MCP endpoint (`api/codex-connector.ts`) that lets ChatGPT/Codex connect to 7ink.com.au as a custom connector to search and fetch site content. See [CODEX_CONNECTOR.md](CODEX_CONNECTOR.md) for installation and setup instructions.
