import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096'];
const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export default {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View moderation history for a user.')
        .addUserOption(option =>
            option.setName('target')
                  .setDescription('User to check.')
                  .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id)))
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });

        const user = interaction.options.getUser('target');

        try {
            const res = await fetch(BASE_URL, { headers: { 'X-Master-Key': API_KEY } });
            const bin = await res.json();
            const logs = Array.isArray(bin.record) ? bin.record : [];

            const userLogs = logs.filter(l => l.user === user.id);

            if (userLogs.length === 0)
                return interaction.reply({ content: 'No history found for this user.', ephemeral: true });

            const description = userLogs
                .slice(-10)
                .map(log => `**${log.type.toUpperCase()}** • ${log.reason} — <@${log.moderator}> (${new Date(log.timestamp).toLocaleString()})`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`History for ${user.tag}`)
                .setDescription(description)
                .setColor(0x0099FF)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to fetch history.', ephemeral: true });
        }
    }
};
