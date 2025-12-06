import { Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  client.commands = new Collection();

  const commandFiles = readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(__dirname, '../commands', file);
    try {
      const commandModule = await import(filePath);
      const command = commandModule.default;

      if (!command?.data || !command?.execute) {
        console.warn(`Skipping "${file}" — missing data or execute.`);
        continue;
      }

      client.commands.set(command.data.name, command);
    } catch (err) {
      console.error(`Failed to load "${file}":`, err);
    }
  }

  console.log(`Loaded ${client.commands.size} commands:`, [...client.commands.keys()]);

  if (!process.env.CLIENTID || !process.env.TOKEN) {
    throw new Error('Missing CLIENTID or TOKEN in environment variables.');
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  const commands = client.commands.map(cmd => cmd.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENTID), {
      body: commands,
    });
    console.log('Global slash commands registered successfully.');
  } catch (error) {
    console.error('Failed to register global commands:', error);
  }
}
