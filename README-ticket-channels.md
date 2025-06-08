# Automatic Ticket Channel Monitoring

The Discord bot now automatically detects and monitors channels with "ticket" in their name, in addition to any manually configured channels.

## Features Added

### 1. Dynamic Ticket Channel Detection
- **Startup Scan**: When the bot starts, it scans all accessible guilds for existing channels containing "ticket" in their name
- **Real-time Detection**: Listens for new channel creation events and automatically adds ticket channels to monitoring
- **Cleanup**: Removes deleted ticket channels from monitoring

### 2. Enhanced Message Filtering
- Messages from ticket channels are always monitored, regardless of static channel configuration
- The `isTicketChannel` flag is added to webhook payloads to help AI agents identify ticket messages
- Maintains existing channel and guild filtering for non-ticket channels

### 3. Logging and Monitoring
- Detailed logs show ticket channel discovery and monitoring status
- Enhanced monitoring configuration display shows static channels + auto-detected ticket channels
- Debug logs indicate whether messages are from ticket channels

## Current Status

Based on the bot logs, the system has detected and is monitoring:
- **3 ticket channels** automatically detected:
  - `tickets` (ID: 1379600176955789476)
  - `Ticket n° 1379612520209453167- de <@189551341855703040>` (ID: 1379612520209453167)
  - `Ticket n° 1379611187536461824- de <@189551341855703040>` (ID: 1379611187536461824)
- **1 manually configured channel** (ID: 1379531768637427824)

## Webhook Payload Enhancement

Messages from ticket channels now include:
```json
{
  "event": "message_create",
  "timestamp": "2025-06-08T20:48:58.735Z",
  "data": {
    "channel": {
      "id": "1379612520209453167",
      "name": "Ticket n° 1379612520209453167- de <@189551341855703040>",
      "type": 0,
      "isTicketChannel": true
    },
    // ... other message data
  }
}
```

## AI Agent Integration

The AI agent can now:
1. Identify ticket messages using the `isTicketChannel` flag
2. Respond appropriately to support requests in ticket channels
3. Handle ticket workflows without manual channel configuration

## Configuration

No additional configuration required. The bot automatically:
- Detects channels with "ticket" in the name (case-insensitive)
- Respects existing guild filtering (if configured)
- Maintains compatibility with existing channel filtering

## Testing

To test the functionality:
1. Create a new channel with "ticket" in the name
2. Send a message in that channel
3. The bot will automatically monitor and forward the message to your webhook
4. The webhook payload will include `"isTicketChannel": true`