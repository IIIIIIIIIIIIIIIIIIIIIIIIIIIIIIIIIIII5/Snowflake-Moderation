import { Client, Collection, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { loadCommands } from './utils/loadCommands.js';
import { updateReason, revokePunishment } from './utils/logAction.js';
import fs from 'fs';

const TOKEN = process.env.TOKEN?.replace(/"/g, '');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();
await loadCommands(client);

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try { await command.execute(interaction); } 
    catch (error) { console.error(error); await interaction.reply({ content:'There was an error executing this command.', ephemeral:true }); }
  } 
  else if (interaction.isButton()) {
    const [action, userId, punishmentId] = interaction.customId.split('_');

    if (action === 'editReason') {
      const modal = new ModalBuilder()
        .setCustomId(`editReasonModal_${userId}_${punishmentId}`)
        .setTitle('Edit Punishment Reason');

      const input = new TextInputBuilder()
        .setCustomId('newReason')
        .setLabel('New Reason')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    } 
    else if (action === 'revoke') {
      await revokePunishment(userId, punishmentId);

      const logsResponse = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, { headers:{ 'X-Master-Key': process.env.JSONBIN_API_KEY }});
      const binData = await logsResponse.json();
      const logs = Array.isArray(binData.record) ? binData.record : [];
      const punished = logs.find(l => l.user === userId && l.id === punishmentId);

      try {
        const member = await interaction.guild.members.fetch(userId);
        await member.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('PUNISHMENT REVOKED')
              .setDescription(`Your punishment (Case ${punishmentId}) has been revoked.`)
              .setColor(0x00FF00)
              .setTimestamp()
          ]
        });

        if (punished?.type === 'mute') await member.timeout(null, 'Mute revoked');
        else if (punished?.type === 'ban') await interaction.guild.members.unban(userId, 'Ban revoked');
        else if (punished?.type === 'unban') await interaction.guild.members.ban(userId, { reason: 'Unban revoked' });
      } catch {}

      await interaction.update({ components: [] });
    }
  } 
  else if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('editReasonModal_')) {
      const [, userId, punishmentId] = interaction.customId.split('_');
      const newReason = interaction.fields.getTextInputValue('newReason');
      await updateReason(userId, punishmentId, newReason);

      try {
        const member = await interaction.guild.members.fetch(userId);
        await member.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('REASON EDITED')
              .setDescription(`Your punishment reason (Case ${punishmentId}) has been updated to: ${newReason}`)
              .setColor(0xFFFF00)
              .setTimestamp()
          ]
        });

        const logMessage = interaction.message;
        if (logMessage) {
          const embed = EmbedBuilder.from(logMessage.embeds[0]);
          const fields = embed.data.fields.map(f => f.name === 'Reason' ? { name:'Reason', value:newReason } : f);
          embed.setFields(fields);
          await logMessage.edit({ embeds:[embed] });
        }
      } catch {}

      await interaction.reply({ content:'Reason updated successfully.', ephemeral:true });
    }
  }
});

client.login(TOKEN);
