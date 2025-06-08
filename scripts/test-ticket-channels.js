#!/usr/bin/env node
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

async function testTicketChannelDetection() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  try {
    console.log('🔍 Testing ticket channel detection...\n');
    
    await client.login(process.env.DISCORD_TOKEN);
    
    client.once('ready', async () => {
      console.log(`✅ Connected as ${client.user.tag}\n`);
      
      console.log('📊 Scanning all channels for ticket channels:\n');
      
      let totalTicketChannels = 0;
      
      for (const guild of client.guilds.cache.values()) {
        console.log(`🏢 Guild: ${guild.name} (${guild.id})`);
        
        const ticketChannels = [];
        const allChannels = [];
        
        for (const channel of guild.channels.cache.values()) {
          if (channel.isTextBased()) {
            allChannels.push(channel);
            
            if (channel.name.toLowerCase().includes('ticket')) {
              ticketChannels.push(channel);
              totalTicketChannels++;
            }
          }
        }
        
        console.log(`   📺 Total text channels: ${allChannels.length}`);
        console.log(`   🎫 Ticket channels found: ${ticketChannels.length}`);
        
        if (ticketChannels.length > 0) {
          ticketChannels.forEach(channel => {
            console.log(`      ├─ ${channel.name} (${channel.id})`);
          });
        }
        console.log('');
      }
      
      console.log(`🎯 Summary:`);
      console.log(`   Total ticket channels across all guilds: ${totalTicketChannels}`);
      console.log(`   These channels will be automatically monitored for messages`);
      console.log(`   Messages from these channels will be marked with isTicketChannel: true`);
      
      client.destroy();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Add timeout to prevent hanging
setTimeout(() => {
  console.log('⏰ Test timed out after 30 seconds');
  process.exit(1);
}, 30000);

testTicketChannelDetection();