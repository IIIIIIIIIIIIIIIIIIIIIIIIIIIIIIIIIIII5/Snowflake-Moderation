import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logAction } from '../utils/logAction.js';

const LOG_CHANNEL_ID = '1419190262697033758';
const ALLOWED_ROLES = ['1398691449939169331','1386369108408406096','1418979785165766717'];

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server.')
    .addStringOption(option => option.setName('userid').setDescription('User ID to unban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for unban').setRequired(false)),

  async execute(interaction) {
    if(!interaction.member.roles.cache.some(r=>ALLOWED_ROLES.includes(r.id)))
      return interaction.reply({ content:'You do not have permission.', ephemeral:true });

    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    try {
      await interaction.guild.members.unban(userId, reason);

      const rawLogId = await logAction({ type:'unban', user:userId, moderator:interaction.user.id, reason });
      const punishmentId = rawLogId || '#N/A';

      const publicEmbed = new EmbedBuilder()
        .setDescription(`User <@${userId}> has been unbanned. Reason: ${reason}`)
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({ text:`Unbanned by ${interaction.user.tag}` });

      await interaction.reply({ embeds:[publicEmbed] });

      const logEmbed = new EmbedBuilder()
        .setTitle(`Unban Issued - <@${userId}>`)
        .addFields(
          { name:'Reason', value:reason },
          { name:'Issued by', value:`<@${interaction.user.id}>` },
          { name:'Time', value:new Date().toLocaleString('en-US',{ dateStyle:'full', timeStyle:'short' }) }
        )
        .setFooter({ text:`Case ${punishmentId}` })
        .setColor(0x00FF00);

      const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID);
      await logChannel.send({ embeds:[logEmbed] });
    } catch {
      await interaction.reply({ content:'Failed to unban user.', ephemeral:true });
    }
  }
};
