# Discord to Make.com Webhook Bot

A Node.js/TypeScript Discord bot that listens to messages in real-time and triggers Make.com webhooks with complete message data.

## Features

- 🤖 Real-time Discord message monitoring
- 📡 Automatic Make.com webhook triggering
- 🔍 Comprehensive message data capture (content, author, timestamps, attachments, etc.)
- 🎯 Channel and server filtering options
- 🔄 Automatic reconnection and error handling
- 📝 Detailed logging and debugging
- 🚀 Serverless deployment ready (Vercel/Netlify)

## Quick Start

### 1. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to "Bot" section
4. Create a bot and copy the token
5. Enable the following bot permissions:
   - View Channels
   - Read Message History
   - Read Messages/View Channels
6. Invite the bot to your server with these permissions

### 2. Make.com Webhook Setup

1. Create a new scenario in Make.com
2. Add a "Custom Webhook" trigger
3. Copy the webhook URL provided

### 3. Environment Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Discord bot token and Make.com webhook URL:

```bash
DISCORD_TOKEN=your_discord_bot_token_here
WEBHOOK_URL=https://hook.make.com/your_webhook_url_here
