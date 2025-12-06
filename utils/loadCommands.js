import { Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client, guildId) {
  client.commands = new Collection();

  // Load command files
  const commandFiles = readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(__dirname, '../commands', file);
    try {
      const commandModule = await import(filePath);
      const command = commandModule.default;

      if (!command?.data || !command?.execute) {
        console.warn(`Skipping ${file} — missing data or execute.`);
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
    } catch (err) {
      console.error(`Failed to load command ${file}:`, err);
    }
  }

  if (!process.env.TOKEN || !process.env.CLIENTID) {
    throw new Error('Missing TOKEN or CLIENTID environment variables');
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const commands = client.commands.map(cmd => cmd.data.toJSON());

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENTID, guildId),
      { body: commands }
    );
    console.log('Guild commands registered successfully');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
}
