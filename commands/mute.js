import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user by assigning the Muted role.')
        .addUserOption(option =>
            option.setName('target').setDescription('The user to mute.').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const member = interaction.options.getMember('target');
        if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });

        const muteRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        if (!muteRole) return interaction.reply({ content: 'No role named "Muted" found. Please create one.', ephemeral: true });

        await member.roles.add(muteRole);

        const embed = new EmbedBuilder()
            .setDescription(`<@${member.id}> has been muted.`)
            .setColor(0x808080)
            .setTimestamp()
            .setFooter({ text: `Muted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }
};
