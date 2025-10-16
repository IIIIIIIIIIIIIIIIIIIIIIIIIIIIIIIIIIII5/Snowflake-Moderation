import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(option =>
      option.setName('target').setDescription('User to kick').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the kick').setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id)))
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });

    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });

    const dmEmbed = new EmbedBuilder()
      .setTitle('# PUNISHMENT RECEIVED')
      .setDescription(`You have been **kicked** from **Snowflake Penitentiary Communications Server**, for ${reason}.  
If you feel this punishment has been delivered to you unfairly, then join our [Administration Server](https://discord.gg/ZSJuzdVAee) to appeal your punishment.`)
      .setColor(0xFFA500)
      .setTimestamp()
      .setFooter({ text: `Timestamp: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}` });

    try {
      await member.send({ embeds: [dmEmbed] });
    } catch {
      console.warn(`Failed to DM ${member.user.tag}`);
    }

    await member.kick(reason);

    const publicEmbed = new EmbedBuilder()
      .setDescription(`<@${member.id}> has been kicked. Reason: ${reason}`)
      .setColor(0xFFA500)
      .setTimestamp()
      .setFooter({ text: `Kicked by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [publicEmbed] });

    await logAction({
      type: 'kick',
      user: member.id,
      moderator: interaction.user.id,
      reason
    });
  }
};
