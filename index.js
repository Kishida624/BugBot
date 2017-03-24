"use strict";
let Eris = require('eris');
const config = require('./config');
const customConfig = require('./configEdit');
const commandList = require('./src/commandList')();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/data.sqlite');
let utils = require("./src/utils");

//Fix !edit command
//Fix admin only commands
//fix !attach command
//backup on autorestart or on timer
//XP system
//!alias command for "latest" discord version
//check replace "latest" in repro/approval/submit to latest Discord ios/win/linux/android
//Make !bug work in DMs. Check if user is mod+ in DT before responding. Include denial'er & reason and approver & specs
//escape everything so "usern`ame#9431" doesn't break

let Trello = require('node-trello');
var trello = new  Trello(customConfig.trelloKey, customConfig.trelloToken);

let bot = new Eris(customConfig.botToken);

bot.on('error', err => {
  console.log("ERROR:\n" + err.stack);
});

bot.on("ready", () => {
  console.log('Ready!');
  db.run("CREATE TABLE IF NOT EXISTS reports (id INTEGER, header TEXT, reportString TEXT, userID INTEGER, userTag TEXT, cardID TEXT, reportStatus TEXT, trelloURL TEXT, canRepro INTEGER, cantRepro INTEGER, reportMsgID INTEGER, timestamp TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS reportQueueInfo (id INTEGER, userID INTEGER, userTag TEXT, reason TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS reportAttachments (id INTEGER, userID INTEGER, userTag TEXT, attachment TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS users (userID INTEGER, xp INTEGER, windows TEXT, ios TEXT, android TEXT, macOS TEXT, linux TEXT, reproDailyXP INTEGER, reproDailyTimer TEXT, ADdailyXP INTEGER, ADdailyTimer TEXT, hugDailyXP INTEGER, hugDailyTimer TEXT)");
});

commandList.add('addRoles'); //Done
commandList.add('addNote'); //Done
commandList.add('approveDeny'); //Done - missing trelloUtils
commandList.add('attachment');
commandList.add('edit'); //Done - missing trelloUtils
commandList.add('submit');
commandList.add('reproductions');
commandList.add('modCommands'); //Done
commandList.add('adminCommands');
commandList.add('voteMute');
commandList.add('storeInfo');

function userHasRole(user, role) {
  return user.roles.some(memberRole => memberRole === role);
}

function userHasAuthorityForCommand(user, command) {
  if(command.roles.some(role => role == config.roles.everybodyRole)) {
    return true;
  }

  return command.roles.some(role => userHasRole(user, role));
}

function correctChannel(guild, channel){
  return guild.id === channel;
}

function correctChannelIsBeingUsed(guild, command) {
  if(command.channels.some(channel => channel === config.channels.allChannels)){
    return true;
  }
  return command.channels.some(channel => correctChannel(guild, channel));
}

bot.on('guildMemberUpdate', (guild, member, oldMember) => {
  if(!!oldMember && (oldMember.roles.indexOf(config.roles.hunterRole) <= -1 && member.roles.indexOf(config.roles.hunterRole) > -1)){
    bot.createMessage(config.channels.bugHunterChannel, 'Welcome <@' + member.user.id + '> to the Bug Hunters™!');
  }else if(!oldMember) {
    console.log("guildMemberUpdate failed " + oldMember);
  }
});

let delMsgCooldown = false;

bot.on('messageCreate', (msg) => {
  let messageSplit = msg.content.split(' ');
  let command = messageSplit.shift();

  let channelID = msg.channel.id;
  let userTag = msg.author.username + "#" + msg.author.discriminator;
  let userID = msg.author.id;

  let dev = msg.member.roles.indexOf(config.roles.devRole);
  let admin = msg.member.roles.indexOf(config.roles.adminRole);
  let mod = msg.member.roles.indexOf(config.roles.trelloModRole);

  if(command.match(/^!/)) {
    let matchingCommand = commandList.find(command);
    //check for roles
    if(userHasAuthorityForCommand(msg.member, matchingCommand)) {
      //check for channel
      if(correctChannelIsBeingUsed(msg.channel, matchingCommand)){

        matchingCommand.execute(bot, channelID, userTag, userID, command, msg, trello, db);
      } else {
        //Tell the user they're posting the command in the wrong channel?
      }
    }else {
      // Add channel check
      //Tell the user they don't have permission for that command
      utils.botReply(bot, userID, channelID, "only people with the role of Bug Hunter or higher can use that command, in order to prevent spam and abuse. Just ask any Bug Hunter™ and they'll be more than happy to help you out.", command, msg.id, true);
    }
  }else {
    let isRightChannel = channelID === config.channels.queueChannel || channelID === config.channels.iosChannel || channelID === config.channels.linuxChannel || channelID === config.channels.androidChannel || channelID === config.channels.canaryChannel;
    let isNotMod = dev === -1 && admin === -1 && mod === -1;
    let isNotBot = userID !== config.botID;

    if(isNotBot && isNotMod && isRightChannel) {
      //Delete and say commands only on delay
      bot.deleteMessage(channelID, msg.id);
      if(delMsgCooldown === false){
        delMsgInReportingChannel(channelID, userID);
      }
    }
  }
});



// Tell the user that they can only post commands in the reporting channel
function delMsgInReportingChannel(channelID, userID) {
  bot.createMessage(channelID, "<@" + userID + "> only bot-commands are allowed in this channel. Please review #bot-help if you're unsure of the commands.").then(utils.delay(customConfig.delayInS)).then((msgInfo) => {
    bot.deleteMessage(channelID, msgInfo.id);
  }); // Needs text for user reply when chatting in bug reporting channel
  delMsgCooldown = true;
  setTimeout(function () {
    delMsgCooldown = false;
  }, 5000);
}

bot.connect();
