import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Temporarily mute (timeout) a user.')
        .addUserOption(option =>
            option.setName('target')
                  .setDescription('The user to timeout.')
                  .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                  .setDescription('Timeout duration in minutes.')
                  .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                  .setDescription('Reason for the timeout.')
                  .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const member = interaction.options.getMember('target');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided.';

        if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
        if (!member.moderatable) return interaction.reply({ content: 'I cannot timeout this user.', ephemeral: true });

        const ms = duration * 60 * 1000;

        try {
            await member.timeout(ms, reason);

            const embed = new EmbedBuilder()
                .setDescription(`<@${member.id}> has been muted for **${duration} minutes**.\n Reason: ${reason}`)
                .setColor(0x808080)
                .setTimestamp()
                .setFooter({ text: `Muted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to timeout user.', ephemeral: true });
        }
    }
};
