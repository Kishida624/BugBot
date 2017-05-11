"use strict";
const config = require("../config");
const trelloUtils = require("../src/trelloUtils");
const utils = require("../src/utils");
const customConfig = require('../configEdit');
const attachUtils = require('../src/attachUtils');

let attach = {
  pattern: /!attach/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let msgSplit = msg.content.split(' ');
    msgSplit.shift();
    let joinedMsg = msgSplit.join(' ');

    let regexMsg = joinedMsg.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?\s*\|?\s*([\s\S]*)/i);
    if(!regexMsg || !regexMsg[1]) {
      utils.botReply(bot, userID, channelID, "please include a report key or trello url, and a image", command, msg.id, false);
      return;
    }

    let key = regexMsg[1];
    let attachment;
    let removeMsg = false;

    if(!!regexMsg[2]) {
      attachment = regexMsg[2];
      let checkLink = attachment.match(/\bhttps?:\/\/\S+(?:png|jpg|jpeg|gif)\b/i);
      if(!checkLink) {
        utils.botReply(bot, userID, channelID, "please include a valid image", command, msg.id, false);
        return;
      }
      removeMsg = true;
    } else if (!!msg.attachments[0]) {
      attachment = msg.attachments[0].url;
      removeMsg = false;
    } else {
      utils.botReply(bot, userID, channelID, "please include a image", command, msg.id, false);
      return;
    }

    trello.get("/1/cards/" + key, {}, function(errorURL, urlData) {
      if(!!urlData && !!urlData.id) {
        attachUtils(bot, channelID, userTag, userID, command, msg, trello, key, attachment, removeMsg, urlData.name);
        utils.botReply(bot, userID, channelID, "your attachment has been added.", command, msg.id, true);
      } else {
        db.get("SELECT trelloURL, reportStatus, reportMsgID, header FROM reports WHERE id = ?", [key], function(error, report) {
          if(!report){
            utils.botReply(bot, userID, channelID, "please include a report key or trello url", command, msg.id, false);
            return;
          }

          if(report.reportStatus === "closed") {
            utils.botReply(bot, userID, channelID, "this report has already been denied.", command, msg.id, false);
            return;
          } else if(report.reportStatus === "trello") {
            attachUtils(bot, channelID, userTag, userID, command, msg, trello, report.trelloURL, attachment, removeMsg, report.header);
            utils.botReply(bot, userID, channelID, "your attachment has been added.", command, msg.id, true);
          } else {
            bot.getMessage(config.channels.queueChannel, report.reportMsgID).then((msgContent) => {
              let newMsg = msgContent.content + "\n:paperclip: **" + userTag + "**: " + attachment;
              db.run("INSERT INTO reportAttachments (id, userID, userTag, attachment) VALUES (?, ?, ?, ?)", [key, userID, userTag, attachment], function() {
                bot.editMessage(config.channels.queueChannel, report.reportMsgID, newMsg);
                utils.botReply(bot, userID, channelID, "your attachment has been added.", command, msg.id, true);
                bot.createMessage(config.channels.modLogChannel, ":paperclip: **" + userTag + "**: `" + report.header + "` **#" + key + "**");
              });
            }).catch(error => {console.log("Attach DB GetMSG\n" + error);});
          }
        });
      }

      if(removeMsg === true) {
        setTimeout(function() {
          bot.deleteMessage(channelID, msg.id);
        }, customConfig.delayInS * 1000);
      }
    });
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
