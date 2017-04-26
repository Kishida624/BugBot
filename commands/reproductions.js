"use strict";
const config = require("../config");
const reproUtils = require("../src/reproUtils");
const utils = require("../src/utils");

let reproduction = {
  pattern: /!canrepro|!cantrepro|!cannotrepro|!cnr|!cntr/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    var msgSplit = msg.content.split(" ");
    var joinedMsg = msgSplit.join(" ");
    var msgContent = joinedMsg.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?\s*\|\s*([\s\S]*)/i);
    switch (command.toLowerCase()) {
      case "!canrepro":
      case "!cnr":
        var reproduction = "Can reproduce.";
        var emoji = "\n<:greenTick:" + config.emotes.greenTick + "> ";

        if(!msgContent || !msgContent[1] || !msgContent[2]){
          utils.botReply(bot, userID, channelID, "please provide a valid URL, a client version, and make sure the issue is not closed.", command, msg.id);
          return;
        }

        reproUtils.preCheckReproSetup(bot, msgContent[1], msgContent[2], reproduction, userTag, channelID, msg.id, userID, emoji, trello, db, command);
        break;
      case "!cantrepro":
      case "!cannotrepro":
      case "!cntr":
        var reproduction = "Can't reproduce.";
        var emoji = "\n<:redTick:" + config.emotes.redTick + "> ";

        if(!msgContent || !msgContent[1] || !msgContent[2]){
          utils.botReply(bot, userID, channelID, "please provide a valid URL, a client version, and make sure the issue is not closed.", command, msg.id);
          return;
        }

        reproUtils.preCheckReproSetup(bot, msgContent[1], msgContent[2], reproduction, userTag, channelID, msg.id, userID, emoji, trello, db, command);
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
