"use strict";
const config = require("../config");
const utils = require("./utils");
const addReproToTrello = require("./trelloRepro");
//Check for "latest"

function queueRepro(bot, trello, db, channelID, reportKey, key) {
  let delayTime = 0;
  let emoji = "\n<:greenTick:" + config.emotes.greenTick + "> ";
  let reproduction = "Can reproduce.";
  db.each("SELECT userTag, info FROM reportQueueInfo WHERE stance = 'approve' AND id = " + key, function(error, data) {
    delayTime += 2000;
    setTimeout(function() {
      reproSetup(bot, null, channelID, null, trello, db, data.info, reportKey, emoji, reproduction, data.userTag, null);
    }, delayTime);
  });
}

function addRepro(bot, userID, channelID, msgID, trello, db, reproCnt, reportKey, emoji, reproduction, userTag, command, msgContent, reportMsgID, report) {
  let reproCount = 0;
  if(!!report && reproduction === "Can reproduce.") {
    reproCount = report.canRepro + 1;
    db.run("UPDATE reports SET canRepro = " + reproCount + " WHERE trelloURL = '" + reportKey + "'");
  } else if (!!report) {
    reproCount = report.cantRepro + 1;
    db.run("UPDATE reports SET cantRepro = " + reproCount + " WHERE trelloURL = '" + reportKey + "'");
  }

  let splitMsg = msgContent.split('**Reproducibility:**');
  let splitOne = splitMsg[1];
  let pattern = "\\\n(\\<\\:greenTick\\:" + config.emotes.greenTick + "\\>|\\<\\:redTick\\:" + config.emotes.redTick + "\\>)\\s(\\*\\*" + userTag + "\\*\\*)\\s(.*)";
  let newRegex = new RegExp(pattern, "i");

  let matchTick = splitOne.match(newRegex);

  if(!!userID && !!report &&!!matchTick && "\n" + matchTick[1] + " " !== emoji) {
    if(reproduction === "Can reproduce.") {
      reproCount = report.canRepro + 1;
      let cantRepro = report.cantRepro - 1;
      db.run("UPDATE reports SET canRepro = " + reproCount + ", cantRepro = " + cantRepro + " WHERE trelloURL = '" + reportKey + "'");
    } else {
      reproCount = report.cantRepro + 1;
      let canRepro = report.canRepro - 1;
      db.run("UPDATE reports SET cantRepro = " + reproCount + ", canRepro = " + canRepro + " WHERE trelloURL = '" + reportKey + "'");
    }
  } else if (!!userID && !!report && !matchTick) {
    if(reproduction === "Can reproduce.") {
      reproCount = report.canRepro + 1;
      db.run("UPDATE reports SET canRepro = " + reproCount + " WHERE trelloURL = '" + reportKey + "'");
    } else {
      reproCount = report.cantRepro + 1;
      db.run("UPDATE reports SET cantRepro = " + reproCount + " WHERE trelloURL = '" + reportKey + "'");
    }
  }
  if (!!userID && !!report && !!matchTick && "\n" + matchTick[1] + " " !== emoji) {
    if(reproduction === "Can reproduce.") {
      reproCount = report.canRepro + 1;
      let cantRepro = report.cantRepro - 1;
      db.run("UPDATE reports SET canRepro = " + reproCount + ", cantRepro = " + cantRepro + " WHERE trelloURL = '" + reportKey + "'");
    } else {
      reproCount = report.cantRepro + 1;
      let canRepro = report.canRepro - 1;
      db.run("UPDATE reports SET cantRepro = " + reproCount + ", canRepro = " + canRepro + " WHERE trelloURL = '" + reportKey + "'");
    }
  }
  let newRepro = emoji + "**" + userTag + "** | `" + reproCnt + "`";
  let replace = splitOne.replace(newRegex, newRepro);
  let editMsgCreate;

  if(!!matchTick) { // edit old repro msg and add to trello
    editMsgCreate = splitMsg[0] + "**Reproducibility:**" + replace;
  } else { // add new repro and add to Trello
    editMsgCreate = splitMsg[0] + "**Reproducibility:**" + newRepro + splitMsg[1];
  }
  addReproToTrello(bot, userID, userTag, db, trello, reportKey, channelID, reproduction, emoji, reproCnt, editMsgCreate, msgID, reportMsgID, command, reproCount);
}

