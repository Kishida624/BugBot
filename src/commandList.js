"use strict";
const config = require("../config");
let utils = require("./utils");

let unknownCommand = {
  pattern: /!.*/,
  execute: function(bot, channelID, userTag, userID, command, msg) {
    let isRightChannel = channelID === config.channels.queueChannel || channelID === config.channels.iosChannel || channelID === config.channels.linuxChannel || channelID === config.channels.androidChannel || channelID === config.channels.canaryChannel;
    if(isRightChannel) {
      utils.botReply(bot, userID, channelID, "unknown command, please review #bot-help for commands.", command, msg.id, false);
    }
  },
  roles: [
    config.roles.everybodyRole
  ],
  channels: [
    config.channels.allChannels
  ]
}

function CommandList() {
  if(!(this instanceof CommandList)) return new CommandList();
  this._commands = [unknownCommand];
}

CommandList.prototype.add = function(commandName) {
  this._commands.unshift(require("../commands/" + commandName));
}

CommandList.prototype.find = function(commandName) {
  return this._commands.find(com => com.pattern.test(commandName));
}

module.exports = CommandList;
