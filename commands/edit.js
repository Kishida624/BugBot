"use strict";
const config = require('../config');
let trelloUtils = require('../src/trelloUtils');
let utils = require('../src/utils');
let qUtils = require('../src/queueUtils');
//Always check for report key in Trello msg
//Log every edit to modLogChannel

let edit = {
  pattern: /!edit/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let splitters = msg.content.match(/\|/g);
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let joinedMessage = messageSplit.join(' ');

    let matchString = joinedMessage.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?\s*\|\s*([\s\S]*)\s\|\s*([\s\S]*)/i);
    if(!matchString) {
      utils.botReply(bot, userID, channelID, "please provide a URL, section you want to edit and your new content", command, msg.id);
      return;
    }
    let key = matchString[1];
    let editSection = matchString[2];
    let newContent = matchString[3];
    var matchFormat = editSection.match(/\b(header|steps to reproduce|expected result|actual result|client settings|system settings)(s)?(:)?/i);
    if(!splitters || splitters.length !== 2){
      utils.botReply(bot, userID, channelID, "please include two splitters, like this: `!edit <key/url> | <what part you want to change> | <the new content>`", command, msg.id, false);
      return;
    }
    if(!matchFormat){
      utils.botReply(bot, userID, channelID, "please include what you want to change. `Header`, `Steps to reproduce`, `Expected result`, `Actual result`, `Client settings` or `System settings`", command, msg.id);
      return;
    }

    if(matchFormat === "steps to reproduce") {
      newContent = newContent.replace(/(-)\s/i, '\n$&');
    }

    db.get("SELECT reportString, reportMsgID, reportStatus, cardID FROM reports WHERE trelloURL = '" + key + "' OR id = " + key, function(error, report) {
      trello.get("/1/cards/" + key, {}, function(errorTrello, urlData) {
        if(!report && !urlData && !!urlData.id) { //Check if the key is correct

          utils.botReply(bot, userID, channelID, "I can't seem to find the report on Trello or in the Queue, you should double check your key.", command, msg.id, false);
          return;
        } else if(!!urlData && urlData.closed === true) { // check if in trello, but closed

          utils.botReply(bot, userID, channelID, "this report has already been closed.", command, msg.id, false);
          return;
        } else if(!!urlData && !!urlData.id) { //in Trello
          if(!!report) { //in DB
            //edit database & trello
            qUtils.editQueueReport(bot, trello, userTag, userID, key, editSection, newContent, msg, channelID, report.reportString);
            trelloUtils.editTrelloReport(bot, trello, db, userTag, userID, key, editSection, newContent, msg, channelID, urlData, report.cardID, msg.id, command);

            bot.getMessage(channelID, report.reportMsgID).then((oldReport) => {
              if(!!oldReport){
                let regex = "(" + editSection + ")s?:\s*(?:\*)*\s*(.*?)(?=(?:\s*\n)?\*\*|\\n\\n)";
                let newRegex = new RegExp(regex, "i");

                let editReport = oldReport.content.replace(newRegex, utils.toTitleCase(editSection) + ":** " + newContent);
                bot.editMessage(channelID, report.reportMsgID, editReport).then(() => {
                  utils.botReply(bot, userID, channelID, ", `" + utils.toTitleCase(editSection) + "` has been updated to `" + newContent + "`", command, msg.id, false);
                  bot.createMessage(config.channels.modLogChannel, "✏ **" + userTag + "** edited`" + utils.toTitleCase(editSection) + "` to `" + newContent + "` <" + urlData.shortUrl + "> **#" + key + "**");
                }).catch((error) => {
                  console.log("Edit | Trello & DB & Msg\n" + error);
                });
              }
            });
          } else { //legacy report
            //edit trello
            //look for msg in chat

            bot.getMessages(channelID).then((data) => {
              var dataFinder = data.find(function(foundObj) {
                return foundObj.author.id === config.botID && foundObj.content.indexOf('https://trello.com/c/' + trelloURL) > -1 && foundObj.content.indexOf('Reproducibility:') > -1;
              });
              if(!!dataFinder) {
                let regex = "(" + editSection + ")s?:\s*(?:\*)*\s*(.*?)(?=(?:\s*\n)?\*\*|\\n\\n)";
                let newRegex = new RegExp(regex, "i");

                let editReport = oldReport.content.replace(newRegex, utils.toTitleCase(editSection) + ":** " + newContent);
                bot.editMessage(channelID, dataFinder.id, editReport).then(() => {
                  utils.botReply(bot, userID, channelID, ", `" + utils.toTitleCase(editSection) + "` has been updated to `" + newContent + "`", command, msg.id, false);
                  bot.createMessage(config.channels.modLogChannel, "✏ **" + userTag + "** edited`" + utils.toTitleCase(editSection) + "` to `" + newContent + "` <" + urlData.shortUrl + "> **#" + key + "**");
                }).catch((error) => {
                  console.log("Edit | Trello & DB & Msg\n" + error);
                });
              }
            });
            trelloUtils.editTrelloReport(bot, trello, db, userTag, userID, key, editSection, newContent, msg, channelID, urlData, cardID, msg.id, command);
          }
        } else if(!!report) { //in DB
          if(report.reportStatus === "queue") {
            //edit queue (chat) msg and database
            bot.getMessage(config.channels.queueChannel, report.reportMsgID).then((oldReport) => {
              if(!!oldReport) {
                if(editSection === "header") {
                  editSection = "short description";
                }
                let regex = "(" + editSection + ")s?:\\s*(?:\\*)*\\s*(.*?)(?=(?:\\s*\\n)?\\*\\*|\\n\\n)";
                let newRegex = new RegExp(regex, "i");

                let editReport = oldReport.content.replace(newRegex, utils.toTitleCase(editSection) + ":** " + newContent);
                bot.editMessage(config.channels.queueChannel, report.reportMsgID, editReport).then(() => {
                  utils.botReply(bot, userID, channelID, ", `" + utils.toTitleCase(editSection) + "` has been updated to `" + newContent + "`", command, msg.id, false);
                  bot.createMessage(config.channels.modLogChannel, "✏ **" + userTag + "** edited`" + utils.toTitleCase(editSection) + "` to `" + newContent + "` ID: **#" + key + "**");
                }).catch((error) => {
                  console.log("Edit | msgQueue\n" + error);
                });
              }
            });
            qUtils.editQueueReport(bot, trello, db, userTag, userID, key, editSection, newContent, msg, channelID, report.reportString);
          } else {
            utils.botReply(bot, userID, channelID, "this report has already been closed.", command, msg.id, false);
            return;
          }
        }
      });
    });

    //check if report is in db
    //if not in database check if it's in trello
      //if it's in trello, edit trello and check for chat msg
      //if chat msg, edit that too
    //if in database check if it's in queue or trello
      //if in queue, edit queue msg and Database
      //if in trello, edit chat msg, database and trello
  },
  roles: [
    config.roles.everybodyRole
    ],
  channels: [
    config.channels.iosChannel,
    config.channels.canaryChannel,
    config.channels.androidChannel,
    config.channels.linuxChannel,
    config.channels.queueChannel
  ]
}
module.exports = edit;
