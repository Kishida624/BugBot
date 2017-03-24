"use strict";

//QueueRepro & addAD done
// Add mod logs texts

const config = require("../config");
const customConfig = require('../configEdit');
let utils = require("./utils");
let tutils = require("./trelloUtils");

function deniedReport(bot, msg, db, key, reportInfo) {
  db.run("UPDATE reports SET reportStatus = closed WHERE id = " + key);
  db.all("SELECT reason WHERE id = " + key, function(error, DBreasons) {

    let reasonArray = DBreasons.map(function(allReasons){
      return allReasons.reasons;
    });

    bot.deleteMessage(config.channels.queueChannel, reportInfo.reportMsgID).then(() => {
      bot.createMessage(config.channels.queueChannel, "`" + reportInfo.header + "` was denied because:\n- `" + reasonArray.join("`\n- `") + "`").then((dndRsn) => {
        bot.deleteMessage(config.channels.queueChannel, dndRsn.id).catch(() => {});
        let userInfo = msg.member.guild.members.get(info.userID);
        bot.getDMChannel().then((DMInfo) => {
          bot.createMessage(DMInfo.id, "Hi " + DMInfo.recipient.username + ", unfortunately the bug you reported earlier: `" + reportInfo.header + "` was denied because:\n- `" + reasonArray.join('`\n- `') +
          "`\n\nYou should try adding as much information as you can when you resubmit it. Here are some helpful tips:\n- Does your bug only happen on a specific version of the operating system?\n- Does your bug only happen on a specific device?\n- Try to be as specific as possible. Generalities like \"it glitches\" aren't helpful and lead to confusion.\n- Try to keep each repro step to a single action.\n\nThank you though for the report and we look forward to your next one! :thumbsup:\n\nBelow you'll find your original submit message:\n```\n!submit " +
          reportInfo.header + " | " + reportInfo.reportString + "```").catch(() => {
            bot.createMessage(config.channels.modLogChannel, "⚠ Can not DM **" + userTag + "**. Report **#" + key + "** denied.");
          });
        });
      }).catch((error) => {console.log("deniedReport | createMessage denied because:\n" + error)});
    }).catch(() => {});
  });
}

