import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

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
            option.setName('target').setDescription('User to check.').setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('target');

        try {
            const response = await fetch(BASE_URL, { headers: { 'X-Master-Key': API_KEY } });
            const bin = await response.json();
            const logs = Array.isArray(bin.record) ? bin.record : [];

            const userLogs = logs
                .filter(log => log.user === user.id)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .map((log, i) => ({ ...log, displayId: formatGeneratedId(i + 1) }));

            if (userLogs.length === 0) {
                return interaction.reply({ content: 'No history found for this user.', ephemeral: true });
            }

            const pageSize = 5;
            const reversedLogs = [...userLogs].reverse();
            let page = 0;
            const totalPages = Math.ceil(reversedLogs.length / pageSize);

            const generateEmbed = (page) => {
                const start = page * pageSize;
                const currentLogs = reversedLogs.slice(start, start + pageSize);
                return new EmbedBuilder()
                    .setTitle(`History for ${user.tag}`)
                    .setDescription(
                        currentLogs.map(log =>
                            `**${log.displayId}** • ${log.type || 'unknown'} • ${log.reason || 'No reason provided.'}\n— <@${log.moderator || 'Unknown'}>`
                        ).join('\n\n')
                    )
                    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
            );

            const message = await interaction.reply({ embeds: [generateEmbed(page)], components: [row], fetchReply: true });

            const collector = message.createMessageComponentCollector({ time: 120000 });

            collector.on('collect', i => {
                if (i.user.id !== interaction.user.id) return i.reply({ content: 'You cannot control this pagination.', ephemeral: true });
                if (i.customId === 'next' && page < totalPages - 1) page++;
                if (i.customId === 'prev' && page > 0) page--;
                i.update({
                    embeds: [generateEmbed(page)],
                    components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('prev').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                        new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
                    )]
                });
            });

            collector.on('end', () => message.edit({ components: [] }).catch(() => {}));

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'Failed to fetch history.', ephemeral: true });
        }
    }
};
