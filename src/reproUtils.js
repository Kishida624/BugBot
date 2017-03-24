"use strict";
const config = require("../config");
const customConfig = require('../configEdit');
let utils = require("./utils");
let trelloUtils = require("./trelloUtils");
//Check for "latest"

function queueRepro(bot, trello, db, channelID, key) {
  let delayTime = 0;
  let emoji = "\n✅ ";
  let reproduction = "Can reproduce.";
  db.each("SELECT userTag, reason AS info FROM reportQueueInfo WHERE id = " + key, function(error, data) {
    delayTime += 2000;
    setTimeout(function() {
      reproSetup(bot, reportKey, data.info, reproduction, data.userTag, channelID, null, null, emoji, trello, db);
    }, delayTime);
  });
}

let reproSetupLoop = 0;
function reproSetup(bot, reportKey, reproCnt, reproduction, userTag, channelID, msgID, userID, emoji, trello, db) {
  trello.get("/1/cards/" + reportKey, {}, function(errorURL, urlData) {
    if(!!urlData){
      if(urlData.closed === true) {
        utils.botReply(bot, userID, channelID, "this bug has already been closed.", command, msgID, false);
        return;
      }
      if(!urlData.id) {
        utils.botReply(bot, userID, channelID, "incorrect url.", command, msgID, false);
        return;
      }

      let checkOS = reproCnt.match(/(-l|-m|-w|-a|-i)/i);
      let whichOS;

      if(checkOS[1] === "-c") {
        whichOS = "canary";
      } else if(checkOS[1] === "-i") {
        whichOS = "iOS";
      } else if(whichOS[1] === "-l") {
        whichOS = "checkOS";
      } else if(checkOS[1] === "-m") {
        whichOS = "macOS";
      } else if(checkOS[1] === "-a") {
        whichOS = "android";
      }

      if(!!cmnt) {
        db.get("SELECT " + whichOS + " FROM users WHERE id = " + userID, function(error, usrSys) {
          if(!!usrSys){
            reproCnt = reproCnt.replace(/(-l|-m|-w|-a|-i)$/i, usrSys.content[1]);
          } else {
            utils.botReply(bot, userID, channelID, "doesn't seem like you have that client in our system. You can add it with `!addsys " + whichOS + " new System`", command, msgID, false);
            return;
          }
        });
      }

      db.get("SELECT cantRepro, canRepro, id, reportMsgID FROM reports WHERE trelloURL = " + reportKey, function(error, report) {
          if(!!report) { //add repro and add to can/tRepro in DB
            bot.getMessage(channelID, report.reportMsgID).then((msgContent) => {
              let repro;
              if(reproduction === "Can reproduce.") {
                repro = report.canRepro;
                repro++;
                db.run('UPDATE ' + key + ' (canRepro) SET VALUES (' + repro + ')');
              } else {
                repro = report.cantrepro;
                db.run('UPDATE ' + key + ' (cantrepro) SET VALUES (' + repro + ')');
              }
              //check if repro is greater then 5
              //don't post in chat if greater then 5

              if(repro >= 5 || !msgContent) { // Skip edit msg if report has > 5 repro's or msg is not in chat
                let splitMsg = msgContent.content.split("**Reproducibility**");
                let pattern = "(.*)(" + userTag + ")";
                let regex = new RegExp(pattern, "i");
                let matchUser = splitMsg[1].match(regex);

                let editMsgCreate;
                if(!!matchUser) {
                  //Change user's repro in chat msg, add new entry to Trello
                  editMsgCreate = splitMsg[0] + "**Reproducibility:**\n" + splitMsg[1].replace(regex, emoji + userTag + " | " + reproCnt);
                } else {
                  //add repro normally to chat and Trello
                  editMsgCreate = splitMsg[0] + "**Reproducibility:**\n" + emoji + userTag + " | " + reproCnt + splitMsg[1];
                }
                trelloUtils.userRepro(bot, userID, userTag, db, trello, reportKey, channelID, reproduction, emoji, reproCnt, null, msgID, null);
              } else if (repro < 5 && !!msgContent) { // Edit msg in chat if report has < 5 and msg is in chat
                trelloUtils.userRepro(bot, userID, userTag, db, trello, reportKey, channelID, reproduction, emoji, reproCnt, editMsgCreate, msgID, report.reportMsgID);
              }
            }).catch((err) => {
              console.log("--> Repro setup | getMessage\n" + err);
            });

          } else {
            bot.getMessages(channelID).then((msgContent) => {
              let rtndData = oldMsgInfo.find(function(info) {
                return info.author.id === config.botID && info.content.indexOf("https://trello.com/c/" + reportKey) > -1 && info.content.indexOf("Reproducibility:") > -1;
              });
              if(!!rtndData) { // Add repro to trello and chat msg - Legacy report
                let splitMsg = rtndData.content.split("**Reproducibility**");
                let pattern = "(.*)(" + userTag + ")";
                let regex = new RegExp(pattern, "i");
                let matchUser = splitMsg[1].match(regex);

                let editMsgCreate;
                if(!!matchUser) {
                  //Change user's repro in chat msg, add new entry to Trello
                  editMsgCreate = splitMsg[0] + "**Reproducibility:**\n" + splitMsg[1].replace(regex, emoji + userTag + " | " + reproCnt);
                } else {
                  //add repro normally to chat and Trello
                  editMsgCreate = splitMsg[0] + "**Reproducibility:**\n" + emoji + userTag + " | " + reproCnt + splitMsg[1];
                }
                reproUtils.userRepro(bot, userID, userTag, db, trello, reportKey, channelID, reproduction, emoji, reproCnt, editMsgCreate, msgID, rtndData.id);
              } else { // Add repro to Trello, no chat msg - Legcay report
                reproUtils.userRepro(bot, userID, userTag, db, trello, reportKey, channelID, reproduction, emoji, reproCnt, null, msgID, null);
              }
            });
          }
      });
    } else {
      if(reproSetupLoop >= 5) {
        reproSetupLoop++;
        reproSetup(bot, reportKey, reproCnt, reproduction, userTag, channelID, msgID, userID, emoji, trello, db);
      } else {
        utils.botReply(bot, userID, channelID, "something went wrong, please try again later.", command, msg.id);
      }
    }
  });
}

module.exports = {
  queueRepro: queueRepro,
  reproSetup: reproSetup
};
