# Connect+ Copilot

An AI-powered conversational assistant for Capillary's Connect+ data ingestion platform. Built to help users create and manage data flows through natural language interactions.

## Product Overview

Connect+ Copilot is a ChatGPT-like interface that simplifies working with Connect+, Capillary's data ingestion tool. Instead of manually navigating through complex UI configurations, users can simply describe what they want to accomplish in plain English, and the AI copilot handles the technical details.

## Features

- **Conversational Interface**: Chat with an AI assistant powered by GPT-4o to create and manage dataflows
- **Smart API Integration**: Automatically fetches available blocks and metadata on first use
- **Session Management**: Handles authentication with automatic session expiration detection
- **Real-time Streaming**: Responses stream word-by-word with automatic scrolling
- **Markdown Support**: Responses are beautifully formatted with code syntax highlighting
- **Clear Chat**: Reset conversation and cache at any time
- **Auto-scroll Toggle**: Control whether chat auto-scrolls with responses
- **Session-based**: Each user gets an isolated, secure chat session

## Connect+ Capabilities

Connect+ helps you move data between various sources and destinations:
- **SFTP** (as source or destination)
- **S3** (as source or destination)
- **HTTP APIs** (as source or destination)
- **Event Streams** like Kafka (as source or destination)

It also supports data transformations during the flow process.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI**: Tailwind CSS with minimalistic design
- **AI**: OpenAI GPT-4o with function calling
- **API Integration**: Vercel AI SDK for streaming responses
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Connect+ session cookie and organization ID
- OpenAI API key (already configured in `.env.local`)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (already configured):
```bash
# .env.local
OPENAI_API_KEY=your_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Usage

1. On the home page, enter your:
   - **Session Cookie**: Your Connect+ session cookie
   - **Organization ID**: Your Connect+ org ID
2. Click "Start Chat"
3. Start asking questions or requesting dataflow operations:
   - "Show me all available blocks"
   - "Create a dataflow to move files from SFTP to S3"
   - "What transformation blocks are available?"
   - "Get details for block ID 57"

### Authentication

**Current Method** (Temporary):
- Cookie-based authentication via `Cookie` header
- Organization ID via `X-CAP-API-AUTH-ORG-ID` header

**Future Method** (Planned):
- Token-based authentication with username/password
- Will be updated when available

## Architecture

### Session Flow
1. User provides Cookie + Org ID on homepage
2. Credentials stored in browser's sessionStorage (not persisted)
3. On first message, automatically fetches all available blocks
4. Blocks cached per organization for session duration
5. GPT-4o handles conversation and decides when to call Connect+ APIs
6. Streaming responses rendered in markdown

### API Integration
The copilot integrates with these Connect+ APIs:
- `GET /api/v3/blocks` - Get all available blocks
- `GET /api/v3/blocks/{id}/metadata` - Get block metadata
- `POST /api/v3/dataflows/canvas` - Create new dataflow
- `GET /api/v3/dataflows/{id}` - Get dataflow details
- `GET /api/v3/dataflows/{id}/with-values` - Get full dataflow config

### Security
- OpenAI API key stored in `.env.local` (not committed to Git)
- User credentials stored in sessionStorage (cleared on browser close)
- Automatic session expiration detection and re-authentication prompt

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or push to GitHub and connect to Vercel dashboard.

## Future Enhancements

- Token-based authentication
- Persistent chat history (optional)
- Visual dataflow builder preview
- More Connect+ API integrations
- Export/import chat sessions
- Multi-language support

## License

Proprietary - Capillary Technologies
