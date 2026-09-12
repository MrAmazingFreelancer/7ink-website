# Quick setup: Vercel

The website uses the existing Vercel project linked to `MrAmazingFreelancer/7ink-website`.

1. Work in `D:\MyProjects-Dashboard\7Ink\7Ink-Website`.
2. Review the intended changes.
3. Run `npm run build` and `git diff --check`.
4. Commit the intended files and push to `origin main`.
5. Check the deployment status in Vercel before checking the live page.

For a fresh project connection, use framework preset **Other**, build command `npm run build`, and output directory `.`. Configure API secrets in Vercel environment variables.

There is no Cloudflare deployment command or generated asset-copy folder. Domain settings use the current DNS provider and the values shown by Vercel.

See DEPLOYMENT_GUIDE.md for the full workflow and troubleshooting.
