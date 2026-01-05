import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const AllowedRoles = [
  '1398691449939169331',
  '1386369108408406096',
  '1418979785165766717',
  '1443622126203572304'
];

const LogChannelId = '1419190262697033758';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('appealable')
        .setDescription('Can this punishment be appealed?')
        .setRequired(true)
        .addChoices(
          { name: 'Yes', value: 'Yes' },
          { name: 'No', value: 'No' }
        )
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    ),

  async execute(Interaction) {
    await Interaction.deferReply();

    if (!Interaction.member.roles.cache.some(r => AllowedRoles.includes(r.id))) {
      return Interaction.editReply({
        content: 'You do not have permission.'
      });
    }

    const TargetUser = Interaction.options.getUser('target');
    const TargetMember = Interaction.options.getMember('target');
    const Appealable = Interaction.options.getString('appealable') ?? 'Yes';
    const Reason = Interaction.options.getString('reason') ?? 'No reason provided.';

    if (TargetMember && !TargetMember.bannable) {
      return Interaction.editReply({
        content: 'I cannot ban this user.'
      });
    }

    let DmDescription = `You have been banned from Snowflake Penitentiary Communications Server for **${Reason}**.`;

    if (Appealable === 'Yes') {
      DmDescription += `\n\nIf you believe this punishment was unfair, join our [Administration Server](https://discord.gg/ZSJuzdVAee) to appeal.`;
    }

    const DmEmbed = new EmbedBuilder()
      .setTitle('PUNISHMENT RECEIVED')
      .setDescription(DmDescription)
      .setColor(0xFF0000)
      .setTimestamp();

    try {
      await TargetUser.send({ embeds: [DmEmbed] });
    } catch {}

    await Interaction.guild.members.ban(TargetUser.id, { reason: Reason });

    let PunishmentId = '#N/A';
    try {
      const rawLogId = await logAction({
        type: 'ban',
        user: TargetUser.id,
        moderator: Interaction.user.id,
        reason: Reason,
        appealable: Appealable
      });
      PunishmentId = rawLogId ?? '#N/A';
    } catch (err) {
      console.error('Logging failed:', err);
    }

    const PublicEmbed = new EmbedBuilder()
      .setDescription(`<@${TargetUser.id}> has been banned.\n**Reason:** ${Reason}`)
      .setColor(0xFF0000)
      .setFooter({ text: `Banned by ${Interaction.user.tag}` })
      .setTimestamp();

    await Interaction.editReply({ embeds: [PublicEmbed] });

    try {
      const LogChannel = await Interaction.client.channels.fetch(LogChannelId);
      if (!LogChannel) return;

      const LogEmbed = new EmbedBuilder()
        .setTitle(`Ban Issued - ${TargetUser.tag}`)
        .addFields(
          { name: 'Reason', value: Reason },
          { name: 'Appealable', value: Appealable },
          { name: 'Issued by', value: `<@${Interaction.user.id}>` },
          {
            name: 'Time',
            value: new Date().toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short'
            })
          }
        )
        .setFooter({ text: `Case ${PunishmentId}` })
        .setColor(0xFF0000);

      await LogChannel.send({ embeds: [LogEmbed] });
    } catch (err) {
      console.error('Failed to send log:', err);
    }
  }
};
