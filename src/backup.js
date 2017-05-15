"use strict";
const configEdit = require('../configEdit');
const fs = require('fs');
const config = require('../config');
const dateFormat = require('dateformat');

function backup(bot) {
  setTimeout(function() {
    let now = new Date();
    let thisCycle = dateFormat(now, "UTC:mm-dd-yyyy-HH-MM");
    let bufferString = fs.readFileSync('./data/data.sqlite');

    bot.createMessage(config.channels.modLogChannel, {file: bufferString, name: "Backup-" + thisCycle + ".sqlite"});
  }, configEdit.backupTimer * 1000 * 60 * 60);
}

module.exports = backup;
