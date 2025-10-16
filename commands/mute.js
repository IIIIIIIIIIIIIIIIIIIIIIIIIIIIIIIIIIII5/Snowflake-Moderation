import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];

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
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });

    const member = interaction.options.getMember('target');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: 'I cannot mute this user.', ephemeral: true });

    const ms = duration * 60 * 1000;
    await member.timeout(ms, reason);

    const dmEmbed = new EmbedBuilder()
      .setTitle('# PUNISHMENT RECEIVED')
      .setDescription(`You have been **muted** in **Snowflake Penitentiary Communications Server**, for **${duration} minutes**.  
If you feel this punishment has been delivered to you unfairly, then join our [Administration Server](https://discord.gg/ZSJuzdVAee) to appeal your punishment.`)
      .setColor(0x808080)
      .setTimestamp()
      .setFooter({ text: `Timestamp: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}` });

    try {
      await member.send({ embeds: [dmEmbed] });
    } catch {
      console.warn(`Failed to DM ${member.user.tag}`);
    }

    const publicEmbed = new EmbedBuilder()
      .setDescription(`<@${member.id}> has been muted for **${duration} minutes**. Reason: ${reason}`)
      .setColor(0x808080)
      .setTimestamp()
      .setFooter({ text: `Muted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [publicEmbed] });

    await logAction({
      type: 'mute',
      user: member.id,
      moderator: interaction.user.id,
      reason
    });
  }
};
