import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { ConnectPlusClient } from '@/lib/connectplus';
import { getSystemPrompt, clearSystemPromptCache } from '@/lib/system-prompt';

// Clear cache on module load to ensure fresh system prompt
clearSystemPromptCache();

// OPTION 1: OpenRouter (ACTIVE) - Use Claude Sonnet 4.5 via OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// OPTION 2: Direct OpenAI (BACKUP) - Uncomment to use OpenAI directly
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

    if (!cookie || !orgId) {
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

    // Define function schemas for Connect+ APIs
    const functions: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[] = [
      {
        name: 'getAllBlocks',
        description: 'Get a list of all available blocks in Connect+. Use this to see what data source/destination types and transformation blocks are available.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
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
      {
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
      {
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
      {
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
    ];

    // Load system prompt from MD files with blocks data
    const systemMessage = {
      role: 'system',
      content: getSystemPrompt(blocksData),
    };

    const allMessages = [systemMessage, ...messages];

    // Initial completion with function calling
    const response = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5', // Claude Sonnet 4.5 via OpenRouter
      messages: allMessages as any,
      functions,
      function_call: 'auto',
      temperature: 0.7,
      stream: false, // We'll handle streaming separately for function calls
    });

    const firstChoice = response.choices[0];

    // Handle function calls
    if (firstChoice.message.function_call) {
      const functionName = firstChoice.message.function_call.name;
      const functionArgs = JSON.parse(firstChoice.message.function_call.arguments);

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
          default:
            functionResult = { error: 'Unknown function' };
        }
      } catch (error: any) {
        if (error.message.includes('expired')) {
          return new Response('Session expired', { status: 401 });
        }
        functionResult = { error: error.message };
      }

      // Add function result to messages and get final response
      const messagesWithFunction = [
        ...allMessages,
        firstChoice.message,
        {
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResult),
        },
      ];

      const finalResponse = await openai.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5', // Claude Sonnet 4.5 via OpenRouter
        messages: messagesWithFunction as any,
        temperature: 0.7,
        stream: true,
      });

      const stream = OpenAIStream(finalResponse as any);
      return new StreamingTextResponse(stream);
    }

    // No function call, stream the response directly
    const streamResponse = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5', // Claude Sonnet 4.5 via OpenRouter
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
