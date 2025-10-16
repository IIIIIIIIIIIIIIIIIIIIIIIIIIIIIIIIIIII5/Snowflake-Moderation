import { Collection } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  client.commands = new Collection();

  const commandFiles = readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(__dirname, '../commands', file);
    const commandModule = await import(filePath);
    const command = commandModule.default;

    if (!command?.data || !command?.execute) {
      console.warn(`Skipping "${file}" — missing data or execute.`);
      continue;
    }

    client.commands.set(command.data.name, command);
  }

  console.log(`Loaded ${client.commands.size} commands:`, [...client.commands.keys()]);
}
