import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];

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
      .setDescription(`You have been **warned** in **Snowflake Penitentiary Communications Server**, for **this instance**.  
If you feel this punishment has been delivered to you unfairly, then join our [Administration Server](https://discord.gg/ZSJuzdVAee) to appeal your punishment.`)
      .setColor(0xFFD700)
      .setTimestamp()
      .setFooter({ text: `Timestamp: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}` });

    try {
      await member.send({ embeds: [dmEmbed] });
    } catch {
      console.warn(`Failed to DM ${member.user.tag}`);
    }

    const publicEmbed = new EmbedBuilder()
      .setDescription(`<@${member.id}> has been warned. Reason: ${reason}`)
      .setColor(0xFFD700)
      .setTimestamp()
      .setFooter({ text: `Warned by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [publicEmbed] });

    await logAction({
      type: 'warn',
      user: member.id,
      moderator: interaction.user.id,
      reason
    });
  }
};
