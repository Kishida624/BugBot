"use strict";
const config = require("../config");
let queueUtils = require("../src/queueUtils");
let sections = require("../src/getSections");
let utils = require("../src/utils");

function checkSectionsExist(userID, report, channelID, sectionNames, db) {
  let promise = new Promise((resolve, reject) => {

    if(!sectionNames.has('steps to reproduce')) {
      reject("you need to include `Steps to Reproduce: - step one - step two - step three (etc)`");
    }

    if(!sectionNames.has('expected result')) {
      reject("you need to include `Expected Result:`");
    }

    if(!sectionNames.has('actual result')) {
      reject("you need to include `Actual Result:`");
    }

    if(!sectionNames.has('client setting')) {
      reject("you need to include `Client Settings:`");
    }

    if(!sectionNames.has('system setting')) {
      //check if user has system settings in database
      //if not tell them to include system settings
      let whichOS;
      if(channelID === config.channels.androidChannel) {
        whichOS = "android";
      } else if(channelID === config.channels.canaryChannel) {
        whichOS = "windows, macOS";
      } else if(channelID === config.channels.linuxChannel) {
        whichOS = "linux";
      } else if(channelID === config.channels.iosChannel) {
        whichOS = "iOS";
      }

      db.get("SELECT " + whichOS + " FROM users WHERE userid = " + userID, function(error, dbReplySI) {
        if(!!dbReplySI) {
          //Grab system settings for x user from database
          if(channelID === config.channels.canaryChannel) {
            if(!!dbReplySI.windows && !!dbReplySI.macOS) {
              reject("please specify which OS you want to report the bug"); // needs fancy string - bug Dabbit
            } else {
              let os = dbReplySI.windows || dbReplySI.macOS;

              if(!os){
                reject("please add your system settings with `!sysinfo <flag> <info>` or manually add it to the report with `System Settings: info`");
              }

              let sysSettings = " system settings: " + os;
              resolve(sysSettings);
            }
          } else {
            let sysSettings = " system settings: " + dbReplySI[whichOS];
            resolve(sysSettings);
          }
        }else if(!dbReplySI) {
          //Tell user to manually add system settings or store it in the bot
          reject("please add your system settings with `!sysinfo <flag> <info>` or manually add it to the report with `System Settings: info`");
        }
      });
    } else {
      resolve("");
    }
  });
  return promise;
}

let submitCommand = {
  pattern: /!submit|!sumbit/,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let msgID = msg.id;
    var messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let joinedMessage = messageSplit.join(' ');

    switch (command.toLowerCase()) {
      case "!submit":

        let splitter = msg.content.match(/\|/g);

        const pipe = joinedMessage.indexOf("|");
        const header = joinedMessage.substr(0, pipe).trim();
        let report = joinedMessage.substr(pipe + 1).trim();

        if(!splitter || splitter.length > 1) {
          utils.botReply(bot, userID, channelID, "please include **one** pipe `|`", command, msg.id, true);
          return;
        }

        let reportCapLinks = report.replace(/([(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*))/gi, "<$1>");

        const regPattern = /\b(steps to reproduce|expected result|actual result|client setting|system setting)s?:?/gi;
        let matches;
        let sectionNames = new Set();

        while(matches = regPattern.exec(reportCapLinks)) {
          sectionNames.add(matches[1].toLowerCase());
        }


        checkSectionsExist(userID, reportCapLinks, channelID, sectionNames, db).then((extraSystemSettings)=>{
          let allSections = sections(reportCapLinks + extraSystemSettings);

          let stepsToRepro = allSections["steps to reproduce"];
          stepsToRepro = stepsToRepro.replace(/(-)\s/i, '\n$&');
          let expectedResult = allSections["expected result"];
          let actualResult = allSections["actual result"];
          let clientSetting = allSections["client setting"];
          let sysSettings = allSections["system setting"];

          //let checkSys = sysSettings.match(/(-l|-m|-w|-a|-i)/i);

          //if(!!checkSys) {

          //}
          let queueReportString = "\n**Short description:** " + header + "\n**Steps to reproduce:** " + stepsToRepro + "\n**Expected result:** " + expectedResult + "\n**Actual result:** " + actualResult + "\n**Client settings:** " + clientSetting + "\n**System settings:** " + sysSettings;

          queueUtils.queueReport(bot, userTag, userID, channelID, db, msg, reportCapLinks, queueReportString, header);
        }).catch((errorMessage)=>{
          // boReply shit goes here
          utils.botReply(bot, userID, channelID, errorMessage, command, msgID, true);
        });

/*

let matchThis = report.match(/(-w|-m)$/i);
        if(!matchThis) {
          reject("please add your system info with `!sysinfo <flag> <info>` or manually add it to the report with `System Settings: info`");
        } else if(matchThis[1] === "-w") {
          whichOS = "windows";
        } else {
          whichOS = "macOS";
        }
        */
        break;
      case "!sumbit":
        utils.botReply(bot, userID, channelID, "did you mean !submit? If so, I took the liberty to fix your command for you! Just copy paste this: `!submit " + joinedMessage + "`", command, msg.id, true);
        break;
    }
  },
  roles: [
    config.roles.everybodyRole
    ],
  channels: [
    config.channels.iosChannel,
    config.channels.canaryChannel,
    config.channels.androidChannel,
    config.channels.linuxChannel
  ]
}
module.exports = submitCommand;
