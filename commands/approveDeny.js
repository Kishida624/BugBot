"use strict";
const config = require("../config");
const customConfig = require('../configEdit');
let utils = require("../src/utils");
let qutils = require('../src/queueUtils');

function addApproval (bot, channelID, userTag, userID, command, msg, db, key, ADcontent, reportInfo, trello) {
  db.all("SELECT stance FROM reportQueueInfo WHERE id = ? AND userID = ? AND (stance = 'approve' OR stance = 'deny')", [key, userID] , function(error, checkQueueReport) {
    bot.getMessage(config.channels.queueChannel, reportInfo.reportMsgID).then((msgContent) => {

      if(!!msgContent && !!checkQueueReport) {
        qutils.addAD(bot, channelID, userTag, userID, command, msg, db, key, ADcontent, checkQueueReport[0], reportInfo, msgContent, trello);
      } else if(!!msgContent && !checkQueueReport) {
        qutils.addAD(bot, channelID, userTag, userID, command, msg, db, key, ADcontent, null, reportInfo, msgContent, trello);
      } else if(!msgContent && !!checkQueueReport) {
        qutils.addAD(bot, channelID, userTag, userID, command, msg, db, key, ADcontent, checkQueueReport[0], reportInfo, null, trello);
      } else {
        qutils.addAD(bot, channelID, userTag, userID, command, msg, db, key, ADcontent, null, reportInfo, null, trello);
      }

    }).catch((error) => {console.log("L14 appDeny\n" + error)});
  });
}

let approveDeny = {
  pattern: /!approve|!deny/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let recievedMessage = messageSplit.join(' ');
    let contentMessage = recievedMessage.match(/(\d*)\s*\|\s*([\s\S]*)/i);
    if(!contentMessage) {
      utils.botReply(bot, userID, channelID, "please format your input correctly. `" + command + " | system info`. See <#240548137633185792> for full syntax", command, msg.id, false);
      return;
    }
    let key = contentMessage[1];
    db.get("SELECT header, reportStatus, canRepro, cantRepro, reportMsgID, header, reportString, userID FROM reports WHERE id = ?", [key], function(error, reportInfo) {
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
      contentMessage[2] = contentMessage[2].replace(/(\*|`|\~|\_)/gi, "\\$&");
      let whichClient = contentMessage[2].match(/(-l|-m|-w|-a|-i)/i);
      let ADcontent;
      //Check if ADcontent exists or not, reply "missing reason/user settings" if it's missing
      if(!contentMessage[2]) {
        utils.botReply(bot, userID, channelID, "you're missing a reason or system settings. Refer to #Bot-Help for more info", command, msg.id, false);
        return;
      } else if(!!whichClient) {
        let system;
        if(whichClient[1] === "-w") {
          system = "windows";
        } else if(whichClient[1] === "-i") {
          system = "ios";
        } else if(whichClient[1] === "-l") {
          system = "linux";
        } else if(whichClient[1] === "-m") {
          system = "macOS";
        } else if(whichClient[1] === "-a") {
          system = "android";
        }
        db.get("SELECT " + system + " FROM users WHERE userid = ?", [userID], function(error, usrSys) {
          if(!!usrSys){
            //ADcontent = whichClient.replace(/(-l|-m|-w|-a|-i)/i, usrSys[system]);
            let info = contentMessage[2];
            ADcontent = info.replace(/(-l|-m|-w|-a|-i)/i, usrSys[system]);
            addApproval (bot, channelID, userTag, userID, command, msg, db, key, ADcontent, reportInfo, trello);
          } else {
            utils.botReply(bot, userID, channelID, "doesn't seem like you have that client in our database. You can add it with `!addsys " + whichClient[1] + " | system info`", command, msg.id, false);
            return;
          }
        });
      } else {
        ADcontent = contentMessage[2];
        addApproval (bot, channelID, userTag, userID, command, msg, db, key, ADcontent, reportInfo, trello);
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
    config.channels.queueChannel
  ]
}
module.exports = approveDeny;
