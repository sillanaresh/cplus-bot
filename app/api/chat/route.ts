import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { ConnectPlusClient } from '@/lib/connectplus';
import { getSystemPrompt, clearSystemPromptCache } from '@/lib/system-prompt';

// Clear cache on module load to ensure fresh system prompt
clearSystemPromptCache();

// OPTION 1: OpenRouter (ACTIVE) - Using GPT-4o via OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// OPTION 2: Direct OpenAI (BACKUP) - Using GPT-4o
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// Store blocks cache per session (in production, use Redis or similar)
const blocksCache = new Map<string, any>();

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get auth from request headers (passed from client via sessionStorage)
    const cookie = req.headers.get('x-connectplus-cookie');
    const orgId = req.headers.get('x-connectplus-org-id');

    console.log('🔐 API Request received:');
    console.log('   Cookie present:', !!cookie);
    console.log('   Cookie length:', cookie?.length);
    console.log('   Cookie preview:', cookie?.substring(0, 30) + '...');
    console.log('   Org ID:', orgId);

    if (!cookie || !orgId) {
      console.error('❌ Missing credentials');
      return new Response('Missing authentication credentials', { status: 401 });
    }

    const client = new ConnectPlusClient({ cookie, orgId });
    const sessionId = `${orgId}-${Date.now()}`; // Simple session ID

    // Check if this is the first message (excluding system messages)
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const isFirstMessage = userMessages.length === 1;

    // Auto-fetch blocks on first message
    let blocksData = blocksCache.get(orgId);
    if (isFirstMessage && !blocksData) {
      try {
        console.log('🔍 Fetching blocks from Connect+ API...');
        console.log('   Cookie:', cookie?.substring(0, 20) + '...' + cookie?.substring(cookie.length - 10));
        console.log('   Org ID:', orgId);
        console.log('   Cookie length:', cookie?.length);

        blocksData = await client.getAllBlocks();
        blocksCache.set(orgId, blocksData);
        console.log('✅ Blocks fetched successfully');
      } catch (error: any) {
        console.error('❌ Error fetching blocks:', error.message);
        console.error('   Cookie length:', cookie?.length);
        console.error('   Org ID:', orgId);
        console.error('   Full error:', error);
        if (error.message.includes('expired')) {
          return new Response('Session expired. Please get a fresh cookie from Connect+', { status: 401 });
        }
        // Return the actual error for debugging
        return new Response(`Connect+ API Error: ${error.message}`, { status: 500 });
      }
    }

    // Define tool schemas for Connect+ APIs (using new tools format)
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'getAllBlocks',
          description: 'Get a list of all available blocks in Connect+. Use this to see what data source/destination types and transformation blocks are available.',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getBlockMetadata',
          description: 'Get detailed metadata for a specific block by its ID. This includes configuration options, parameters, and capabilities.',
          parameters: {
            type: 'object',
            properties: {
              blockId: {
                type: 'number',
                description: 'The ID of the block to get metadata for',
              },
            },
            required: ['blockId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'createDataflowCanvas',
          description: 'Create a new empty dataflow canvas with a given name. This is the first step in creating a new dataflow.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The name for the new dataflow',
              },
            },
            required: ['name'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getDataflow',
          description: 'Get basic details of an existing dataflow by its ID.',
          parameters: {
            type: 'object',
            properties: {
              dataflowId: {
                type: 'string',
                description: 'The UUID of the dataflow to retrieve',
              },
            },
            required: ['dataflowId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getDataflowWithValues',
          description: 'Get full details of an existing dataflow including all configuration values.',
          parameters: {
            type: 'object',
            properties: {
              dataflowId: {
                type: 'string',
                description: 'The UUID of the dataflow to retrieve',
              },
            },
            required: ['dataflowId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'createSimpleDataflow',
          description: 'Create a complete dataflow with just block IDs. This is the EASIEST way to create a dataflow - just provide a name and the block IDs in order. The backend handles all complexity (canvas creation, metadata fetching, stitching). Use this as the primary method for creating dataflows.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name for the dataflow (e.g., "SFTP to S3 Transfer", "Kafka to API Pipeline")',
              },
              blockIds: {
                type: 'array',
                description: 'Array of block IDs in execution order. Example: [71, 62] for sftp_read -> s3_write',
                items: { type: 'number' },
              },
            },
            required: ['name', 'blockIds'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'saveDataflow',
          description: 'Advanced: Save or update a dataflow with full manual configuration. Only use this if you need complete control over block configuration. For most cases, use createSimpleDataflow instead.',
          parameters: {
            type: 'object',
            properties: {
              dataflowUuid: {
                type: 'string',
                description: 'The UUID from createDataflowCanvas response',
              },
              description: {
                type: 'string',
                description: 'Description of the dataflow (e.g., "Pipeline: sftp_read -> convert_csv_to_json -> http_write")',
              },
              schedule: {
                type: 'string',
                description: 'Cron schedule for the dataflow. Use "0/1 0 * * * ? *" as default.',
                default: '0/1 0 * * * ? *',
              },
              blocks: {
                type: 'array',
                description: 'Array of blocks in execution order',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Block identifier in format "block1", "block2", etc.',
                    },
                    blockId: {
                      type: 'string',
                      description: 'The actual block ID from the blocks catalog (e.g., "71", "72")',
                    },
                    blockName: {
                      type: 'string',
                      description: 'Friendly name for the block (e.g., "SFTP-Source", "CSV-to-JSON")',
                    },
                    blockType: {
                      type: 'string',
                      description: 'The type from getBlockMetadata response (e.g., "sftp_read", "http_write")',
                    },
                    destinationBlockIds: {
                      type: 'array',
                      description: 'Array of next block IDs. Empty array for last block.',
                      items: { type: 'string' },
                    },
                    blockInputs: {
                      type: 'array',
                      description: 'The blockInputs array from getBlockMetadata response',
                      items: { type: 'object' },
                    },
                  },
                  required: ['id', 'blockId', 'blockName', 'blockType', 'destinationBlockIds', 'blockInputs'],
                },
              },
            },
            required: ['dataflowUuid', 'description', 'schedule', 'blocks'],
          },
        },
      },
    ];

    // Load system prompt from MD files with blocks data
    const systemMessage = {
      role: 'system',
      content: getSystemPrompt(blocksData),
    };

    const allMessages = [systemMessage, ...messages];

    // Initial completion with tool calling (new format)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: allMessages as any,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      stream: false, // We'll handle streaming separately for tool calls
    });

    const firstChoice = response.choices[0];

    // Handle tool calls (supports multiple tool calls in one turn)
    if (firstChoice.message.tool_calls && firstChoice.message.tool_calls.length > 0) {
      const toolCalls = firstChoice.message.tool_calls;

      console.log(`🔧 Processing ${toolCalls.length} tool call(s):`);
      toolCalls.forEach((tc: any, idx: number) => {
        console.log(`   ${idx + 1}. ${tc.function.name}(${tc.function.arguments})`);
      });

      // Execute all tool calls and collect results
      const toolResults: any[] = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`⚙️  Executing: ${functionName}`);
        console.log(`   Arguments:`, functionArgs);

        let functionResult: any;

        try {
          switch (functionName) {
            case 'getAllBlocks':
              functionResult = await client.getAllBlocks();
              blocksCache.set(orgId, functionResult);
              break;
            case 'getBlockMetadata':
              functionResult = await client.getBlockMetadata(functionArgs.blockId);
              break;
            case 'createDataflowCanvas':
              functionResult = await client.createDataflowCanvas(functionArgs.name);
              break;
            case 'getDataflow':
              functionResult = await client.getDataflow(functionArgs.dataflowId);
              break;
            case 'getDataflowWithValues':
              functionResult = await client.getDataflowWithValues(functionArgs.dataflowId);
              break;
            case 'createSimpleDataflow':
              functionResult = await client.createSimpleDataflow({
                name: functionArgs.name,
                blockIds: functionArgs.blockIds,
              });
              break;
            case 'saveDataflow':
              functionResult = await client.saveDataflow({
                dataflowUuid: functionArgs.dataflowUuid,
                description: functionArgs.description,
                schedule: functionArgs.schedule || '0/1 0 * * * ? *',
                blocks: functionArgs.blocks,
              });
              break;
            default:
              functionResult = { error: 'Unknown function' };
          }

          console.log(`   ✅ ${functionName} succeeded`);
        } catch (error: any) {
          console.error(`   ❌ ${functionName} failed:`, error.message);

          // If session expired, return immediately
          if (error.message.includes('expired')) {
            return new Response('Session expired', { status: 401 });
          }

          // For other errors, return error result but continue processing other tools
          functionResult = {
            error: error.message,
            functionName: functionName,
            arguments: functionArgs
          };
        }

        // Add this tool result to the results array
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        });
      }

      console.log(`✅ All ${toolResults.length} tool call(s) processed`);

      // Add assistant message and all tool results to conversation
      const messagesWithFunction = [
        ...allMessages,
        firstChoice.message,
        ...toolResults,
      ];

      // Get final response from GPT-4o with all tool results
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messagesWithFunction as any,
        temperature: 0.7,
        stream: true,
      });

      const stream = OpenAIStream(finalResponse as any);
      return new StreamingTextResponse(stream);
    }

    // No function call, stream the response directly
    const streamResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: allMessages as any,
      temperature: 0.7,
      stream: true,
    });

    const stream = OpenAIStream(streamResponse as any);
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(error.message || 'Internal server error', { status: 500 });
  }
}
