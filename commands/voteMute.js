"use strict";
const config = require("../config");
let utils = require("../src/utils");

let voteMute = {
  pattern: /!votemute/i,
  execute: function(bot, channelID, userTag, userID, command, msg) {
    bot.createMessage(channelID, "Command still not added");
  },
  roles: [
    config.roles.adminRole,
    config.roles.devRole,
    config.roles.hunterRole
    ],
  channels: [
    config.channels.allChannels
  ]
}
module.exports = voteMute;
