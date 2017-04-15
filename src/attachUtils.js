"use strict";
const config = require("../config");
const utils = require("./utils");
const customConfig = require("../configEdit");

function attachUtils (bot, channelID, userTag, userID, command, msg, trello, trelloURL, attachment, removeMsg, urlDataName) {
  let attachmentAttached = function(error, dataAttach) {
    if(!!error) {
      utils.botReply(bot, userID, config.channels.modLogChannel, "Something went wrong by attaching, please notify the authorities <https://trello.com/c/" + trelloURL + ">", command, null, false);
    }

    if(removeMsg === true) {
      bot.getMessages(channelID).then((messages) => {
        let gotMsg = messages.map(function(msgs) {
          return msgs.author.id === config.botID && msgs.content.indexOf("https://trello.com/c/" + trelloURL) > -1 && msgs.content.indexOf("Reproducibility:") > -1;
        });

        if(!!gotMsg) {
          let splitMsg = gotMsg.content.split('**Reproducibility:**');
          let newMsg = splitMsg[0] + "**Reproducibility:**\n:paperclip: **" + userTag + "**" + attachment + splitMsg[1];
          bot.editMessage(channelID, gotMsg.id, newMsg);
        }
        setTimeout(function() {
          bot.deleteMessage(channelID, msg.id);
        }, customConfig.delayInS * 1000);
      }).catch(error => {console.log("attachUtils getMSG\n" + error);});
    }
    bot.createMessage(config.channels.modLogChannel, ":paperclip: **" + userTag + "**: `" + urlDataName + "` <https://trello.com/c/" + trelloURL + ">");
  }

  let addAttachment = {
    url: attachment,
    name: userTag
  }
  trello.post('/1/cards/' + trelloURL + '/attachments', addAttachment, attachmentAttached);
}

module.exports = attachUtils;
