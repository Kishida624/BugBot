"use strict";
const config = require('../config');
const customConfig = require('../configEdit');
const utils = require('./utils');

function addReproToTrello(bot, userID, userTag, db, trello, reportKey, channelID, reproduction, emoji, reproCnt, editMsg, msgID, editMsgID, command, reproCount) {

  var sentRepro = function(error, info) {
    if(!!error) {
      bot.createMessage(channelID, "Something went wrong, please try again. Mods have been notified");
      bot.createMessage(config.channels.modLogChannel, "Something went wrong\n" + error);
    }else{
      if(reproCount <= customConfig.reproAttempts) {
        if(!!userID){ //userID = null when repro comes from Queue report

          if(!!editMsgID && !!editMsg) { //check that message exists before modifying it
            bot.editMessage(channelID, editMsgID, editMsg).catch((error) => {console.log("addRepro EditMsg\n" + error);});
          }
        }else{ // add repro from queue report
          bot.editMessage(channelID, editMsgID, editMsg).catch((error) => {console.log("addRepro Queue EditMsg\n" + error);});
        }

        if(!!command) {
          utils.botReply(bot, userID, channelID, "your reproduction has been added to the ticket.", command, msgID, false);
        }
      }
      bot.createMessage(config.channels.modLogChannel, emoji + " **" + userTag + "** " + reproduction + " `" + info.data.card.name + "` <http://trello.com/c/" + info.data.card.shortLink + ">");
    }
  }

  var reproInfo = {
    text: reproduction + "\n" + reproCnt + "\n\n"+ userTag
  };
  trello.post("/1/cards/" + reportKey + "/actions/comments", reproInfo, sentRepro);
}

if(module) { module.exports = addReproToTrello; }
