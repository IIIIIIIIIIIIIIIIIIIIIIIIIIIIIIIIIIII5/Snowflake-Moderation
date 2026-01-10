import { SlashCommandBuilder } from 'discord.js';

const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const ALLOWED_ROLES = ['1398691449939169331', '1386369108408406096', '1418979785165766717', '1443622126203572304'];

function formatGeneratedId(n) {
    return `#${String(n).padStart(4, '0')}`;
}

export default {
    data: new SlashCommandBuilder()
        .setName('clearpunishment')
        .setDescription('Remove a specific punishment by its per-user ID.')
        .addStringOption(opt =>
            opt.setName('id')
                .setDescription('Punishment ID (e.g. #0002)')
                .setRequired(true)
        )
        .addUserOption(opt =>
            opt.setName('target')
                .setDescription('User whose punishment you want to clear')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
            return interaction.reply({ content: 'You lack permission to use this command.', ephemeral: true });
        }

        const rawId = interaction.options.getString('id');
        const id = rawId.startsWith('#') ? rawId : `#${rawId}`;
        const targetUser = interaction.options.getUser('target');

        try {
            const res = await fetch(BASE_URL, { headers: { 'X-Master-Key': API_KEY } });
            const bin = await res.json();
            const logs = Array.isArray(bin.record) ? bin.record : [];

            const userLogs = logs
                .filter(l => l.user === targetUser.id)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const index = userLogs.findIndex((_, i) => formatGeneratedId(i + 1) === id);
            if (index === -1) {
                return interaction.reply({ content: `No punishment found with ID ${id} for ${targetUser.tag}.`, ephemeral: true });
            }

            const logToRemove = userLogs[index];
            const globalIndex = logs.findIndex(l => l === logToRemove);
            logs.splice(globalIndex, 1);

            await fetch(BASE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(logs)
            });

            return interaction.reply({
                content: `Punishment ${id} (${logToRemove.type}) for ${targetUser.tag} has been cleared.`
            });

        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Failed to clear punishment.', ephemeral: true });
        }
    }
};
