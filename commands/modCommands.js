"use strict";
const config = require("../config");
let utils = require("../src/utils");

let modCommands = {
  pattern: /!ping|!bug|!stats|!restart/i,
  execute: function(bot, channelID, userTag, userID, command, msg) {
      switch (command.toLowerCase()) {
        case "!ping":
          utils.botReply(bot, userID, channelID, "Pong!", command, msg.id, true);
        break;
        case "!bug":

          //DM person everything about a report
          break;
        case "!stats":
          //analytics command
          break;
        case "!restart":
          bot.deleteMessage(channelID, msgID);
          process.exit();
          //restart the bot
          break;
      }
  },
  roles: [
    config.roles.adminRole,
    config.roles.devRole,
    config.roles.trelloModRole
    ],
  channels: [
    config.channels.allChannels
  ]
}
module.exports = modCommands;
