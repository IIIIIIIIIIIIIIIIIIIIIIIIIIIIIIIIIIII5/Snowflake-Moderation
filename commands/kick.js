import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server.')
        .addUserOption(option =>
            option.setName('target').setDescription('The user to kick.').setRequired(true))
        .addStringOption(option =>
            option.setName('reason').setDescription('Reason for the kick.').setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const member = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided.';

        if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (!member.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });

        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setDescription(`<@${member.id}> has been kicked for **${reason}**.`)
            .setColor(0xFFA500)
            .setTimestamp()
            .setFooter({ text: `Kicked by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }
};
