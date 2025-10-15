import { REST, Routes } from 'discord.js';
import fs from 'fs';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    const commands = [];

    for (const file of commandFiles) {
      const command = await import(`../commands/${file}`);
      commands.push(command.default.data.toJSON());
    }

    try {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENTID),
        { body: commands }
      );
      console.log('Global slash commands registered successfully!');
    } catch (error) {
      console.error('Failed to register global commands:', error);
    }
  },
};
