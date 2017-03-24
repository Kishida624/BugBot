"use strict";
const config = require("../config");
let trelloUtils = require("../src/trelloUtils");
let utils = require("../src/utils");

//Only one image link attachment per command
//Android can embed several images at once
let attach = {
  pattern: /!attach/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello) {
    /*
    let msgSplit = msg.content.split(' ');
    msgSplit.shift();
    let joinedMsg = msgSplit.join(' ');

    var regexMsg = joinedMsg.match(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/i);

    t.get("/1/cards/" + regexMsg[2], {}, function(errorURL, urlData) {
      if(!!urlData && !!urlData.id && urlData.closed === false) {
        if(!!msg.attachments[0]) {

        } else if() {

        } else {
          utils.botReply(bot, userID, channelID, "Please include a valid image", command, msg.id);
        }
      } else if() {

      } else {
        utils.botReply(bot, userID, channelID, "Please include a valid trello link or queue ID", command, msg.id);
        return;
      }
    });*/
  },
  roles: [
    config.roles.adminRole,
    config.roles.trelloModRole,
    config.roles.devRole,
    config.roles.hunterRole
    ],
  channels: [
    config.channels.iosChannel,
    config.channels.canaryChannel,
    config.channels.androidChannel,
    config.channels.linuxChannel,
    config.channels.queueChannel
  ]
}
module.exports = attach;
