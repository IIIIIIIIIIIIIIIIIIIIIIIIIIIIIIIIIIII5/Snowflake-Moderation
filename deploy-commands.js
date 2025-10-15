import { REST, Routes, ActivityType } from "discord.js";

const CLIENT_ID = process.env.CLIENTID;
const TOKEN = process.env.TOKEN;

export default {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    const commands = client.commands.map(cmd => cmd.data.toJSON());

    try {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log("Global slash commands registered successfully.");
    } catch (error) {
      console.error("Failed to register global commands:", error);
    }
  },
};
