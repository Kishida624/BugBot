"use strict";
const config = require("../config");
const customConfig = require('../configEdit');
let utils = require("../src/utils");

let approveDeny = {
  pattern: /!approve|!deny/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let recievedMessage = messageSplit.join(' ');
    let contentMessage = recievedMessage.match(/(\d*)\s*\|\s*([\s\S]*)/i);
    if(!contentMessage) {
      utils.botReply(bot, userID, channelID, "please format your input correctly. `" + command + " | system info`. See <#240548137633185792> for full syntax")
    }
    let key = contentMessage[1];
    db.get("SELECT header, reportStatus, canRepro, cantRepro, queueMsgID, header, reportString, userID FROM reports WHERE id = " + key, function(error, reportInfo) {

      if(!reportInfo) { // check if report exists
        utils.botReply(bot, userID, channelID, "I can't find that report ID. Make sure you use a valid report ID.", command, msg.id, false);
        return;
      }
      if(command.toLowerCase() === "!approve" && reportInfo.userID === userID) { // check if user is trying to approve their own report
        utils.botReply(bot, userID, channelID, "You can't approve your own report.", command, msg.id, false);
        return;
      }
      if(reportInfo.reportStatus !== "queue") { // check if the report is in the queue, closed or sent to trello
        utils.botReply(bot, userID, channelID, "this report has already been moved", command, msg.id, false);
        return;
      }
      let whichClient = contentMessage[2].match(/(-l|-m|-w|-a|-i)/i);

      if(whichClient[1] === "-c") {
        whichClient = "canary";
      } else if(whichClient[1] === "-i") {
        whichClient = "iOS";
      } else if(whichClient[1] === "-l") {
        whichClient = "linux";
      } else if(whichClient[1] === "-m") {
        whichClient = "macOS";
      } else if(whichClient[1] === "-a") {
        whichClient = "android";
      }

      let ADcontent;
      //Check if ADcontent exists or not, reply "missing reason/user settings" if it's missing
      if(!!contentMessage[2]) {
        utils.reply(bot, userID, channelID, "you're missing a reason or system settings. Refer to #Bot-Help for more info", command, msg.id, false);
        return;
      } else if(!!content) {
        db.get("SELECT " + whichClient[1] + " FROM users WHERE id = " + userID, function(error, usrSys) {
          if(!!usrSys){
            ADcontent = content.replace(/(-l|-m|-w|-a|-i)$/i, usrSys.content[1]);
          } else {
            utils.botReply(bot, userID, channelID, "doesn't seem like you have that client in our system. You can add it with `!addsys " + whichClient[1] + " new System`", command, msg.id, false);
            return;
          }
        });
      } else {
        ADcontent = content.join(' ');
      }

      db.get("SELECT userID, FROM reportQueueInfo WHERE id = " + key, function(error, checkQueueReport) {
        bot.getMessage(config.queueChannel, reportInfo.queueMsgID).then((msgContent) => {
          if(!!msgContent) {
            qutils.addAD(bot, channelID, userTag, userID, command, msg, db, key, ADcontent, checkQueueReport, reportInfo, msgContent, trello);
          } else {
            qutils.addAD(bot, channelID, userTag, userID, command, msg, db, key, ADcontent, checkQueueReport, reportInfo, null, trello);
          }
        });
      });
    });
  },
  roles: [
    config.roles.adminRole,
    config.roles.trelloModRole,
    config.roles.devRole,
    config.roles.hunterRole
    ],
  channels: [
    config.channels.queueChannel
  ]
}
module.exports = approveDeny;
