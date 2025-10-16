import { REST, Routes } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    if (!process.env.CLIENTID || !process.env.TOKEN) {
      throw new Error('Missing CLIENTID or TOKEN in environment variables.');
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    const commands = client.commands?.map(cmd => cmd.data?.toJSON()) || [];

    if (!commands.length) {
      console.warn('No commands found to register.');
      return;
    }

    try {
      await rest.put(Routes.applicationCommands(process.env.CLIENTID), {
        body: commands,
      });
      console.log('Global slash commands registered successfully.');
    } catch (error) {
      console.error('Failed to register global commands:', error);
    }
  },
};
