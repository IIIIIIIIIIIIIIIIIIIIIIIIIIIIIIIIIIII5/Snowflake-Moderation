import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const AUDIT_BIN_ID = process.env.JSONBIN_AUDIT_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const AUDIT_URL = `https://api.jsonbin.io/v3/b/${AUDIT_BIN_ID}`;
const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096', '1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('audit')
    .setDescription('View punishment deletion audit log'),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id)))
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });

    try {
      const res = await fetch(AUDIT_URL, { headers: { 'X-Master-Key': API_KEY } });
      const bin = await res.json();
      const logs = Array.isArray(bin.record) ? bin.record : [];

      if (logs.length === 0)
        return interaction.reply({ content: 'No audit entries found.', ephemeral: true });

      const description = logs
        .slice(-10)
        .map(log => `**${log.id}** • ${log.type.toUpperCase()} cleared by <@${log.moderator}> (original: <@${log.originalModerator}>)\nReason: ${log.reason}\n<t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:F>`)
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setTitle('Punishment Audit Log')
        .setDescription(description)
        .setColor(0xffaa00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Failed to fetch audit log.', ephemeral: true });
    }
  }
};
