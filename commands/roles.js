import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096', '1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('List all server roles with their IDs'),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const roles = interaction.guild.roles.cache
      .filter(role => role.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .map(role => `${role.name} - ${role.id}`);

    const chunks = [];
    for (let i = 0; i < roles.length; i += 30) {
      chunks.push(roles.slice(i, i + 30).join('\n'));
    }

    for (const chunk of chunks) {
      const embed = new EmbedBuilder()
        .setTitle('Server Roles')
        .setDescription(chunk)
        .setColor(0x00bfff)
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });
    }

    await interaction.reply({ content: 'Role list sent.', ephemeral: true });
  }
};
