import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { loadCommands } from './utils/loadCommands.js';
import fs from 'fs';

const TOKEN = process.env.TOKEN?.replace(/"/g, '');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

await loadCommands(client);

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error executing this command.',
      ephemeral: true
    });
  }
});

client.login(TOKEN);
