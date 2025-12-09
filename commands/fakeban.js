import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const AllowedRoles = ['1398691449939169331','1386369108408406096','1418979785165766717', '1443622126203572304'];

export default {
  data: new SlashCommandBuilder()
    .setName('fakeban')
    .setDescription('Ban a user from the server.')
    .addUserOption(option => option.setName('target').setDescription('User to ban').setRequired(true))
    .addStringOption(option => 
      option.setName('appealable')
        .setDescription('Can this punishment be appealed?')
        .setRequired(true)
        .addChoices(
          { name: 'Yes', value: 'Yes' },
          { name: 'No', value: 'No' }
        )
    )
    .addStringOption(option => option.setName('reason').setDescription('Reason for the ban').setRequired(false)),

  async execute(Interaction) {
    if (!Interaction.member.roles.cache.some(r => AllowedRoles.includes(r.id)))
      return Interaction.reply({ content:'You do not have permission.', ephemeral:true });

    const TargetUser = Interaction.options.getUser('target');
    const Appealable = Interaction.options.getString('appealable') || 'Yes';
    const Reason = Interaction.options.getString('reason') || 'No reason provided.';

    let DmDescription = `You have been banned from Snowflake Penitentiary Communications Server, for **${Reason}**.`;
    if (Appealable === 'Yes') DmDescription += `\n\nIf you feel this punishment has been delivered to you unfairly then join our [Administration Server](https://discord.gg/ZSJuzdVAee) to appeal your punishment.`;

    const DmEmbed = new EmbedBuilder()
      .setTitle('PUNISHMENT RECEIVED')
      .setDescription(DmDescription)
      .setColor(0xFF0000)
      .setTimestamp();

    try {
      await TargetUser.send({
        embeds: [DmEmbed]
      });
    } catch {}

    await Interaction.reply({ content: `Fake banned <@${TargetUser.id}>.`, ephemeral: true });
  }
};
