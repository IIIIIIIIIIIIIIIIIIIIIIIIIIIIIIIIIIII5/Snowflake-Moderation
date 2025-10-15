import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server.')
        .addStringOption(option =>
            option.setName('userid').setDescription('User ID to unban').setRequired(true))
        .addStringOption(option =>
            option.setName('reason').setDescription('Reason for unban').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id)))
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });

        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided.';

        try {
            await interaction.guild.members.unban(userId, reason);

            const embed = new EmbedBuilder()
                .setDescription(`User <@${userId}> has been unbanned. Reason: ${reason}`)
                .setColor(0x00FF00)
                .setTimestamp()
                .setFooter({ text: `Unbanned by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });

            await logAction({
                type: 'unban',
                user: userId,
                moderator: interaction.user.id,
                reason
            });
        } catch {
            await interaction.reply({ content: 'Failed to unban user.', ephemeral: true });
        }
    }
};
