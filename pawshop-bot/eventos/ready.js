const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`[bot] online como ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: 'Pawshop · Roblox', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
