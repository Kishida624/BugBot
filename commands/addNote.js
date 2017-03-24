"use strict";
const config = require("../config");
let utils = require("../src/utils");
const customConfig = require('../configEdit');

let addNote = {
  pattern: /!addnote/i,
  execute: function(bot, channelID, userTag, userID, command, msg) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let joinedMessage = messageSplit.join(' ');

    let trelloURL = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$2");
    let note = joinedMessage.replace(/(?:(<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(\/|\>)?(?:[\w-\d]*)?(\/|\>|\/>)?\s*\|\s*([\s\S]*)/gi, "$5");

    trello.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
      if(!!urlData && !!urlData.id && urlData.closed === false){
        utils.botReply(bot, userID, channelID, "please provide a valid URL, a note, and make sure the issue is not closed.", command, msg.id);
        return;
      }
      if(note === trelloURL){
        utils.botReply(bot, userID, channelID, "please provide a note", command, msg.id);
        return;
      }

      let addedNote = function(error, info) {
        if(!!error) {
          bot.createMessage(channelID, "Something went wrong, please try again").then(utils.delay(customConfig.delayInS)).then((msgInfo) => {
          bot.deleteMessage(channelID, msgInfo.id);
        }).catch((err) => {
          console.log("--> addNote | sendNote error\n" + err);
        });
        }else{
          bot.createMessage(channelID, "<@" + userID + ">, your note has been added to the ticket.").then(utils.delay(customConfig.delayInS)).then((msgInfo) => {
            bot.deleteMessage(channelID, msgInfo.id);
            bot.deleteMessage(channelID, msg.id);
          }).catch((err) => {
            console.log("--> addNote | userNote added\n" + err);
          });

          bot.createMessage(config.channels.modLogChannel, "**" + userTag + "**: Added a note to `" + info.data.card.name + "` <http://trello.com/c/" + info.data.card.shortLink + ">");
        }
      }

      let noteContent = {
        text: note + "\n\n" + userTag
      }
      trello.post("/1/cards/" + trelloURL + "/actions/comments", noteContent, addedNote);

    });
  },
  roles: [
    config.roles.adminRole,
    config.roles.trelloModRole,
    config.roles.devRole,
    config.roles.hunterRole
    ],
  channels: [
    config.channels.iosChannel,
    config.channels.canaryChannel,
    config.channels.androidChannel,
    config.channels.linuxChannel
  ]
}
module.exports = addNote;
