// ChatGPT / Codex Connector endpoint.
//
// Implements a minimal MCP (Model Context Protocol) "Streamable HTTP" server
// exposing the `search` and `fetch` tools that ChatGPT/Codex custom connectors
// require. No third-party MCP SDK is used to keep this endpoint dependency-free,
// consistent with the other functions in `api/`.
//
// Register this connector in ChatGPT under Settings -> Connectors -> Create,
// using the deployed URL, e.g. https://7ink.com.au/api/codex-connector
// See CODEX_CONNECTOR.md for full setup instructions.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchContent, searchContent } from './_lib/codex-content';

interface CodexRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
  headers: IncomingMessage['headers'];
}

interface CodexResponse extends ServerResponse {
  status: (statusCode: number) => CodexResponse;
  json: (body: unknown) => void;
  send: (body: string) => void;
}

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

const PROTOCOL_VERSION = '2025-06-18';

const TOOL_DEFINITIONS = [
  {
    name: 'search',
    description: 'Search 7ink.com.au content (pages, portfolio and directory listings) and return matching document ids.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search query.' }
      },
      required: ['query']
    }
  },
  {
    name: 'fetch',
    description: 'Fetch the full content of a document previously returned by the search tool.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Document id returned by the search tool.' }
      },
      required: ['id']
    }
  }
];

function textResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload)
      }
    ]
  };
}

function isAuthorized(req: CodexRequest): boolean {
  const requiredToken = process.env.CODEX_CONNECTOR_TOKEN;
  if (!requiredToken) {
    // No token configured: the connector serves public marketing content, so
    // it is safe to leave open by default.
    return true;
  }

  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token === requiredToken;
}

function handleToolCall(name: string, args: Record<string, unknown>) {
  if (name === 'search') {
    const query = typeof args.query === 'string' ? args.query : '';
    return textResult({ results: searchContent(query) });
  }

  if (name === 'fetch') {
    const id = typeof args.id === 'string' ? args.id : '';
    const document = fetchContent(id);
    if (!document) {
      throw new Error(`No document found for id "${id}"`);
    }
    return textResult(document);
  }

  throw new Error(`Unknown tool "${name}"`);
}

function sendJsonRpcResult(res: CodexResponse, id: JsonRpcId | undefined, result: unknown) {
  res.status(200).json({ jsonrpc: '2.0', id: id ?? null, result });
}

function sendJsonRpcError(res: CodexResponse, id: JsonRpcId | undefined, code: number, message: string) {
  res.status(200).json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

export default async function handler(req: CodexRequest, res: CodexResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. POST a JSON-RPC 2.0 message.' });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const message = req.body as JsonRpcRequest | undefined;

  if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    res.status(400).json({ error: 'Expected a JSON-RPC 2.0 request body.' });
    return;
  }

  const { id, method, params } = message;
  const isNotification = id === undefined;

  try {
    switch (method) {
      case 'initialize': {
        const result = {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: '7ink-codex-connector', version: '1.0.0' }
        };
        sendJsonRpcResult(res, id, result);
        return;
      }

      case 'notifications/initialized':
      case 'ping': {
        if (isNotification) {
          res.status(202).send('');
          return;
        }
        sendJsonRpcResult(res, id, {});
        return;
      }

      case 'tools/list': {
        sendJsonRpcResult(res, id, { tools: TOOL_DEFINITIONS });
        return;
      }

      case 'tools/call': {
        const toolName = params && typeof params.name === 'string' ? params.name : '';
        const rawArgs = params ? params.arguments : undefined;
        if (rawArgs !== undefined && (typeof rawArgs !== 'object' || rawArgs === null || Array.isArray(rawArgs))) {
          sendJsonRpcError(res, id, -32602, 'Invalid params: "arguments" must be an object.');
          return;
        }
        const toolArgs = (rawArgs as Record<string, unknown>) || {};
        const result = handleToolCall(toolName, toolArgs);
        sendJsonRpcResult(res, id, result);
        return;
      }

      default: {
        if (isNotification) {
          res.status(202).send('');
          return;
        }
        sendJsonRpcError(res, id, -32601, `Method not found: ${method}`);
        return;
      }
    }
  } catch (error) {
    if (isNotification) {
      res.status(202).send('');
      return;
    }
    const messageText = error instanceof Error ? error.message : 'Unexpected error';
    sendJsonRpcError(res, id, -32000, messageText);
  }
}
