import { Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GuildId = '1386275140815425557';

export async function loadCommands(client) {
  client.commands = new Collection();

  const commandFiles = readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(__dirname, '../commands', file);
    try {
      const commandModule = await import(filePath);
      const command = commandModule.default;
      if (!command?.data || !command?.execute) continue;
      client.commands.set(command.data.name, command);
    } catch {}
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const commands = client.commands.map(cmd => cmd.data.toJSON());

  try {
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, GuildId), { body: [] });
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, GuildId), { body: commands });
    await rest.put(Routes.applicationCommands(process.env.CLIENTID), { body: commands });
  } catch (error) {
    console.error(error);
  }
}
