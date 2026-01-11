import { randomUUID } from 'crypto';
import express, { Router, Request, Response } from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { registerAgendaItemTools } from './tools/agenda-items';
import { registerAgendaSettingsTools } from './tools/agenda-settings';
import { PatOAuthProvider } from '../oauth/oauth-provider';
import Logger, { LogType } from '../utils/logger';

export default class McpManager {
    private static instance: McpManager;
    private router: Router;
    private server: McpServer;
    private transports: Map<string, StreamableHTTPServerTransport> = new Map();

    private constructor(oauthProvider: PatOAuthProvider, resourceServerUrl: URL, issuerUrl: URL) {
        Logger.logSystem(LogType.UNCLASSIFIED, 'initializing mcp manager');

        this.router = Router();
        this.server = new McpServer({
            name: 'pat-agenda',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });

        this.registerTools();
        this.setupRoutes(oauthProvider, resourceServerUrl, issuerUrl);
    }

    private registerTools() {
        registerAgendaItemTools(this.server);
        registerAgendaSettingsTools(this.server);
    }

    private setupRoutes(oauthProvider: PatOAuthProvider, resourceServerUrl: URL, issuerUrl: URL) {
        this.router.use(cors({
            origin: '*',
            exposedHeaders: ['Mcp-Session-Id'],
        }));
        this.router.use(express.json());

        // Public endpoint for OAuth metadata discovery
        this.router.get('/.well-known/oauth-protected-resource', (req: Request, res: Response) => {
            res.json({
                resource: resourceServerUrl.toString(),
                authorization_servers: [issuerUrl.toString()],
                scopes_supported: ['agenda:read', 'agenda:write'],
                resource_name: 'Pat MCP Server',
            });
        });

        // Apply bearer auth to MCP protocol endpoints only
        const authMiddleware = requireBearerAuth({
            verifier: oauthProvider,
            resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resourceServerUrl),
        });

        this.router.post('/', authMiddleware, async (req: Request, res: Response) => {
            try {
                const sessionId = req.headers['mcp-session-id'] as string | undefined;
                let transport: StreamableHTTPServerTransport;

                if (sessionId && this.transports.has(sessionId)) {
                    transport = this.transports.get(sessionId)!;
                } else if (!sessionId && isInitializeRequest(req.body)) {
                    transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => randomUUID(),
                        onsessioninitialized: (newSessionId) => {
                            this.transports.set(newSessionId, transport);
                        },
                    });

                    transport.onclose = () => {
                        if (transport.sessionId) {
                            this.transports.delete(transport.sessionId);
                        }
                    };

                    await this.server.connect(transport);
                } else {
                    res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32000,
                            message: 'Bad Request: No valid session ID provided',
                        },
                        id: null,
                    });
                    return;
                }

                await transport.handleRequest(req, res, req.body);
            } catch (error) {
                Logger.logError(LogType.UNCLASSIFIED, 'MCP request error', { error });

                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: { code: -32603, message: 'Internal error' },
                        id: null,
                    });
                }
            }
        });

        this.router.get('/', authMiddleware, async (req: Request, res: Response) => {
            const sessionId = req.headers['mcp-session-id'] as string | undefined;

            if (!sessionId || !this.transports.has(sessionId)) {
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: { code: -32600, message: 'Invalid session' },
                    id: null,
                });
                return;
            }

            const transport = this.transports.get(sessionId)!;
            await transport.handleRequest(req, res);
        });

        this.router.delete('/', authMiddleware, async (req: Request, res: Response) => {
            const sessionId = req.headers['mcp-session-id'] as string | undefined;

            if (sessionId && this.transports.has(sessionId)) {
                const transport = this.transports.get(sessionId)!;
                await transport.close();
                this.transports.delete(sessionId);
            }

            res.status(204).send();
        });
    }

    getRouter(): Router {
        return this.router;
    }

    static initialize(oauthProvider: PatOAuthProvider, resourceServerUrl: URL, issuerUrl: URL): McpManager {
        if (!McpManager.instance) McpManager.instance = new McpManager(oauthProvider, resourceServerUrl, issuerUrl);
        return McpManager.instance;
    }

    static getInstance(): McpManager {
        if (!McpManager.instance) throw new Error('McpManager not initialized. Call initialize() first.');
        return McpManager.instance;
    }
}
