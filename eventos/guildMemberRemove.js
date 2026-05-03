const { Events } = require('discord.js');
const { sendLifecycleMessage } = require('../backend/utils/discordAdmin');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      await sendLifecycleMessage(member.client, 'goodbye', member);
    } catch (error) {
      console.error('[goodbye]', error);
    }
  },
};
