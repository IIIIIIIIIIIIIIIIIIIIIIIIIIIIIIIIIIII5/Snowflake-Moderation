import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const LOG_CHANNEL_ID = '1419190262697033758';
const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096', '1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Temporarily mute (timeout) a user.')
    .addUserOption(option =>
      option.setName('target').setDescription('User to mute').setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration').setDescription('Duration in minutes').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for mute').setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id)))
      return interaction.reply({ content: 'You do not have permission.', ephemeral: true });

    const member = interaction.options.getMember('target');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: 'I cannot mute this user.', ephemeral: true });

    const ms = duration * 60 * 1000;
    await member.timeout(ms, reason);

    const dmEmbed = new EmbedBuilder()
      .setTitle('# PUNISHMENT RECEIVED')
      .setDescription(`You have been **muted** for **${duration} minutes** in **Snowflake Penitentiary Communications Server**, for ${reason}.`)
      .setColor(0x808080)
      .setTimestamp();

    try { await member.send({ embeds: [dmEmbed] }); } catch {}

    const replyEmbed = new EmbedBuilder()
      .setDescription(`<@${member.id}> has been muted for **${duration} minutes**. Reason: ${reason}`)
      .setColor(0x808080)
      .setTimestamp()
      .setFooter({ text: `Muted by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [replyEmbed] });

    const logData = { type: 'mute', user: member.id, moderator: interaction.user.id, reason };
    await logAction(logData);

    const logs = await (await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
      headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY }
    })).json();
    const caseNum = logs.record.length;

    const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

    const logEmbed = new EmbedBuilder()
      .setTitle(`Mute Issued - ${member.user.tag}`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Issued by', value: `<@${interaction.user.id}>` },
        { name: 'Time', value: timestamp }
      )
      .setFooter({ text: `Case #${caseNum}` })
      .setColor(0x808080)
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  }
};
