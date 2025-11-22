import { Client, Collection, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { loadCommands } from './utils/loadCommands.js';
import { updateReason, revokePunishment } from './utils/logAction.js';
import fs from 'fs';

const Token = process.env.TOKEN?.replace(/"/g, '');

const RoleTable = {
  ChiefOfStaff: "1398691258742079629",
  ChairpersonOfTheBoard: "1398691259568361538",
  LeadershipPingBypass: "1441730075891597363",
  BotDev: "1418979785165766717",
  Leadership: "1386369108408406096"
};

const ClientBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

ClientBot.commands = new Collection();
await loadCommands(ClientBot);

ClientBot.once('ready', () => console.log(`Logged in as ${ClientBot.user.tag}`));

ClientBot.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const Member = await message.guild.members.fetch(message.author.id).catch(() => null);
  if (!Member) return;

  const Whitelisted = Object.values(RoleTable).some(r => Member.roles.cache.has(r));

  const MentionedIds = message.content.match(/<@!?(\d+)>/g)?.map(m => m.replace(/[<@!>]/g, "")) || [];

  const MentionedLeadership = MentionedIds
    .map(id => message.guild.members.cache.get(id))
    .filter(m => m?.roles.cache.has(RoleTable.Leadership));

  if (MentionedLeadership.length > 0 && !Whitelisted) {

    try {
      await message.delete();
    }
    catch (err) {
      console.error(err);
    }

    try {
      await Member.timeout(5 * 60 * 1000, "Unauthorized leadership ping");
    }
    catch (err) {
      console.error(err);
    }

    try {
      await Member.send("You are not permitted to ping SFP Leadership. You have been timed out for 5 minutes.");
    }
    catch (err) {
      console.error(err);
    }

    return;
  }
});

ClientBot.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const Command = ClientBot.commands.get(interaction.commandName);
    if (!Command) return;

    try {
      await Command.execute(interaction);
    }
    catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error executing this command.',
        ephemeral: true
      });
    }
  }

  else if (interaction.isButton()) {
    const [Action, UserId, PunishmentId] = interaction.customId.split('_');

    if (Action === 'editReason') {
      const Modal = new ModalBuilder()
        .setCustomId(`editReasonModal_${UserId}_${PunishmentId}`)
        .setTitle('Edit Punishment Reason');

      const Input = new TextInputBuilder()
        .setCustomId('newReason')
        .setLabel('New Reason')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      Modal.addComponents(new ActionRowBuilder().addComponents(Input));
      await interaction.showModal(Modal);
    }

    else if (Action === 'revoke') {
      await revokePunishment(UserId, PunishmentId);

      const LogsResponse = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
        headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY }
      });

      const BinData = await LogsResponse.json();
      const Logs = Array.isArray(BinData.record) ? BinData.record : [];

      const Punished = Logs.find(l => l.user === UserId && l.id === PunishmentId);

      try {
        const Member = await interaction.guild.members.fetch(UserId);

        await Member.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('PUNISHMENT REVOKED')
              .setDescription(`Your punishment (Case ${PunishmentId}) has been revoked.`)
              .setColor(0x00FF00)
              .setTimestamp()
          ]
        });

        if (Punished?.type === 'mute') await Member.timeout(null, 'Mute revoked');
        else if (Punished?.type === 'ban') await interaction.guild.members.unban(UserId, 'Ban revoked');
        else if (Punished?.type === 'unban') await interaction.guild.members.ban(UserId, { reason: 'Unban revoked' });
      }
      catch {}

      await interaction.update({ components: [] });
    }
  }

  else if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('editReasonModal_')) {
      const [, UserId, PunishmentId] = interaction.customId.split('_');
      const NewReason = interaction.fields.getTextInputValue('newReason');

      await updateReason(UserId, PunishmentId, NewReason);

      try {
        const Member = await interaction.guild.members.fetch(UserId);

        await Member.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('REASON EDITED')
              .setDescription(`Your punishment reason (Case ${PunishmentId}) has been updated to: ${NewReason}`)
              .setColor(0xFFFF00)
              .setTimestamp()
          ]
        });

        const LogMessage = interaction.message;
        if (LogMessage) {
          const Embed = EmbedBuilder.from(LogMessage.embeds[0]);

          const Fields = Embed.data.fields.map(f =>
            f.name === 'Reason'
              ? { name: 'Reason', value: NewReason }
              : f
          );

          Embed.setFields(Fields);
          await LogMessage.edit({ embeds: [Embed] });
        }
      }
      catch {}

      await interaction.reply({
        content: 'Reason updated successfully.',
        ephemeral: true
      });
    }
  }
});

ClientBot.login(Token);
