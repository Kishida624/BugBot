"use strict";
const config = require("../config");
let utils = require("../src/utils");

let adminCommands = {
  pattern: /!dapprove|!ddeny|!severity/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    switch (command.toLowerCase()) {
      case "!dapprove":

        break;
      case "!ddeny":

        break;
      case "!severity":

        break;
    }
  },
  roles: [
    config.roles.adminRole,
    config.roles.devRole
    ],
  channels: [
    config.channels.allChannels
  ]
}
module.exports = adminCommands;
