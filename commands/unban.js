import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const LOG_CHANNEL_ID = '1419190262697033758';
const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096', '1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server.')
    .addStringOption(option =>
      option.setName('userid').setDescription('User ID to unban').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for unban').setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id)))
      return interaction.reply({ content: 'You do not have permission.', ephemeral: true });

    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    try {
      await interaction.guild.members.unban(userId, reason);

      const replyEmbed = new EmbedBuilder()
        .setDescription(`User <@${userId}> has been unbanned. Reason: ${reason}`)
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({ text: `Unbanned by ${interaction.user.tag}` });

      await interaction.reply({ embeds: [replyEmbed] });

      const logData = { type: 'unban', user: userId, moderator: interaction.user.id, reason };
      await logAction(logData);

      const logs = await (await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
        headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY }
      })).json();
      const caseNum = logs.record.length;

      const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
      const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

      const logEmbed = new EmbedBuilder()
        .setTitle(`Unban Issued - ${userId}`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Issued by', value: `<@${interaction.user.id}>` },
          { name: 'Time', value: timestamp }
        )
        .setFooter({ text: `Case #${caseNum}` })
        .setColor(0x00FF00)
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } catch {
      await interaction.reply({ content: 'Failed to unban user.', ephemeral: true });
    }
  }
};
