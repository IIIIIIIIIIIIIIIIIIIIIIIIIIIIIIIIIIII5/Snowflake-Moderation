import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const LOG_CHANNEL_ID = '1419190262697033758';
const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096', '1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption(option =>
      option.setName('target').setDescription('User to warn').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for warning').setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id)))
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });

    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason');
    if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });

    const dmEmbed = new EmbedBuilder()
      .setTitle('# PUNISHMENT RECEIVED')
      .setDescription(`You have been **warned** in **Snowflake Penitentiary Communications Server**, for ${reason}.  
If you feel this punishment has been delivered to you unfairly, join our [Administration Server](https://discord.gg/ZSJuzdVAee) to appeal.`)
      .setColor(0xFFD700)
      .setTimestamp();

    try { await member.send({ embeds: [dmEmbed] }); } catch {}

    const publicEmbed = new EmbedBuilder()
      .setDescription(`<@${member.id}> has been warned. Reason: ${reason}`)
      .setColor(0xFFD700)
      .setTimestamp()
      .setFooter({ text: `Warned by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [publicEmbed] });

    const logData = { type: 'warn', user: member.id, moderator: interaction.user.id, reason };
    await logAction(logData);

    const logs = await (await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
      headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY }
    })).json();
    const caseNum = logs.record.length;

    const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

    const logEmbed = new EmbedBuilder()
      .setTitle(`Warning Issued - ${member.user.tag}`)
      .addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Issued by', value: `<@${interaction.user.id}>`, inline: false },
        { name: 'Time', value: timestamp, inline: false }
      )
      .setFooter({ text: `Case #${caseNum}` })
      .setColor(0xFFD700)
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  }
};
