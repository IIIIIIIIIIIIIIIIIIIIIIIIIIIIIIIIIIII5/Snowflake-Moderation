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
    } catch (err) {
      console.error(`Failed to load ${file}:`, err);
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const commands = client.commands.map(cmd => cmd.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENTID), { body: commands });
    console.log('Guild commands cleared and registered successfully.');
  } catch (error) {
    console.error(error);
  }
}
