"use strict";
const config = require("../config");
const utils = require("../src/utils");
const getBug = require('../src/getBug');

let modCommands = {
  pattern: /!ping|!bug|!stats|!restart|!getuser|!getrepro|!getnumber/i,
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
        case "!stats":
          //analytics command
          break;
        case "!restart":
          bot.deleteMessage(channelID, msg.id).then(() => {
            process.exit();
            //restart the bot
          });
          break;
        case "!getuser":
          db.all("SELECT * FROM users WHERE userid = ?", [recievedMessage], function(error, data) {
            //bot.getDMChannel(userID).then((dmChannel) => {
            //  bot.createMessage(dmChannel.id, data);
            //}).catch((error) => {console.log(error);})
            console.log(data);
          });
          break;
        case "!getrepro":
          db.all("SELECT * FROM reportQueueInfo WHERE id = ?", [recievedMessage], function(error, data) {
            console.log(data);
          });
          break;
        case "!getnumber":
          db.get("SELECT cantRepro, canRepro, id FROM reports WHERE id = ?", [recievedMessage], function(error, data) {
            console.log(data);
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
