# 7ink.com.au deployment

## Hosting

This website deploys to Vercel from the `MrAmazingFreelancer/7ink-website` GitHub repository. The production branch is `main`.

Use the existing Vercel project. Cloudflare Workers, Pages, Wrangler, and a copied asset directory are not part of this website's deployment workflow.

## Project settings

- Framework preset: Other (static HTML with Vercel API functions).
- Project root: the `7Ink-Website` repository root.
- Build command: `npm run build`.
- Output directory: `.` (declared in `vercel.json`).
- Keep runtime secrets in the Vercel project's environment variables, never in committed files.

The build command is intentionally a no-op: HTML, CSS, JavaScript, and images are already in their final source locations. Vercel handles the `api/` functions during deployment.

## Publish updates

1. Review the website changes and run `npm run build` and `git diff --check`.
2. Commit only the intended files.
3. Push to `origin main`.
4. Check the resulting deployment in the existing Vercel project's Deployments view. A successful Git push alone does not confirm that the website is live.
5. Verify the changed page on https://7ink.com.au/ after the deployment succeeds.

If the Git integration is not connected, connect the existing GitHub repository in the existing Vercel project before relying on automatic deployments. Do not create a second hosting project just to publish an update.

## Domain

Manage `7ink.com.au` and `www.7ink.com.au` in the Vercel project's domain settings. Use the DNS record values Vercel displays for this project at your current DNS provider. Do not copy example nameservers or change the registrar merely to deploy an update.

`vercel.json` redirects the `www` hostname to the apex domain. DNS and website hosting are separate services.

## Other integrations

Cloudflare Stream, where used by the video player and upload API, is a media service rather than a website deployment dependency. Its credentials remain runtime environment variables in Vercel. See README.md.

The optional Codex connector deploys as a Vercel API function. See CODEX_CONNECTOR.md.

The legacy PHP admin files require a PHP runtime and are not made executable by this static build. The separate `7Ink-Dashboard` application owns the current staff and admin workflows.

## Troubleshooting

- Old content: check the latest Vercel deployment's commit and production status, then refresh the browser.
- Missing images: check the referenced paths and ensure the files are committed.
- API errors: inspect Vercel function logs and the required environment variables.
- Domain errors: follow the project's current Vercel domain verification instructions.

Reference: https://vercel.com/docs/git