function reproSetup(bot, userID, channelID, msgID, trello, db, reproCnt, reportKey, emoji, reproduction, userTag, command) {
  db.get("SELECT cantRepro, canRepro, id, reportMsgID FROM reports WHERE trelloURL = '" + reportKey + "'", function(error, report) {
    if(!!report) { //add repro to trello and add to can/tRepro in DB
      //check if user has already repro'd

      bot.getMessage(channelID, report.reportMsgID).then((msgContent) => {

        addRepro(bot, userID, channelID, msgID, trello, db, reproCnt, reportKey, emoji, reproduction, userTag, command, msgContent.content, report.reportMsgID, report);

      }).catch(error => {console.log("Repro Add msg In DB\n" + error);});
    } else {
      bot.getMessages(channelID).then((msgContent) => {
        let rtndData = msgContent.find(function(info) {
          return info.author.id === config.botID && info.content.indexOf("https://trello.com/c/" + reportKey) > -1 && info.content.indexOf("Reproducibility:") > -1;
        });

        if(!!rtndData) {
          addRepro(bot, userID, channelID, msgID, trello, db, reproCnt, reportKey, emoji, reproduction, userTag, command, rtndData.content, rtndData.id, null);
        } else {
          addReproToTrello(bot, userID, userTag, db, trello, reportKey, channelID, reproduction, emoji, reproCnt, null, msgID, null, command, reproCount);
        }
      }).catch(error => {console.log("Repro Legacy\n" + error);});
    }
  });
}

let preCheckReproSetupLoop = 0;
function preCheckReproSetup(bot, reportKey, reproCnt, reproduction, userTag, channelID, msgID, userID, emoji, trello, db, command) {
  trello.get("/1/cards/" + reportKey, {}, function(errorURL, urlData) {
    if(!!urlData){
      if(!urlData.id) {
        utils.botReply(bot, userID, channelID, "incorrect url.", command, msgID, false);
        return;
      }
      if(urlData.closed === true) {
        utils.botReply(bot, userID, channelID, "this bug has already been closed.", command, msgID, false);
        return;
      }

      let whichClient = reproCnt.match(/(-l|-m|-w|-a|-i)/i);
      let system;

      if(!reproCnt){
        utils.botReply(bot, userID, channelID, "you're missing a reason or system settings. Refer to #Bot-Help for more info", command, msgID, false);
        return;
      } else if(!!whichClient) {
        if(whichClient[1] === "-c") {
          system = "canary";
        } else if(whichClient[1] === "-i") {
          system = "ios";
        } else if(whichClient[1] === "-l") {
          system = "checkOS";
        } else if(whichClient[1] === "-m") {
          system = "macOS";
        } else if(whichClient[1] === "-a") {
          system = "android";
        }
        db.get("SELECT " + system + " FROM users WHERE id = '" + userID + "'", function(error, usrSys) {
          if(!!usrSys){
            reproCnt = reproCnt.replace(/(-l|-m|-w|-a|-i)/i, usrSys[system]);
            reproSetup(bot, userID, channelID, msgID, trello, db, reproCnt, reportKey, emoji, reproduction, userTag, command);
          } else {
            utils.botReply(bot, userID, channelID, "doesn't seem like you have that client in our system. You can add it with `!addsys " + whichClient[1] + " new System`", command, msgID, false);
            return;
          }
        });
      } else {
        reproSetup(bot, userID, channelID, msgID, trello, db, reproCnt, reportKey, emoji, reproduction, userTag, command);
      }
    } else {
      if(preCheckReproSetupLoop >= 5) {
        preCheckReproSetupLoop++;
        preCheckReproSetup(bot, reportKey, reproCnt, reproduction, userTag, channelID, msgID, userID, emoji, trello, db, command);
      } else {
        utils.botReply(bot, userID, channelID, "something went wrong, please try again later.", command, msgID);
      }
    }
  });
}

module.exports = {
  queueRepro: queueRepro,
  preCheckReproSetup: preCheckReproSetup
};
