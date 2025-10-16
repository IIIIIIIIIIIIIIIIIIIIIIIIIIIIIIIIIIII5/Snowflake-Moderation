import { REST, Routes } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    if (!process.env.CLIENTID || !process.env.TOKEN || !process.env.GUILDID) {
      throw new Error('Missing CLIENTID, TOKEN, or GUILDID in environment variables.');
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    const commands = client.commands?.map(cmd => cmd.data?.toJSON()) || [];

    if (!commands.length) {
      console.warn('No commands found to register.');
      return;
    }

    try {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID),
        { body: commands }
      );
      console.log('Guild slash commands registered successfully.');
    } catch (error) {
      console.error('Failed to register guild commands:', error);
    }
  },
};
