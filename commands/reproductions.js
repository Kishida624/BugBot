"use strict";
const config = require("../config");
let reproUtils = require("../src/reproUtils");
let utils = require("../src/utils");

let reproduction = {
  pattern: /!canrepro|!cantrepro|!cannotrepro|!cnr|!cntr/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    var msgSplit = msg.content.split(" ");
    var joinedMsg = msgSplit.join(" ");
    var msgContent = joinedMsg.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?\s*\|\s*([\s\S]*)/i)
    switch (command.toLowerCase()) {
      case "!canrepro":
      case "!cnr":
        var reproduction = "Can reproduce.";
        var emoji = "\n✅ ";

        if(!msgContent && !msgContent[1] && !msgContent[2]){
          utils.botReply(bot, userID, channelID, "please provide a valid URL, a client version, and make sure the issue is not closed.", command, msg.id);
          return;
        }

        if(!!msgContent && !msgContent[1] && !msgContent[2]){
          utils.botReply(bot, userID, channelID, "please provide a valid URL, a client version, and make sure the issue is not closed.", command, msg.id);
          return;
        }

        reproUtils.preRepro(bot, msgContent[1], msgContent[2], reproduction, userTag, channelID, msg.id, userID, emoji, trello, db);
        break;
      case "!cantrepro":
      case "!cannotrepro":
      case "cntr":
        var cantReproTries = 0;
        var reproduction = "Can't reproduce.";
        var emoji = "\n❌ ";

        if(!msgContent && !msgContent[1] && !msgContent[2]){
          utils.botReply(bot, userID, channelID, "please provide a valid URL, a client version, and make sure the issue is not closed.", command, msg.id);
          return;
        }

        if(!!msgContent && !msgContent[1] && !msgContent[2]){
          utils.botReply(bot, userID, channelID, "please provide a valid URL, a client version, and make sure the issue is not closed.", command, msg.id);
          return;
        }

        reproUtils.preRepro(bot, trelloURL, clientInfo, reproduction, userTag, channelID, msg.id, userID, emoji, trello, db);
        break;
    }
  },
  roles: [
    config.roles.everybodyRole
    ],
  channels: [
    config.channels.iosChannel,
    config.channels.canaryChannel,
    config.channels.androidChannel,
    config.channels.linuxChannel
  ]
}
module.exports = reproduction;
