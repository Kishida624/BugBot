"use strict";
const config = require("../config");
const utils = require("./utils");
const sections = require('./getSections');
const reproUtils = require('./reproUtils');
const attachUtils = require('./attachUtils');

function addReportTrello(bot, key, db, trello) { // add report to trello
  db.get('SELECT header, reportString, userID, userTag, cardID, reportMsgID FROM reports WHERE id = ?', [key], function(error, report) {

    let allSections = sections(report.reportString);

    let stepsToRepro = allSections["steps to reproduce"];
    stepsToRepro = stepsToRepro.replace(/(-)\s/gi, '\n$&');
    let expectedResult = allSections["expected result"];
    let actualResult = allSections["actual result"];
    let clientSetting = allSections["client setting"];
    let sysSettings = allSections["system setting"];

    const reportString = '\n\n####Steps to reproduce:' + stepsToRepro + '\n\n####Expected result:\n' + expectedResult + '\n####Actual result:\n' + actualResult + '\n####Client settings:\n' + clientSetting + '\n####System settings:\n' + sysSettings;
    const reportChatString = "\n**Short description:** " + report.header + "\n**Steps to reproduce:** " + stepsToRepro + "\n**Expected result:** " + expectedResult + "\n**Actual result:** " + actualResult + "\n**Client settings:** " + clientSetting + "\n**System settings:** " + sysSettings;

    let success = function(successError, data) {
      bot.deleteMessage(config.channels.queueChannel, report.reportMsgID).catch(() => {});
      let postChannelID;
      switch (report.cardID) {
        case config.cards.iosCard:
          postChannelID = config.channels.iosChannel;
          break;
        case config.cards.androidCard:
          postChannelID = config.channels.androidChannel;
          break;
        case config.cards.canaryCard:
          postChannelID = config.channels.canaryChannel;
          break;
        case config.cards.linuxCard:
          postChannelID = config.channels.linuxChannel;
          break;
      }
      bot.createMessage(postChannelID, "───────────────────────\nReported By **" + report.userTag + "**" + reportChatString + "\n<" + data.shortUrl + "> - **#" + key + "**\n\n**Reproducibility:**\n").then((msgInfo) => {
        // change reportStatus, trelloURL & queueMsgID
        // attach all attachments to the trello post
        let trelloURL = data.shortUrl.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?/i);
        let trelloUrlSuffix = trelloURL[1];
        db.run("UPDATE reports SET reportStatus = 'trello', trelloURL = ?, reportMsgID = ? WHERE id = ?", [trelloUrlSuffix, msgInfo.id, key]);
        bot.createMessage(config.channels.modLogChannel, ":incoming_envelope: <#" + postChannelID + "> **" + report.userTag + "** - `" + report.header + "` <" + data.shortUrl + ">\n" + key); //log to bot-log

        setTimeout(function() {
          db.each('SELECT userID, userTag, attachment FROM reportAttachments WHERE id = ?', [key], function(error, attachmentData) {
            if(!!attachmentData && attachmentData.length !== 0){
              attachUtils(bot, null, attachmentData.userTag, attachmentData.userID, "!attach", null, trello, trelloURL[1], attachmentData.attachment, false, report.header);
            }
          });
          getUserInfo(report.userID, report.userTag, postChannelID, data.shortUrl, key, bot);
          reproUtils.queueRepro(bot, trello, db, postChannelID, trelloURL[1], key);
        }, 2000);
      }).catch(err => {console.log(err);});
    }

    let newReport = {
      name: report.header,
      desc: "Reported by " + report.userTag + reportString + "\n\n" + key,
      idList: report.cardID,
      pos: 'top'
    }
    trello.post('/1/cards/', newReport, success);
  });
}

let loopGetUserInfo = 0;
function getUserInfo(userID, userTag, postChannelID, shortUrl, key, bot) {
  let guild = bot.guilds.get(config.DTserverID);
  let userInfo = guild.members.get(userID);
  if(!!guild) {
    if(!userInfo) {
      return;
    }
    if(userInfo.roles.indexOf(config.roles.hunterRole) === -1){
      //bot.createMessage(config.modLogChannel, "<@110813477156720640> " + userTag + " needs a rank");  // Ping dabbit for rank
    }
    bot.getDMChannel(userID).then((DMInfo) => {
      bot.createMessage(DMInfo.id, "The bug you reported has been approved! Thanks for your report! You can find your bug in <#" + postChannelID + "> <" + shortUrl + ">").catch(() => {
        bot.createMessage(config.channels.modLogChannel, ":warning: Can not DM **" + userTag + "**. Report **#" + key + "** approved. <" + shortUrl + ">");
      });
    }).catch((err) => {
      console.log("trelloUtils gerUserInfo DM\n" + err);
    });
    loopGetUserInfo = 0;
  } else if(loopGetUserInfo >= 5) {
    setTimeout(function() {
      loopGetUserInfo++;
      getUserInfo(userID, userTag, postChannelID, shortUrl, key);
    }, 2000);
  } else {
    bot.createMessage(config.channels.modLogChannel, ":warning: Couldn't fetch user info on " + userTag + ", user might need a new role!");
    loopGetUserInfo = 0;
  }
}

function editTrelloReport(bot, trello, userTag, userID, key, editSection, newContent, msg, channelID, urlData, msgID, command) {
  let checkArray = ["header", "short description", "title"];
  if(checkArray.indexOf(editSection.toLowerCase()) > 1) {
    //edit card title (name)

    var cardUpdated = function(error, data){
      utils.botReply(bot, userID, channelID, ", `" + utils.toTitleCase(editSection) + "` has been updated to `" + newContent + "`", command, msgID, false);
      bot.createMessage(config.channels.modLogChannel, "✏ **" + userTag + "** edited `" + utils.toTitleCase(editSection) + "` to `" + newContent + "` <" + data.shortUrl + ">");
    }
    var updateCard = {
      value: newContent
    };
    trello.put('/1/cards/' + key + '/name', updateCard, cardUpdated);

  } else {
    //edit desc
    let regex = "(" + editSection + ")s?:\s*(?:\\n)*\s*(.*?)(?=(?:\s*\\n)?#)";
    let newRegex = new RegExp(regex, "i");
    let trelloDesc = urlData.desc;
    let editTrelloString = trelloDesc.replace(newRegex, utils.toTitleCase(editSection) + ":\n " + newContent);

    var cardUpdated = function(error, data){
      utils.botReply(bot, userID, channelID, " `" + utils.toTitleCase(editSection) + "` has been updated", command, msgID, false);
      bot.createMessage(config.channels.modLogChannel, "✏ **" + userTag + "** edited `" + utils.toTitleCase(editSection) + "` <" + data.shortUrl + ">");
    }

    var updateCard = {
      value: editTrelloString
    };

    trello.put('/1/cards/' + key + '/desc', updateCard, cardUpdated);
  }
}

module.exports = {
  addReportTrello: addReportTrello,
  editTrelloReport: editTrelloReport
};
