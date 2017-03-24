"use strict";
const config = require("../config");
let utils = require("../src/utils");

let storeSysInfo = {
  pattern: /!systeminfo|!sysinfo|!addsys/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let joinedMessage = messageSplit.join(' ');

    let contentInfo = joinedMessage.match(/(-l|-m|-w|-a|-i)\s*\|\s*([\s\S]*)/i);
    if(!contentInfo) {
      utils.botReply(bot, userID, channelID, "please include which client and your specs. Like so: `" + command + " -i | 10.0.1`. Check #bot-log for full list", command, msg.id);
      return;
    }
    if(!!contentInfo && !contentInfo[1] && !contentInfo[2]) {
      utils.botReply(bot, userID, channelID, "please include which client and your specs. Like so: `" + command + " -i | 10.0.1`. Check #bot-log for full list", command, msg.id);
      return;
    }
    let whichOS;
    let systemInfo = contentInfo[2];

    if(contentInfo[1] === "-w") {
      whichOS = "windows";
    } else if(contentInfo[1] === "-i") {
      whichOS = "iOS";
    } else if(contentInfo[1] === "-l") {
      whichOS = "linux";
    } else if(contentInfo[1] === "-m") {
      whichOS = "macOS";
    } else if(contentInfo[1] === "-a") {
      whichOS = "android";
    } else {
      utils.botReply(bot, userID, channelID, "please include which client and your specs. Like so: `" + command + " -i | 10.0.1`. Check #bot-log for full list", command, msg.id);
      return;
    }

    db.get("SELECT " + whichOS + " FROM users WHERE userid = " + userID, function(error, dbRowReply){
      if(!!error){
        console.log(error);
        //bot.createMessage(); //Log to error log channel (bot-log? Include pastebin?)
      }
      if(!!dbRowReply){
        console.log(dbRowReply);
        //Edit existing database entry
        db.run("UPDATE users SET " + whichOS + " = '" + systemInfo + "' WHERE userid = " + userID);
        utils.botReply(bot, userID, channelID, "your new " + whichOS + " settings have been saved", command, msg.id);
        //bot.createMessage(config.channel.modLogChannel, ""); //user changed their --- info
      }else if(!dbRowReply){
        console.log(dbRowReply);
        //Create new database entry
        db.run("INSERT INTO users (userid, " + whichOS + ") VALUES(" + userID + ", '" + systemInfo + "')");
        utils.botReply(bot, userID, channelID, "your new " + whichOS + " settings have been saved", command, msg.id);
        //bot.createMessage(config.channel.modLogChannel, ""); //user added their --- info
      }
    });
  },
  roles: [
    config.roles.everybodyRole
    ],
  channels: [
    config.channels.allChannels
  ]
}
module.exports = storeSysInfo;
