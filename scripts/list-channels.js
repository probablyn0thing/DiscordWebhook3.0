#!/usr/bin/env node

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

async function listChannels() {
  if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN environment variable is required');
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
    ]
  });

  try {
    console.log('🔍 Connecting to Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    
    console.log('✅ Connected! Listing all accessible channels:\n');
    
    let totalChannels = 0;
    
    for (const guild of client.guilds.cache.values()) {
      console.log(`📁 Server: ${guild.name} (ID: ${guild.id})`);
      console.log('─'.repeat(50));
      
      const textChannels = guild.channels.cache
        .filter(channel => channel.isTextBased())
        .sort((a, b) => a.name.localeCompare(b.name));
      
      if (textChannels.size === 0) {
        console.log('   No accessible text channels');
      } else {
        textChannels.forEach(channel => {
          console.log(`   📝 #${channel.name} (ID: ${channel.id})`);
          totalChannels++;
        });
      }
      console.log('');
    }
    
    console.log(`💡 Total accessible channels: ${totalChannels}`);
    console.log('\n📋 To monitor specific channels, add their IDs to CHANNEL_IDS environment variable:');
    console.log('CHANNEL_IDS=channel_id1,channel_id2,channel_id3');
    console.log('\n📋 To monitor specific servers, add their IDs to GUILD_IDS environment variable:');
    console.log('GUILD_IDS=guild_id1,guild_id2');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.destroy();
  }
}

if (require.main === module) {
  listChannels().catch(console.error);
}

module.exports = { listChannels };