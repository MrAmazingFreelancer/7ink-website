# ChatGPT Codex Connector Setup

This repo exposes a small [MCP](https://modelcontextprotocol.io) (Model Context
Protocol) endpoint so it can be registered as a **custom connector** in
ChatGPT / Codex. It lets ChatGPT `search` and `fetch` public content from
7ink.com.au (pages, portfolio and the directory listings in `listings.json`)
to answer questions or cite sources.

## What was added

| File | Purpose |
| --- | --- |
| `api/codex-connector.ts` | Vercel serverless function implementing the MCP `search`/`fetch` tools over JSON-RPC 2.0 ("Streamable HTTP" transport). |
| `api/_lib/codex-content.ts` | TypeScript content index built from `listings.json` and the site's key pages. |
| `tsconfig.json` | TypeScript configuration used for type-checking the connector code (`npm run typecheck`). |

No new runtime dependencies were introduced — the connector is plain
TypeScript, deployed the same way as the existing `api/*.js` functions and
requires no changes to `vercel.json` or the build/deploy scripts.

## Deploying

The connector deploys automatically with the rest of the site on Vercel. Once
deployed it is available at:

```
https://7ink.com.au/api/codex-connector
```

### Optional access token

By default the connector is open, since it only serves public marketing
content. To restrict access, set a `CODEX_CONNECTOR_TOKEN` environment
variable in the Vercel project settings. When set, requests must include an
`Authorization` header using the `Bearer` scheme, with the token value set
to the same value you configured in `CODEX_CONNECTOR_TOKEN`.

## Installing the connector in ChatGPT

1. In ChatGPT, go to **Settings -> Connectors -> Create** (or **Add custom
   connector**, depending on your plan).
2. Set the **MCP Server URL** to `https://7ink.com.au/api/codex-connector`.
3. If you configured `CODEX_CONNECTOR_TOKEN`, add it as the connector's
   authentication token/header.
4. Save and enable the connector. ChatGPT/Codex can now call `search` and
   `fetch` against 7ink.com.au content.

## Local testing

You can exercise the connector locally with `vercel dev` (or any Vercel-
compatible local runner) and `curl`:

```bash
curl -X POST http://localhost:3000/api/codex-connector \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search","arguments":{"query":"trade"}}}'
```

Type-check the connector code with:

```bash
npm run typecheck
```
