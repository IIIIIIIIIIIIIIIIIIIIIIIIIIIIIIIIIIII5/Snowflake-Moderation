import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const LOG_CHANNEL_ID = '1419190262697033758';
const ALLOWED_ROLES = ['1398691449939169331','1386369108408406096','1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption(opt => opt.setName('target').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true)),

  async execute(interaction) {
    if(!interaction.member.roles.cache.some(r=>ALLOWED_ROLES.includes(r.id)))
      return interaction.reply({ content:'No permission', ephemeral:true });

    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason');
    if(!member) return interaction.reply({ content:'User not found', ephemeral:true });

    const rawLogId = await logAction({ type:'warn', user:member.id, moderator:interaction.user.id, reason });
    const punishmentId = rawLogId || '#N/A';

    const dmEmbed = new EmbedBuilder()
      .setTitle('PUNISHMENT RECEIVED')
      .setDescription(`You have been **warned** in Snowflake Penitentiary for ${reason}`)
      .setColor(0xFFD700)
      .setFooter({ text:`Case ${punishmentId}` })
      .setTimestamp();

    try { await member.send({ embeds:[dmEmbed] }); } catch {}

    const publicEmbed = new EmbedBuilder()
      .setDescription(`<@${member.id}> has been warned. Reason: ${reason}`)
      .setColor(0xFFD700)
      .setTimestamp()
      .setFooter({ text:`Warned by ${interaction.user.tag}` });

    await interaction.reply({ embeds: [publicEmbed] });

    const logEmbed = new EmbedBuilder()
      .setTitle(`Warning Issued - ${member.user.tag}`)
      .addFields(
        { name:'Reason', value:reason },
        { name:'Issued by', value:`<@${interaction.user.id}>` },
        { name:'Time', value:new Date().toLocaleString('en-US',{ dateStyle:'full', timeStyle:'short' }) }
      )
      .setFooter({ text:`Case ${punishmentId}` })
      .setColor(0xFFD700);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`editReason_${member.id}_${punishmentId}`).setLabel('Edit Reason').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`revoke_${member.id}_${punishmentId}`).setLabel('Revoke Punishment').setStyle(ButtonStyle.Danger)
    );

    const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
    await logChannel.send({ embeds:[logEmbed], components:[buttons] });
  }
};
