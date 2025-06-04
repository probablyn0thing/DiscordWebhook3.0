// Health check endpoint for serverless deployment
export default function handler(req: any, res: any) {
  const response = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Discord Webhook Bot',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    message: 'Bot service is running. Configure DISCORD_TOKEN and WEBHOOK_URL environment variables to start monitoring Discord messages.'
  };

  res.status(200).json(response);
}