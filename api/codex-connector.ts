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
  const text = JSON.stringify(payload);
  if (text === undefined) {
    throw new Error('Tool result is not JSON serializable.');
  }

  return {
    content: [
      {
        type: 'text',
        text
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

  const header = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] === requiredToken;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidJsonRpcId(value: unknown): value is JsonRpcId {
  return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function handleToolCall(name: string, args: Record<string, unknown>) {
  if (name === 'search') {
    if (typeof args.query !== 'string') {
      throw new TypeError('Invalid params: "query" must be a string.');
    }
    const query = args.query;
    return textResult({ results: searchContent(query) });
  }

  if (name === 'fetch') {
    if (typeof args.id !== 'string') {
      throw new TypeError('Invalid params: "id" must be a string.');
    }
    const id = args.id;
    const document = fetchContent(id);
    if (!document) {
      throw new Error(`No document found for id "${id}"`);
    }
    return textResult(document);
  }

  throw new TypeError(`Unknown tool "${name}"`);
}

function sendJsonRpcResult(res: CodexResponse, id: JsonRpcId | undefined, result: unknown) {
  if (id === undefined) {
    res.status(202).send('');
    return;
  }
  res.status(200).json({ jsonrpc: '2.0', id: id ?? null, result });
}

function sendJsonRpcError(res: CodexResponse, id: JsonRpcId | undefined, code: number, message: string) {
  if (id === undefined) {
    res.status(202).send('');
    return;
  }
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

  if (!isRecord(req.body)) {
    sendJsonRpcError(res, null, -32600, 'Invalid Request: expected a JSON-RPC 2.0 object.');
    return;
  }

  const message = req.body;
  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    sendJsonRpcError(res, null, -32600, 'Invalid Request: expected a JSON-RPC 2.0 method.');
    return;
  }

  let id: JsonRpcId | undefined;
  if (Object.prototype.hasOwnProperty.call(message, 'id')) {
    if (!isValidJsonRpcId(message.id)) {
      sendJsonRpcError(res, null, -32600, 'Invalid Request: "id" must be a string, number, null, or omitted.');
      return;
    }
    id = message.id;
  }

  const method = message.method;
  const params = message.params;
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
        if (!isRecord(params)) {
          sendJsonRpcError(res, id, -32602, 'Invalid params: expected an object.');
          return;
        }
        if (typeof params.name !== 'string') {
          sendJsonRpcError(res, id, -32602, 'Invalid params: "name" must be a string.');
          return;
        }
        const rawArgs = params.arguments;
        if (rawArgs !== undefined && !isRecord(rawArgs)) {
          sendJsonRpcError(res, id, -32602, 'Invalid params: "arguments" must be an object.');
          return;
        }
        const toolArgs = rawArgs ?? {};
        const result = handleToolCall(params.name, toolArgs);
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
    const code = error instanceof TypeError ? -32602 : -32000;
    sendJsonRpcError(res, id, code, messageText);
  }
}