let queueUtils = {
  queueReport: function(bot, userTag, userID, channelID, db, msg, reportCapLinks, queueReportString, header) {
    let reportID;
    db.serialize(function() {
      db.get("SELECT id FROM reports ORDER BY id DESC LIMIT 1", function(err, dbInfo) {
        console.log(dbInfo);
        if(!dbInfo) {
          reportID = 1000;
        } else {
          reportID = dbInfo.id + 1;
        }

        let cardID;
        if(channelID === config.channels.iosChannel) {
          cardID = config.cards.iosCard;
        } else if(channelID === config.channels.androidChannel) {
          cardID = config.cards.androidCard;
        } else if(channelID === config.channels.canaryChannel) {
          cardID = config.cards.canaryCard;
        } else if(channelID === config.channels.linuxChannel) {
          cardID = config.cards.linuxCard;
        }

        bot.createMessage(config.channels.queueChannel, "───────────────────────\n<#" + channelID + "> **" + userTag + "** Reported:\n" + queueReportString + "\n\nThe report above needs to be approved.\nReport ID: **" + reportID + "**\n").then((qMsg) => {
          db.run("INSERT INTO reports(id, header, reportString, userID, userTag, cardID, reportStatus, canRepro, cantRepro, reportMsgID, timestamp) VALUES (" +
          reportID + ", '" +
          header + "', '" +
          reportCapLinks + "', " +
          userID + ", '" +
          userTag + "', '" +
          cardID + "', 'queue', " +
          0 + ", " +
          0 + ", " +
          qMsg.id + ", datetime())");

          utils.botReply(bot, userID, channelID, ", your bug has been added to the approval queue. You will be notified when the status of your report updates.", null, msg.id, false);
          bot.createMessage(config.channels.modLogChannel, "📝 **" + userTag + "** submitted `" + header + "` in <#" + channelID + ">"); //log to bot-log
        });
      });
    });
  },

  addAD: function(bot, channelID, userTag, userID, command, msg, db, key, ADcontent, checkQueueReport, reportInfo, editMsgCont) {
    switch (command.toLowerCase()) {
      case "!approve":
        if(!!checkQueueReport) { //Update reportQueueInfo (User has already given their input and wants to change it)
          let cantRepro = reportInfo.cantRepro--;
          let canRepro = reportInfo.canRepro++;
          db.run("UPDATE reportQueueInfo SET reason = " + ADcontent + " WHERE id = " + key, function() {
            db.run("UPDATE reports SET cantRepro = " + cantRepro + ", canRepro = " + canRepro + " WHERE id = " + key, function() {
              if(canRepro >= customConfig.approveAttempts) {
                tutils.addReportTrello(bot, key, db, trello);
              } else {
                if(!!editMsgCont) {
                  let splitMsg = editMsgCont.content.split("Report ID: **" + key + "**");
                  let newMsg = splitMsg[0] + "Report ID: **" + key + "**\n✅ **" + userTag + "**: `" + ADcontent + "`" + splitMsg[1];
                  bot.editMessage(config.channels.queueChannel, reportInfo.reportMsgID, newMsg).then(() => {
                  });
                }
              }
              utils.botReply(bot, userID, channelID, ", you've successfully approved report **#" + key + "**", command, msg.id);
              bot.createMessage(config.channels.modLogChannel, "👍 **" + userTag + "** approves: **#" + key + "** `" + reportInfo.header + "` | `" + ADcontent + "`"); //log to bot-log
            });
          });
        } else { //new reportQueueInfo entries. Add XP here
          let canRepro = reportInfo.canRepro++;
          db.run("INSERT INTO reportQueueInfo (id, userID, userTag, reason) VALUES (" + key + ", " + userID + ", '" + userTag + "', '" + ADcontent + "')", function() {
            db.run("UPDATE reports SET canRepro = " + canRepro + " WHERE id = " + key, function() {
              if(canRepro >= customConfig.approveAttempts) {
                tutils.addReportTrello(bot, key, db, trello);
              } else {
                if(!!editMsgCont) {
                  let splitMsg = editMsgCont.content.split("Report ID: **" + key + "**");
                  let newMsg = splitMsg[0] + "Report ID: **" + key + "**\n✅ **" + userTag + "**: `" + ADcontent + "`" + splitMsg[1];
                  bot.editMessage(config.channels.queueChannel, reportInfo.reportMsgID, newMsg).then(() => {
                  });
                }
              }
              utils.botReply(bot, userID, channelID, ", you've successfully approved report **#" + key + "**", command, msg.id);
              bot.createMessage(config.channels.modLogChannel, "👍 **" + userTag + "** approved: **#" + key + "** `" + reportInfo.header + "` | `" + ADcontent + "`"); //log to bot-log
            });
          });
        }
      break;
      case "!deny":
        if(!!checkQueueReport) { //Update reportQueueInfo (User has already given their input and wants to change it)
          let cantRepro = reportInfo.cantRepro++;
          let canRepro = reportInfo.canRepro--;
          db.run("UPDATE reportQueueInfo SET reason = " + ADcontent + " WHERE id = " + key, function() {
            db.run("UPDATE reports SET cantRepro = " + cantRepro + ", canRepro = " + canRepro + " WHERE id = " + key, function() {
              if(cantRepro >= customConfig.denyAttempts) {
                deniedReport(bot, msg, db, key, reportInfo);
              } else {
                if(!!editMsgCont) {
                  let splitMsg = editMsgCont.content.split("Report ID: **" + key + "**");
                  let newMsg = splitMsg[0] + "Report ID: **" + key + "**\n❌ **" + userTag + "**: `" + ADcontent + "`" + splitMsg[1];
                  bot.editMessage(config.channels.queueChannel, reportInfo.reportMsgID, newMsg).then(() => {
                  });
                }
              }
              utils.botReply(bot, userID, channelID, ", you've successfully denied report **#" + key + "**", command, msg.id);
              bot.createMessage(config.channels.modLogChannel, ":thumbsdown: **" + userTag + "** denied: **#" + key + "** `" + reportInfo.header + "` because: `" + ADcontent + "`"); //log to bot-log
            });
          });
        } else { //new reportQueueInfo entries. Add XP here
          let cantRepro = reportInfo.cantRepro++;
          db.run("INSERT INTO reportQueueInfo (id, userID, userTag, reason) VALUES (" + key + ", " + userID + ", '" + userTag + "', '" + ADcontent + "')", function() {
            db.run("UPDATE reports SET cantRepro = " + cantRepro + " WHERE id = " + key, function() {
              if(cantRepro >= customConfig.denyAttempts) {
                deniedReport(bot, msg, db, key, reportInfo);
              } else {
                if(!!editMsgCont) {
                  let splitMsg = editMsgCont.content.split("Report ID: **" + key + "**");
                  let newMsg = splitMsg[0] + "Report ID: **" + key + "**\n❌ **" + userTag + "**: `" + ADcontent + "`" + splitMsg[1];
                  bot.editMessage(config.channels.queueChannel, reportInfo.reportMsgID, newMsg).then(() => {
                  });
                }
              }
              utils.botReply(bot, userID, channelID, ", you've successfully denied report **#" + key + "**", command, msg.id);
              bot.createMessage(config.channels.modLogChannel, ":thumbsdown: **" + userTag + "** denied: **#" + key + "** `" + reportInfo.header + "` because: `" + ADcontent + "`"); //log to bot-log
            });
          });
        }
      break;
    }
  },
  editQueueReport(bot, trello, userTag, userID, key, editSection, newContent, msg, channelID, report) {

    let requiredFields = ["steps to reproduce", "expected result", "actual result", "client setting", "system setting"];
  }
}

module.exports = queueUtils;
