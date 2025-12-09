import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const ALLOWED_ROLES = [
    '1398691449939169331',
    '1386369108408406096',
    '1418979785165766717',
    '1443622126203572304'
];

const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

function formatGeneratedId(n) {
    return `#${String(n).padStart(4, '0')}`;
}

export default {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View moderation history for a user.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('User to check.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const hasPermission = interaction.member.roles.cache.some(role =>
            ALLOWED_ROLES.includes(role.id)
        );
        if (!hasPermission) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('target');

        try {
            const response = await fetch(BASE_URL, {
                headers: { 'X-Master-Key': API_KEY }
            });
            const bin = await response.json();
            const logs = Array.isArray(bin.record) ? bin.record : [];

            if (logs.length === 0) {
                return interaction.reply({
                    content: 'No moderation logs exist yet.',
                    ephemeral: true
                });
            }

            const allSorted = [...logs];

            const displayIdMap = new Map();
            allSorted.forEach((log, index) => {
                const validId = log.id && log.id.trim() !== '' ? log.id : formatGeneratedId(index + 1);
                displayIdMap.set(log, validId);
            });

            const userLogs = allSorted
                .filter(log => log.user === user.id)
                .map(log => ({
                    ...log,
                    displayId: displayIdMap.get(log)
                }));

            if (userLogs.length === 0) {
                return interaction.reply({
                    content: 'No history found for this user.',
                    ephemeral: true
                });
            }

            const description = userLogs
                .slice(-10)
                .map(log => {
                    return (
                        `**${log.displayId ?? 'N/A'}** • ${log.type || 'unknown'} • ${log.reason || 'No reason provided.'}\n` +
                        `— <@${log.moderator || 'Unknown'}>`
                    );
                })
                .join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle(`History for ${user.tag}`)
                .setDescription(description)
                .setColor(0x0099FF);

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Failed to fetch moderation history:', error);
            await interaction.reply({
                content: 'Failed to fetch history.',
                ephemeral: true
            });
        }
    }
};
