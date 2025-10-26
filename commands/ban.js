import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const LOG_CHANNEL_ID = '1419190262697033758';
const ALLOWED_ROLES = ['1398691449939169331','1386369108408406096','1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(option => option.setName('target').setDescription('User to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the ban').setRequired(false)),

  async execute(interaction) {
    if(!interaction.member.roles.cache.some(r=>ALLOWED_ROLES.includes(r.id)))
      return interaction.reply({ content:'You do not have permission.', ephemeral:true });

    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    if(!member) return interaction.reply({ content:'User not found', ephemeral:true });
    if(!member.bannable) return interaction.reply({ content:'I cannot ban this user.', ephemeral:true });

    const dmEmbed = new EmbedBuilder()
      .setTitle('# PUNISHMENT RECEIVED')
      .setDescription(`You have been **banned** from **Snowflake Penitentiary Communications Server**, for ${reason}.`)
      .setColor(0xFF0000)
      .setTimestamp();

    try { await member.send({ embeds:[dmEmbed] }); } catch {}

    await member.ban({ reason });

    const publicEmbed = new EmbedBuilder()
      .setDescription(`<@${member.id}> has been banned. Reason: ${reason}`)
      .setColor(0xFF0000)
      .setTimestamp()
      .setFooter({ text:`Banned by ${interaction.user.tag}` });

    await interaction.reply({ embeds:[publicEmbed] });

    const punishmentId = await logAction({ type:'ban', user:member.id, moderator:interaction.user.id, reason });

    const logEmbed = new EmbedBuilder()
      .setTitle(`Ban Issued - ${member.user.tag}`)
      .addFields(
        { name:'Reason', value:reason },
        { name:'Issued by', value:`<@${interaction.user.id}>` },
        { name:'Time', value:new Date().toLocaleString('en-US',{ dateStyle:'full', timeStyle:'short' }) }
      )
      .setFooter({ text:`Case ${punishmentId}` })
      .setColor(0xFF0000);

    const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
    await logChannel.send({ embeds:[logEmbed] });
  }
};
