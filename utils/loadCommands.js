import { Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
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

  const CLIENT_ID = process.env.CLIENTID?.replace(/"/g, '');
  const TOKEN = process.env.TOKEN?.replace(/"/g, '');

  if (!CLIENT_ID || !TOKEN) {
    throw new Error('Missing CLIENTID or TOKEN in environment variables.');
  }

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commands = client.commands.map(cmd => cmd.data.toJSON());

  console.log('Registering commands...');
  console.log('Commands to register:', commands.map(c => c.name));

  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('Commands registered successfully!');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
}
