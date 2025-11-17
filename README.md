# Connect+ Copilot

An AI-powered conversational assistant for Capillary's Connect+ data ingestion platform. Built to help users create and manage data flows through natural language interactions.

## Product Overview

Connect+ Copilot is a ChatGPT-like interface that simplifies working with Connect+, Capillary's data ingestion tool. Instead of manually navigating through complex UI configurations, users can simply describe what they want to accomplish in plain English, and the AI copilot handles the technical details.

The interface features a beautiful, minimalistic design with nature-inspired imagery that creates a calm, productive environment for data engineering tasks.

## Features

### Core Capabilities
- **Conversational Interface**: Chat with an AI assistant powered by GPT-4o to create and manage dataflows
- **Smart API Integration**: Automatically fetches available blocks and metadata on first use
- **Session Management**: Cookie-based authentication with logout functionality
- **Real-time Streaming**: Responses stream word-by-word for immediate feedback
- **Session Expiration Handling**: Automatic detection and re-authentication prompts

### User Experience
- **2-Column Layout**: Clean split-screen design with nature backgrounds and chat interface
- **Random Nature Backgrounds**: Six beautiful nature images rotate on each session for visual variety
- **Transparent Logo**: Professional Capillary branding with transparent background
- **Auto-scroll Control**: Toggle automatic scrolling during AI responses
- **Clear Chat**: Reset conversation and cache at any time
- **Copy to Clipboard**: One-click copy for any message or code block

### Enhanced Rendering
- **Markdown Headings**: All heading levels (# through ######) render with proper styling
- **HTML Tags Support**: Collapsible sections with `<details>` and `<summary>` tags
- **Auto-formatted JSON**: API responses automatically formatted with 2-space indentation
- **Code Blocks**: Syntax-highlighted code blocks with copy functionality
- **Tables**: Beautiful markdown table rendering with borders and styling
- **Inline Formatting**: Support for **bold text** and `inline code`
- **Consistent Typography**: 14px font size across all messages for optimal readability

## Connect+ Capabilities

Connect+ helps you move data between various sources and destinations:
- **SFTP** (as source or destination)
- **S3** (as source or destination)
- **HTTP APIs** (as source or destination)
- **Event Streams** like Kafka (as source or destination)

It also supports data transformations during the flow process.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript, React 19
- **Styling**: Tailwind CSS with minimalistic design philosophy

### AI & APIs
- **AI Model**: OpenAI GPT-4o with function calling capabilities
- **Streaming**: Vercel AI SDK for real-time response streaming
- **API Integration**: RESTful Connect+ API endpoints

### UI/UX
- **Design**: 2-column responsive layout
- **Images**: Curated nature photography (waterfalls, forests, landscapes, architecture)
- **Typography**: Consistent 14px (text-sm) across interface
- **Colors**: Minimal palette with blue accents and gray tones

### Deployment
- **Platform**: Vercel
- **Environment**: Production-ready with environment variable management

## User Interface

The application features a carefully crafted user experience:

- **Home Page**: 2-column layout with random nature background on the left and login form on the right
- **Chat Page**: Forest background on the left with chat interface on the right
- **Logo**: Transparent Capillary logo in top-left corner of home page
- **Logout**: Red button in top-right corner for easy session termination
- **Loading**: Clean white screen during initial image load (industry standard)

## License

Proprietary - Capillary Technologies
