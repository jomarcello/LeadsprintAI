#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Load environment variables
if (typeof process !== 'undefined' && process.env) {
  // Environment variables are available
}

// Initialize MCP Server
const server = new Server({
  name: "slack-agents-server",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Slack API helper functions
async function makeSlackRequest(endpoint: string, data?: any) {
  const response = await fetch(`https://slack.com/api/${endpoint}`, {
    method: data ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });
  return response.json();
}

// Define tool schemas
const listChannelsSchema = z.object({
  limit: z.number().optional(),
  exclude_archived: z.boolean().optional()
});

const postMessageSchema = z.object({
  channel: z.string(),
  text: z.string(),
  username: z.string().optional(),
  emoji: z.string().optional()
});

const getHistorySchema = z.object({
  channel: z.string(),
  limit: z.number().optional()
});

const getUserInfoSchema = z.object({
  user: z.string()
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list-slack-channels",
        description: "Get a list of all Slack channels in the workspace",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of channels to return (default: 100)"
            },
            exclude_archived: {
              type: "boolean", 
              description: "Exclude archived channels (default: true)"
            }
          }
        }
      },
      {
        name: "post-slack-message",
        description: "Send a message to a specific Slack channel",
        inputSchema: {
          type: "object",
          properties: {
            channel: {
              type: "string",
              description: "Channel ID or name (e.g., #general)"
            },
            text: {
              type: "string",
              description: "Message text to send"
            },
            username: {
              type: "string",
              description: "Custom username for the bot"
            },
            emoji: {
              type: "string",
              description: "Custom emoji for the bot (e.g., :robot_face:)"
            }
          },
          required: ["channel", "text"]
        }
      },
      {
        name: "get-slack-history",
        description: "Get recent messages from a Slack channel",
        inputSchema: {
          type: "object",
          properties: {
            channel: {
              type: "string",
              description: "Channel ID or name"
            },
            limit: {
              type: "number",
              description: "Number of messages to retrieve (default: 10)"
            }
          },
          required: ["channel"]
        }
      },
      {
        name: "get-slack-user-info",
        description: "Get information about a Slack user",
        inputSchema: {
          type: "object",
          properties: {
            user: {
              type: "string",
              description: "User ID or email address"
            }
          },
          required: ["user"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list-slack-channels": {
        const parsed = listChannelsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error("Invalid arguments for list-slack-channels");
        }
        
        const { limit = 100, exclude_archived = true } = parsed.data;
        
        const result = await makeSlackRequest('conversations.list', {
          limit,
          exclude_archived
        });

        if (!result.ok) {
          throw new Error(`Slack API error: ${result.error}`);
        }

        const channels = result.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          purpose: channel.purpose?.value || '',
          num_members: channel.num_members,
          is_archived: channel.is_archived,
          is_private: channel.is_private
        }));

        return {
          content: [{
            type: "text",
            text: `Found ${channels.length} Slack channels:\n\n${JSON.stringify(channels, null, 2)}`
          }]
        };
      }

      case "post-slack-message": {
        const parsed = postMessageSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error("Invalid arguments for post-slack-message");
        }
        
        const { channel, text, username, emoji } = parsed.data;
        
        const messageData: any = {
          channel,
          text
        };

        if (username) messageData.username = username;
        if (emoji) messageData.icon_emoji = emoji;

        const result = await makeSlackRequest('chat.postMessage', messageData);

        if (!result.ok) {
          throw new Error(`Slack API error: ${result.error}`);
        }

        return {
          content: [{
            type: "text",
            text: `Message posted successfully to ${channel}. Message timestamp: ${result.ts}`
          }]
        };
      }

      case "get-slack-history": {
        const parsed = getHistorySchema.safeParse(args);
        if (!parsed.success) {
          throw new Error("Invalid arguments for get-slack-history");
        }
        
        const { channel, limit = 10 } = parsed.data;
        
        const result = await makeSlackRequest('conversations.history', {
          channel,
          limit
        });

        if (!result.ok) {
          throw new Error(`Slack API error: ${result.error}`);
        }

        const messages = result.messages.map((msg: any) => ({
          user: msg.user,
          text: msg.text,
          timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
          type: msg.type
        }));

        return {
          content: [{
            type: "text",
            text: `Channel history for ${channel}:\n\n${JSON.stringify(messages, null, 2)}`
          }]
        };
      }

      case "get-slack-user-info": {
        const parsed = getUserInfoSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error("Invalid arguments for get-slack-user-info");
        }
        
        const { user } = parsed.data;
        
        const result = await makeSlackRequest('users.info', {
          user
        });

        if (!result.ok) {
          throw new Error(`Slack API error: ${result.error}`);
        }

        const userInfo = {
          id: result.user.id,
          name: result.user.name,
          real_name: result.user.real_name,
          email: result.user.profile?.email,
          title: result.user.profile?.title,
          phone: result.user.profile?.phone,
          timezone: result.user.tz,
          is_admin: result.user.is_admin,
          is_owner: result.user.is_owner,
          is_bot: result.user.is_bot
        };

        return {
          content: [{
            type: "text",
            text: `User information:\n\n${JSON.stringify(userInfo, null, 2)}`
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      isError: true
    };
  }
});

// Start the server
async function main() {
  try {
    console.error("Starting Slack MCP Server...");
    
    if (!process.env.SLACK_BOT_TOKEN) {
      throw new Error("SLACK_BOT_TOKEN environment variable is required");
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Slack MCP Server started successfully!");
    console.error("Available tools:");
    console.error("- list-slack-channels");
    console.error("- post-slack-message");
    console.error("- get-slack-history");
    console.error("- get-slack-user-info");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Only run main if this is the main module
if (require.main === module) {
  main().catch(console.error);
} 