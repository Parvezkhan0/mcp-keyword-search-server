#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { searchKeywordInFile } from "./tools/searchKeyword.js";

// Create MCP server instance
const server = new Server(
  {
    name: "keyword-search-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_keyword",
        description: "Search for a keyword within a specified file and return matching lines with line numbers",
        inputSchema: {
          type: "object",
          properties: {
            filepath: {
              type: "string",
              description: "Path to the file to search in",
            },
            keyword: {
              type: "string",
              description: "Keyword to search for (case-insensitive)",
            },
            caseSensitive: {
              type: "boolean",
              description: "Whether to perform case-sensitive search (default: false)",
              default: false,
            },
          },
          required: ["filepath", "keyword"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search_keyword") {
    const { filepath, keyword, caseSensitive = false } = request.params.arguments as {
      filepath: string;
      keyword: string;
      caseSensitive?: boolean;
    };

    try {
      const result = await searchKeywordInFile(filepath, keyword, caseSensitive);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error occurred",
            }),
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Keyword Search MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});