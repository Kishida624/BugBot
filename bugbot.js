"use strict";
const Eris = require('eris');
const config = require('./config');
const customConfig = require('./configEdit');
const commandList = require('./src/commandList')();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/data.sqlite');
const utils = require("./src/utils");
const getBug = require('./src/getBug');
const backup = require('./src/backup');

//Fix admin only commands
//backup on autorestart or on timer
//XP system
//!alias command for "latest" discord version
//check replace "latest" in repro/approval/submit to latest Discord ios/win/linux/android
//escape everything so "usern`ame#9431" doesn't break
//go through all files and convert emoji to emote `X` to `:x:`

let Trello = require('node-trello');
var trello = new Trello(customConfig.trelloKey, customConfig.trelloToken);

let bot = new Eris(customConfig.botToken);

bot.on('error', err => {
  console.log("BOT ERROR:\n" + err.stack);
});
let reconnect = false;
bot.on("ready", () => {
  console.log('───────────────────────\nReady! PID: ' + process.pid);
  db.run("CREATE TABLE IF NOT EXISTS reports (id INTEGER, header TEXT, reportString TEXT, userID TEXT, userTag TEXT, cardID TEXT, reportStatus TEXT, trelloURL TEXT, canRepro INTEGER, cantRepro INTEGER, reportMsgID TEXT, timestamp TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS reportQueueInfo (id INTEGER, userID TEXT, userTag TEXT, info TEXT, stance TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS reportAttachments (id INTEGER, userID TEXT, userTag TEXT, attachment TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS users (userID TEXT, xp INTEGER, windows TEXT, ios TEXT, android TEXT, macOS TEXT, linux TEXT, reproDailyXP INTEGER, reproDailyTimer TEXT, ADdailyXP INTEGER, ADdailyTimer TEXT, hugDailyNumb INTEGER)");
  bot.createMessage(config.channels.modLogChannel, "I heard there are bugs that needs reporting. I'm online and ready to rumble! " + process.pid);

  if(reconnect === false) {
    //run loops

    backup(bot);

    reconnect = true;
  }
});

commandList.add('addNote'); //Done
commandList.add('addRoles'); //Done
commandList.add('adminCommands');
commandList.add('approveDeny'); //Done - missing trelloUtils
commandList.add('attachment');
commandList.add('edit'); //Done - missing trelloUtils
commandList.add('modCommands'); //Done
commandList.add('reproductions');
commandList.add('storeInfo');
commandList.add('submit');
commandList.add('voteMute');
commandList.add('xp');

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

  if(!!msg.channel.guild) {

    let dev = msg.member.roles.indexOf(config.roles.devRole);
    let admin = msg.member.roles.indexOf(config.roles.adminRole);
    let mod = msg.member.roles.indexOf(config.roles.trelloModRole);

    if(command.match(/^!/)) {
      let matchingCommand = commandList.find(command);
      //check for roles
      if(userHasAuthorityForCommand(msg.member, matchingCommand)) {
        //check for channel
        if(correctChannelIsBeingUsed(msg.channel, matchingCommand)){

          console.log(command + " " + messageSplit.join(' '));
          matchingCommand.execute(bot, channelID, userTag, userID, command, msg, trello, db);
        } else {
          //Tell the user they're posting the command in the wrong channel?
        }
      }else {
        // Add channel check
        //Tell the user they don't have permission for that command
        //utils.botReply(bot, userID, channelID, "only people with the role of Bug Hunter or higher can use that command, in order to prevent spam and abuse. Just ask any Bug Hunter™ and they'll be more than happy to help you out.", command, msg.id, true);
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

  } else {
    let getGuild = bot.guilds.get(config.DTserverID);
    let getUser = getGuild.members.get((msg.author.id));
    let getPerms = getUser.roles.indexOf(config.roles.devRole) || getUser.roles.indexOf(config.roles.adminRole) || getUser.roles.indexOf(config.roles.trelloModRole);
    if(!!getPerms && command.toLowerCase() === "!bug") {
      getBug(bot, channelID, userTag, userID, command, msg, trello, db);
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
