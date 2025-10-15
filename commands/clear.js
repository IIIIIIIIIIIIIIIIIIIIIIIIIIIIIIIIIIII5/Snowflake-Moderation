import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete messages in the current channel.')
        .addIntegerOption(option =>
            option.setName('amount').setDescription('Number of messages to delete (1–100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100)
            return interaction.reply({ content: 'You can only delete 1–100 messages.', ephemeral: true });

        const messages = await interaction.channel.messages.fetch({ limit: amount });
        await interaction.channel.bulkDelete(messages, true);

        const embed = new EmbedBuilder()
            .setDescription(`Deleted **${messages.size}** messages.`)
            .setColor(0x00FFFF)
            .setTimestamp()
            .setFooter({ text: `Cleared by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
