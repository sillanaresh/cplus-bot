import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { ConnectPlusClient } from '@/lib/connectplus';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        blocksData = await client.getAllBlocks();
        blocksCache.set(orgId, blocksData);
      } catch (error: any) {
        if (error.message.includes('expired')) {
          return new Response('Session expired', { status: 401 });
        }
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

    // System prompt with blocks data if available
    const systemMessage = {
      role: 'system',
      content: `You are Connect+ Copilot, an AI assistant EXCLUSIVELY for Capillary's Connect+ data ingestion platform. You help users create and manage data flows between various sources and destinations.

Connect+ can move data between:
- SFTP (as source or destination)
- S3 (as source or destination)
- HTTP APIs (as source or destination)
- Event streams like Kafka (as source or destination)

It can also perform transformations on data during the flow.

Important Restrictions:
- You can only answer questions directly related to Connect+, its data flows, blocks, configurations, transformations, and data ingestion features
- You must reject any question about:
  * General knowledge (e.g., "What is the capital of X?", "Who is Y?")
  * Other tools or platforms not related to Connect+
  * Programming or coding help unrelated to Connect+
  * Any topic outside Connect+ data ingestion domain
- When rejecting, use this format: "I'm specifically designed to help with Connect+ data flows and ingestion. I cannot assist with general knowledge or unrelated topics. I'd be happy to help you with Connect+ dataflows, blocks, transformations, or configurations!"
- Never try to be helpful by answering non-Connect+ questions, even if you know the answer
- Examples of rejected questions:
  * "What is the capital of India?" → Reject
  * "Who won the world cup?" → Reject
  * "Help me write Python code" → Reject (unless it's about Connect+ transformations)
  * "What is 2+2?" → Reject

When users ask valid Connect+ questions:
1. Be conversational and helpful
2. Ask clarifying questions when needed
3. Use the available functions to interact with Connect+ APIs
4. Explain what you're doing in a clear, friendly way
5. If terminology seems unclear, ask for clarification
6. Always render responses in markdown format for better readability
7. When describing blocks, format like: "**Block Name (block_id)**: Description" - ensure the ID is in parentheses on the same line as the title
8. When you receive API responses from functions, ALWAYS include a collapsible "Raw API Response" section at the end with the full JSON response in a code block like this:

<details>
<summary>Raw API Response</summary>

\`\`\`json
{full JSON response here}
\`\`\`

</details>

9. Format your explanations clearly:
   - Use markdown tables when presenting tabular data (e.g., comparing options, listing properties with descriptions)
   - Always wrap technical values, keys, property names, and code snippets in inline code using backticks (e.g., \`input.transformation\`, \`ENTIRE_FLOWFILE\`, \`blockId\`)
   - Use structured lists with clear headings for explaining features or configurations
   - For JSON, configuration examples, or code, always use proper code blocks with language tags
   - Keep the formatting clean and easy to scan - avoid overly complex nested structures

${blocksData ? `\n\nAvailable blocks in this organization:\n${JSON.stringify(blocksData, null, 2)}` : ''}

Remember: You have access to the blocks data, so you can reference specific block types and their capabilities when helping users. Stay strictly focused on Connect+ only.`,
    };

    const allMessages = [systemMessage, ...messages];

    // Initial completion with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
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
        model: 'gpt-4o',
        messages: messagesWithFunction as any,
        temperature: 0.7,
        stream: true,
      });

      const stream = OpenAIStream(finalResponse);
      return new StreamingTextResponse(stream);
    }

    // No function call, stream the response directly
    const streamResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: allMessages as any,
      temperature: 0.7,
      stream: true,
    });

    const stream = OpenAIStream(streamResponse);
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(error.message || 'Internal server error', { status: 500 });
  }
}
