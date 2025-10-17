import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096', '1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('List allowed roles by name'),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const roles = interaction.guild.roles.cache
      .filter(role => ALLOWED_ROLES.includes(role.id) || role.name.toLowerCase() === 'whitelist')
      .sort((a, b) => b.position - a.position)
      .map(role => `${role.name} - ${role.id}`);

    const embed = new EmbedBuilder()
      .setTitle('Allowed Roles')
      .setDescription(roles.join('\n'))
      .setColor(0x00bfff)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
