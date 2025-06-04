# Discord to Make.com Webhook Bot

A Node.js/TypeScript Discord bot that listens to messages in real-time and triggers Make.com webhooks with complete message data. Designed for serverless deployment on platforms like Vercel and Netlify.

## Features

- Real-time Discord message monitoring
- Automatic Make.com webhook triggering
- Comprehensive message data capture (content, author, timestamps, attachments, etc.)
- Channel and server filtering options
- Automatic reconnection and error handling
- Detailed logging and debugging
- Serverless deployment ready (Vercel/Netlify)
- Health check endpoints for monitoring

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

### 3. Local Development

1. Copy `.env.example` to `.env`
2. Fill in your Discord bot token and Make.com webhook URL:

```bash
DISCORD_TOKEN=your_discord_bot_token_here
WEBHOOK_URL=https://hook.make.com/your_webhook_url_here
```

3. Install dependencies and run locally:

```bash
npm install
npm run dev
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `WEBHOOK_URL`: Your Make.com webhook URL
   - `CHANNEL_IDS`: (Optional) Comma-separated channel IDs to monitor
   - `GUILD_IDS`: (Optional) Comma-separated server IDs to monitor
4. Deploy the project

**Vercel endpoints:**
- `GET /health` - Health check endpoint
- `GET /start` - Initialize and start the Discord bot

### Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Configure environment variables in Netlify dashboard (same as Vercel)
5. Deploy the project

**Netlify endpoints:**
- `GET /health` - Health check endpoint
- `GET /start` - Initialize and start the Discord bot

## Configuration Options

Configure these environment variables for customization:

```bash
# Required
DISCORD_TOKEN=your_discord_bot_token_here
WEBHOOK_URL=https://hook.make.com/your_webhook_url_here

# Optional filtering
CHANNEL_IDS=123456789012345678,987654321098765432
GUILD_IDS=123456789012345678,987654321098765432

# Optional bot behavior
INCLUDE_BOT_MESSAGES=false
DEBUG=true
NODE_ENV=production
```

## Webhook Payload Structure

The bot sends comprehensive message data to your Make.com webhook:

```json
{
  "event": "message_create",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "id": "message_id",
    "content": "Hello world!",
    "author": {
      "id": "user_id",
      "username": "username",
      "discriminator": "0001",
      "bot": false,
      "avatar": "avatar_hash"
    },
    "channel": {
      "id": "channel_id",
      "name": "general",
      "type": 0
    },
    "guild": {
      "id": "guild_id",
      "name": "Server Name"
    },
    "timestamp": "2024-01-01T12:00:00.000Z",
    "editedTimestamp": null,
    "mentions": {
      "users": [],
      "roles": [],
      "everyone": false
    },
    "attachments": [],
    "embeds": [],
    "reactions": []
  }
}
```

## Architecture

The bot is designed for serverless deployment with the following structure:

- **Core Bot Logic** (`src/bot.ts`): Discord.js client handling
- **Webhook Service** (`src/webhook.ts`): Make.com integration with retry logic
- **Serverless Adapter** (`src/serverless.ts`): Serverless environment compatibility
- **API Endpoints** (`api/`): Health checks and bot management
- **Type Definitions** (`src/types.ts`): TypeScript interfaces

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Ensure `DISCORD_TOKEN` and `WEBHOOK_URL` are set
2. **Invalid Webhook URL**: Verify your Make.com webhook URL format
3. **Bot Permissions**: Ensure bot has proper Discord permissions
4. **Deployment Timeouts**: Serverless functions may have execution time limits

### Monitoring

- Use `/health` endpoint to check bot status
- Use `/start` endpoint to initialize the bot in serverless environments
- Check logs in your hosting platform's dashboard

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production build
npm start
```

## License

MIT License
