import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = ['1398691449939169331','1386369108408406096','1418979785165766717' '1443622126203572304'];

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete messages in the current channel.')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');
    if (amount < 1) return interaction.reply({ content: 'You must delete at least 1 message.', ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: amount });
    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    const deletable = messages.filter(msg => (now - msg.createdTimestamp) <= fourteenDays);
    const tooOld = messages.filter(msg => (now - msg.createdTimestamp) > fourteenDays);

    if (deletable.size > 0) await interaction.channel.bulkDelete(deletable, true);

    const embed = new EmbedBuilder()
      .setColor(0x00FFFF)
      .setTimestamp()
      .setFooter({ text: `Cleared by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(`Deleted **${deletable.size}** message(s).${tooOld.size > 0 ? ` Skipped **${tooOld.size}** message(s) older than 14 days.` : ''}`);

    await interaction.reply({ embeds: [embed] });
  }
};
