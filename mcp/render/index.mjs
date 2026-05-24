#!/usr/bin/env node
/**
 * Render.com MCP Server for InkConnect
 *
 * Tools provided:
 *   list_services        – list all services in the Render account
 *   get_service          – get details for one service
 *   deploy_service       – trigger a new deploy
 *   list_deploys         – list recent deploys for a service
 *   get_deploy           – get status of a specific deploy
 *   cancel_deploy        – cancel an in-progress deploy
 *   list_env_vars        – list env vars for a service
 *   update_env_vars      – bulk-upsert env vars for a service
 *   get_logs             – fetch recent log lines for a service
 *   suspend_service      – suspend a service
 *   resume_service       – resume a suspended service
 *
 * Required environment variable:
 *   RENDER_API_KEY  – Render personal API key
 *                    (generate at https://dashboard.render.com/u/settings#api-keys)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_KEY = process.env.RENDER_API_KEY;
if (!API_KEY) {
  console.error("ERROR: RENDER_API_KEY environment variable is not set.");
  console.error(
    "Generate one at https://dashboard.render.com/u/settings#api-keys"
  );
  process.exit(1);
}

const BASE_URL = "https://api.render.com/v1";

// ---------------------------------------------------------------------------
// Render API helpers
// ---------------------------------------------------------------------------

async function renderFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  let body;
  const ct = res.headers.get("content-type") ?? "";
  try {
    body = ct.includes("application/json") ? await res.json() : await res.text();
  } catch {
    body = await res.text();
  }

  if (!res.ok) {
    const msg =
      typeof body === "object"
        ? (body.message ?? JSON.stringify(body))
        : body;
    throw new Error(`Render API ${res.status}: ${msg}`);
  }

  return body;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "list_services",
    description:
      "List all services in the Render account. Returns id, name, type, status, and deploy URL for each service.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max number of services to return (default 20, max 100).",
        },
      },
    },
  },
  {
    name: "get_service",
    description: "Get details for a single Render service by its service ID.",
    inputSchema: {
      type: "object",
      required: ["service_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID (e.g. srv-xxxxxxxxxxxxx).",
        },
      },
    },
  },
  {
    name: "deploy_service",
    description:
      "Trigger a new deploy for a service. Use this to push the latest code live.",
    inputSchema: {
      type: "object",
      required: ["service_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
        clear_cache: {
          type: "boolean",
          description:
            "If true, clears the build cache before deploying (default false).",
        },
      },
    },
  },
  {
    name: "list_deploys",
    description: "List recent deploys for a service.",
    inputSchema: {
      type: "object",
      required: ["service_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
        limit: {
          type: "number",
          description: "Max number of deploys to return (default 10, max 100).",
        },
      },
    },
  },
  {
    name: "get_deploy",
    description: "Get the status and details of a specific deploy.",
    inputSchema: {
      type: "object",
      required: ["service_id", "deploy_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
        deploy_id: {
          type: "string",
          description: "The deploy ID (dep-xxxxxxxxxxxxx).",
        },
      },
    },
  },
  {
    name: "cancel_deploy",
    description: "Cancel an in-progress deploy.",
    inputSchema: {
      type: "object",
      required: ["service_id", "deploy_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
        deploy_id: {
          type: "string",
          description: "The deploy ID to cancel.",
        },
      },
    },
  },
  {
    name: "list_env_vars",
    description:
      "List all environment variables configured for a Render service.",
    inputSchema: {
      type: "object",
      required: ["service_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
      },
    },
  },
  {
    name: "update_env_vars",
    description:
      "Bulk-upsert environment variables for a service. Existing vars with the same key are updated; new keys are added. Variables not in this list are left unchanged.",
    inputSchema: {
      type: "object",
      required: ["service_id", "env_vars"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
        env_vars: {
          type: "array",
          description: "Array of { key, value } pairs to set.",
          items: {
            type: "object",
            required: ["key", "value"],
            properties: {
              key: { type: "string" },
              value: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_logs",
    description:
      "Fetch recent log lines from a Render service. Returns the latest stdout/stderr output.",
    inputSchema: {
      type: "object",
      required: ["service_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
        limit: {
          type: "number",
          description: "Number of log lines to return (default 100, max 500).",
        },
        direction: {
          type: "string",
          enum: ["forward", "backward"],
          description:
            "forward = oldest first, backward = newest first (default backward).",
        },
      },
    },
  },
  {
    name: "suspend_service",
    description:
      "Suspend a Render service (stops it and stops billing for compute).",
    inputSchema: {
      type: "object",
      required: ["service_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
      },
    },
  },
  {
    name: "resume_service",
    description: "Resume a previously suspended Render service.",
    inputSchema: {
      type: "object",
      required: ["service_id"],
      properties: {
        service_id: {
          type: "string",
          description: "The Render service ID.",
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function handleTool(name, args) {
  switch (name) {
    case "list_services": {
      const limit = Math.min(args.limit ?? 20, 100);
      const data = await renderFetch(`/services?limit=${limit}`);
      const services = Array.isArray(data) ? data : data.services ?? data;
      return services.map((s) => {
        const svc = s.service ?? s;
        return {
          id: svc.id,
          name: svc.name,
          type: svc.type,
          status: svc.suspended ?? svc.serviceDetails?.status ?? "unknown",
          url: svc.serviceDetails?.url ?? null,
          region: svc.serviceDetails?.region ?? null,
          plan: svc.serviceDetails?.plan ?? null,
          updatedAt: svc.updatedAt,
        };
      });
    }

    case "get_service": {
      const data = await renderFetch(`/services/${args.service_id}`);
      return data;
    }

    case "deploy_service": {
      const body = {};
      if (args.clear_cache) body.clearCache = "clear";
      const data = await renderFetch(
        `/services/${args.service_id}/deploys`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      return {
        deployId: data.id,
        status: data.status,
        createdAt: data.createdAt,
        commit: data.commit ?? null,
        message: `Deploy triggered. Use get_deploy to check status.`,
      };
    }

    case "list_deploys": {
      const limit = Math.min(args.limit ?? 10, 100);
      const data = await renderFetch(
        `/services/${args.service_id}/deploys?limit=${limit}`
      );
      const deploys = Array.isArray(data) ? data : data.deploys ?? data;
      return deploys.map((d) => {
        const dep = d.deploy ?? d;
        return {
          id: dep.id,
          status: dep.status,
          createdAt: dep.createdAt,
          updatedAt: dep.updatedAt,
          finishedAt: dep.finishedAt ?? null,
          commitMessage: dep.commit?.message ?? null,
          commitId: dep.commit?.id ?? null,
        };
      });
    }

    case "get_deploy": {
      const data = await renderFetch(
        `/services/${args.service_id}/deploys/${args.deploy_id}`
      );
      return data;
    }

    case "cancel_deploy": {
      const data = await renderFetch(
        `/services/${args.service_id}/deploys/${args.deploy_id}/cancel`,
        { method: "POST", body: "{}" }
      );
      return data;
    }

    case "list_env_vars": {
      const data = await renderFetch(
        `/services/${args.service_id}/env-vars`
      );
      const vars = Array.isArray(data) ? data : data.envVars ?? data;
      return vars.map((v) => ({
        key: v.envVar?.key ?? v.key,
        value: v.envVar?.value ?? v.value,
      }));
    }

    case "update_env_vars": {
      const data = await renderFetch(
        `/services/${args.service_id}/env-vars`,
        {
          method: "PUT",
          body: JSON.stringify(
            args.env_vars.map(({ key, value }) => ({ key, value }))
          ),
        }
      );
      const vars = Array.isArray(data) ? data : data.envVars ?? data;
      return {
        updated: vars.length,
        vars: vars.map((v) => v.envVar?.key ?? v.key),
        note: "A new deploy may be required for changes to take effect.",
      };
    }

    case "get_logs": {
      const limit = Math.min(args.limit ?? 100, 500);
      const direction = args.direction ?? "backward";
      const data = await renderFetch(
        `/services/${args.service_id}/logs?limit=${limit}&direction=${direction}`
      );
      const logs = Array.isArray(data) ? data : data.logs ?? data;
      return logs.map((l) => ({
        timestamp: l.timestamp,
        message: l.message ?? l.text ?? l,
      }));
    }

    case "suspend_service": {
      await renderFetch(`/services/${args.service_id}/suspend`, {
        method: "POST",
        body: "{}",
      });
      return { success: true, message: `Service ${args.service_id} suspended.` };
    }

    case "resume_service": {
      await renderFetch(`/services/${args.service_id}/resume`, {
        method: "POST",
        body: "{}",
      });
      return { success: true, message: `Service ${args.service_id} resumed.` };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new Server(
  {
    name: "render-mcp",
    version: "1.0.0",
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    const result = await handleTool(name, args ?? {});
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${err.message}`,
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
