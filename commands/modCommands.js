"use strict";
const config = require("../config");
const utils = require("../src/utils");
const getBug = require('../src/getBug');

let modCommands = {
  pattern: /!ping|!bug|!restart/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let recievedMessage = messageSplit.join(' ');
    let contentMessage = recievedMessage.match(/(\d*)\s*\|\s*([\s\S]*)/i);
      switch (command.toLowerCase()) {
        case "!ping":
          utils.botReply(bot, userID, channelID, "Pong! <:greenTick:" + config.emotes.greenTick + ">", command, msg.id, false);
        break;
        case "!bug":
          getBug(bot, channelID, userTag, userID, command, msg, trello, db);
          //DM person everything about a report
          break;
        case "!restart":
          bot.deleteMessage(channelID, msg.id).then(() => {
            process.exit();
            //restart the bot
          });
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
