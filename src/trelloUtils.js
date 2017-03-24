"use strict";
const config = require("../config");
const customConfig = require('../configEdit');
let utils = require("./utils");
let sections = require('./getSections');
//edit command
//attach command

function addReportTrello(bot, key, db, trello) { // add report to trello
  db.get('SELECT header, reportString, userID, userTag, cardID FROM id = ' + key, function(error, report) {

    let allSections = sections.getSections(report.reportString);

    let stepsToRepro = allSections["steps to reproduce"];
    stepsToRepro = stepsToRepro.replace(/(-)\s/i, '\n$&');
    let expectedResult = allSections["expected result"];
    let actualResult = allSections["actual result"];
    let clientSetting = allSections["client setting"];
    let sysSettings = allSections["system setting"];

    const reportString = '\n\n####Steps to reproduce:' + stepsToRepro + '\n\n####Expected result:\n' + expectedResult + '\n####Actual result:\n' + actualResult + '\n####Client settings:\n' + clientSetting + '\n####System settings:\n' + sysSettings;
    const reportChatString = "\n**Short description:** " + report.header + "\n**Steps to reproduce:** " + stepsToRepro + "\n**Expected result:** " + expectedResult + "\n**Actual result:** " + actualResult + "\n**Client settings:** " + clientSetting + "\n**System settings:** " + sysSettings;

    let success = function(successError, data) {
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
      bot.createMessage(postChannelID, "───────────────────────\nReported By **" + report.userTag + "**" + reportChatString + "\n<" + data.shortUrl + ">\n\n**Reproducibility:**\n").then((msgInfo) => {
        // change reportStatus, trelloURL & queueMsgID
        // attach all attachments to the trello post
        let trelloURL = data.shortUrl.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?/i);
        db.run('UPDATE ' + key + ' (reportStatus, trelloURL, queueMsgID) SET VALUES (\'trello\', \'' + trelloURL + '\', ' + msgInfo.id + ')');
        bot.createMessage(config.channels.modLogChannel, "📨 <#" + postChannelID + "> **" + report.userTag + "** - `" + header + "` <" + data.shortUrl + ">\n" + key); //log to bot-log

        db.all('SELECT userID, userTag, attachment FROM reportAttachments WHERE id =' + key, function(error, attachmentData) {
          if(attachmentData.length !== 0){
            queueAttachment(bot, key, db, trello, attachmentData, trelloURL);
          }
        });

        setTimeout(function() {
          getUserInfo(report.userID, report.userTag, postChannelID, data.shortUrl, key);
        }, 2000);
      });

      //add approvals as repro
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
function getUserInfo(userID, userTag, postChannelID, shortUrl, key) {
  let guild = bot.guilds.find(guild => guild.id === config.DTserverID);
  let userInfo = guild.members.get(userID);
  if(!!guild) {
    if(!!userInfo) {
      return;
    }
    if(userInfo.roles.indexOf(config.roles.hunterRole) === -1){
      //bot.createMessage(config.modLogChannel, "<@110813477156720640> " + userTag + " needs a rank");  // Ping dabbit for rank
    }

    bot.getDMChannel(userID).then(DMInfo => {
      bot.createMessage(DMInfo.id, "The bug you reported has been approved! Thanks for your report! You can find your bug in <#" + postChannelID + "> <" + shortUrl + ">").catch(() => {
        bot.createMessage(config.channels.modLogChannel, "⚠ Can not DM **" + userTag + "**. Report **#" + key + "** approved. <" + shortUrl + ">");
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
    bot.createMessage(config.channels.modLogChannel, "<@84815422746005504> Couldn't fetch user info on " + userTag + ", user might need a new role!");
    loopGetUserInfo = 0;
  }
}

function queueAttachment() {

}

function userRepro(bot, userID, userTag, db, trello, reportKey, channelID, reproduction, emoji, reproCnt, editMsg, msgID, editMsgID) {

  var sentRepro = function(error, info) {
    if(!!error) {
      utils.botReply(bot, userID, channelID, "something went wrong, please try again.", command, msgID, false);
    }else{
      if(!!userID){ //userID = null when repro comes from Queue report
        utils.botReply(bot, userID, channelID, "your note has been added to the ticket.", command, msgID, false);

        if(!!editMsgID && !!editMsg) { //check that message exists before modifying it
          bot.editMessage(channelID, editMsgID, editMsg);
        }
        bot.createMessage(config.modLogChannel, emoji + " **" + userTag + "**: " + reproduction + " `" + info.data.card.name + "` <http://trello.com/c/" + info.data.card.shortLink + ">");
      }else{ // add repro from queue report
        bot.editMessage(channelID, editMsgID, editMsg);
      }
    }
  }

  var reproInfo = {
    text: reproduction + "\n" + reproCnt + "\n\n"+ userTag
  }
  t.post("/1/cards/" + trelloURL + "/actions/comments", reproInfo, sentRepro);
}

function editTrelloReport(bot, trello, userTag, userID, key, editSection, newContent, msg, channelID, urlData) {
  let checkArray = ["header", "short description"];
  if(checkArray.indexOf(editSection.toLowerCase()) > 1) {
    //edit card title (name)

    var cardUpdated = function(error, data){
      utils.botReply(bot, userID, channelID, ", `" + utils.toTitleCase(editSection) + "` has been updated to `" + newContent + "`", command, msgID, false);
      bot.createMessage(config.modLogChannel, "✏ **" + userTag + "** edited`" + utils.toTitleCase(editSection) + "` to `" + newContent + "` <" + data.shortUrl + ">");
    }
    var updateCard = {
      value: newContent
    }
    t.put('/1/cards/' + key + '/name', updateCard, cardUpdated);

  } else {
    //edit desc
    let regex = "(" + editSection + ")s?:\s*(?:\\n)*\s*(.*?)(?=(?:\s*\\n)?#)";
    let newRegex = new RegExp(regex, "i");

    let editTrelloString = urlData.desc.replace(newRegex, utils.toTitleCase(editSection) + ":\n " + newContent);

    var cardUpdated = function(error, data){
      utils.botReply(bot, userID, channelID, ", `" + utils.toTitleCase(editSection) + "` has been updated to `" + newContent + "`", command, msgID, false);
      bot.createMessage(config.modLogChannel, "✏ **" + userTag + "** edited`" + utils.toTitleCase(editSection) + "` to `" + newContent + "` <" + data.shortUrl + ">");
    }

    var updateCard = {
      value: editTrelloString
    }

    t.put('/1/cards/' + key + '/desc', updateCard, cardUpdated);
  }
}

module.exports = {
  addReportTrello: addReportTrello,
  userRepro: userRepro,
  editTrelloReport: editTrelloReport
}
