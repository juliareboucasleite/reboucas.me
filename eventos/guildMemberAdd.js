const { Events } = require('discord.js');
const { sendLifecycleMessage } = require('../backend/utils/discordAdmin');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      await sendLifecycleMessage(member.client, 'welcome', member);
    } catch (error) {
      console.error('[welcome]', error);
    }
  },
};
