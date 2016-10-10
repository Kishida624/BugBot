const Eris = require('eris');
const config = require('./config.js');

var Trello = require("node-trello");
var t = new Trello(config.trelloKey, config.trelloToken);

var bot = new Eris(config.token, {
  maxShards: 2
});

bot.on("error", err => {
    console.log("@" + bot.user.username + " - " + "ERROR:\n" + err.stack);
});


bot.on("ready", () => {
    console.log('Ready!');
});

bot.on('messageCreate', (msg) => {
  var messageSplit = msg.content.split(' ');
  var command = messageSplit.shift();

  if(command.toLowerCase() === "!submit"){

    var dev = msg.member.roles.indexOf(config.dev);
    var hunter = msg.member.roles.indexOf(config.hunter);
    var admin = msg.member.roles.indexOf(config.admin);

    var user = msg.author.username + "#" + msg.author.discriminator;

    if(dev > -1 || hunter > -1 || admin > -1){
      if(!msg.content.match(/\|/g)){
        bot.createMessage(msg.channel.id, "<@" + msg.author.id + "> Please use the proper format. `!submit <title> | <report>`");
      }else if(msg.content.match(/\|/g).length < 2){
        var str = messageSplit.join(' ');
        var attachment;
        const pipe = str.indexOf("|");
        const header = str.substr(0, pipe).trim();
        const report = str.substr(pipe+1).trim();

        if(!!msg.attachments[0]){
          attachment = "\n" + msg.attachments[0].url;
        }else{
          attachment = "";
        }

        if(msg.channel.id === config.ios){
          var listID = config.iosTrello;
          sendToTrello(listID, header, user + "\n" + report + attachment, msg.channel.id);

        }else if(msg.channel.id === config.android){
          var listID = config.androidTrello;
          sendToTrello(listID, header, user + "\n" + report + attachment, msg.channel.id);

        }else if(msg.channel.id === config.canary){
          var listID = config.canaryTrello;
          sendToTrello(listID, header, user + "\n" + report + attachment, msg.channel.id);

        }
      }else{
        bot.createMessage(msg.channel.id, "<@" + msg.author.id + "> Please use the proper format. `!submit <title> | <report>`");
      }
    }
  }
});

function sendToTrello(listID, header, report, channelID){
  var creationSuccess = function(err, data) {
    bot.createMessage(channelID, "Report added to Trello <" + data.shortUrl + ">");
  };
  var newCard = {
    name: header,
    desc: report,
    idList: listID,
    pos: 'top'
  };
  t.post('/1/cards/', newCard, creationSuccess);
}
bot.connect();
