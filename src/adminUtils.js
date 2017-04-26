"use strict";
const config = require('../config');
const configEdit = require('../configEdit');
let utils = require('./utils');
let qutils = require('./queueUtils');
let tutils = require('./trelloUtils');

let adminUtils = {
  queueOverride: function(bot, channelID, userTag, userID, command, msg, trello, db, key, ADcontent) {
    db.serialize(function() {
      db.get("SELECT canRepro, cantRepro, reportMsgID, reportStatus, header, userID, reportString FROM reports WHERE id = ? ", [key], function(error, reportData) {
        if(!reportData && reportData.reportStatus === "queue") {
          utils.botReply(bot, userID, channelID, "psst, are you sure you put in the correct key & the report is still open?", command, msg.id, false);
        }

        //split into dapprove/ddeny
        if(command.toLowerCase() === "!dapprove") {
          let canRepro = reportData.canRepro + 1;
          db.run("UPDATE reports SET reportStatus = 'trello', canRepro = ? WHERE id = ?", [canRepro, key]);
          db.run("INSERT INTO reportQueueInfo (id, userID, userTag, info, stance) VALUES (?, ?, ?, ?, ?)", [key, userID, userTag, ADcontent, 'approve']);
          utils.botReply(bot, userID, channelID, "you've successfully overlord-approved the report!", command, msg.id, false);
          bot.createMessage(config.channels.modLogChannel, "👍 **" + userTag + "** approves: **#" + key + "** `" + reportData.header + "` | `" + ADcontent + "`"); //log to bot-log
          tutils.addReportTrello(bot, key, db, trello);
        } else if(command.toLowerCase() === "!ddeny") {
          let cantRepro = reportData.cantRepro + 1;
          db.run("UPDATE reports SET reportStatus = 'closed', cantRepro = ? WHERE id = ?", [cantRepro, key]);
          db.run("INSERT INTO reportQueueInfo (id, userID, userTag, info, stance) VALUES (?, ?, ?, ?, ?)", [key, userID, userTag, ADcontent, 'deny']);
          utils.botReply(bot, userID, channelID, "you've successfully overlord-denied the report!", command, msg.id, false);
  	      qutils.deniedReport(bot, msg, db, key, reportData);
          bot.createMessage(config.channels.modLogChannel, "👍 **" + userTag + "** denied: **#" + key + "** `" + reportData.header + "` | `" + ADcontent + "`"); //log to bot-log
        }
      });
    });
  }
}

module.exports = adminUtils;
