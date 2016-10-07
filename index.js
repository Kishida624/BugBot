const Eris = require('eris');
const config = require('./config.js');

var redis = require('redis'),
    client = redis.createClient(null, null);

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
var canarySKey;
var iOSSKey;
var androidSKey;

bot.on('messageCreate', (msg) => {
  var messageSplit = msg.content.split(' ');
  var command = messageSplit.shift();

  if(command === "!submit"){

    var dev = msg.member.roles.indexOf(config.dev);
    var hunter = msg.member.roles.indexOf(config.hunter);
    var admin = msg.member.roles.indexOf(config.admin);

    var user = msg.author.username + "#" + msg.author.discriminator;

    if(dev > -1 || hunter > -1 || admin > -1){
      if(msg.channel.id === config.ios){
        sendToRedis("i", messageSplit.join(' '), msg.channel.id, user, msg.author.id);

      }else if(msg.channel.id === config.android){
        sendToRedis("a", messageSplit.join(' '), msg.channel.id, user, msg.author.id);

      }else if(msg.channel.id === config.canary){
        sendToRedis("c", messageSplit.join(' '), msg.channel.id, user, msg.author.id);

      }
    }
  }

  if(command === "!header"){

    var dev = msg.member.roles.indexOf(config.dev);
    var hunter = msg.member.roles.indexOf(config.hunter);
    var admin = msg.member.roles.indexOf(config.admin);

    if(dev > -1 || hunter > -1 || admin > -1){
      var getKey;
      var header;
      switch (msg.channel.id) {
        case config.ios:
          if(!iOSSKey){
            getKey = messageSplit.shift();
          }else if(!!iOSSKey && messageSplit[0] === iOSSKey){
            getKey = messageSplit.shift();
            header = messageSplit.join(' ');
          }else{
            getKey = iOSSKey;
            header = messageSplit.join(' ');
          }
          break;
        case config.android:
          if(!androidSKey){
            getKey = messageSplit.shift();
          }else if(!!androidSKey && messageSplit[0] === androidSKey){
            getKey = messageSplit.shift();
            header = messageSplit.join(' ');
          }else{
            getKey = androidSKey;
            header = messageSplit.join(' ');
          }
          break;
        case config.canary:
          if(!canarySKey){
            getKey = messageSplit.shift();
          }else if(!!canarySKey && messageSplit[0] === canarySKey){
            getKey = messageSplit.shift();
            header = messageSplit.join(' ');
          }else{
            getKey = canarySKey;
            header = messageSplit.join(' ');
          }
          break;

      }
      client.hexists(getKey, "os", function(err, reply){
        if(reply === 1){
          header = messageSplit.join(' ');
          setupTrello(getKey, header, msg.channel.id);
        }else if(reply === 0){
          bot.createMessage(msg.channel.id, "Report key is incorrect or missing.");
        }
      });
    }
  }
});

function sendToRedis(system, bugReport, channelID, user, userID){
  var key = system + Math.floor((Math.random() * 8999) + 1000);

  client.hexists(key, "os", function(err, reply){
    if(reply === 1){
      sendToRedis(system, bugReport);
    }else{
      client.hset(key, "os", system);
      client.hset(key, "report", user + "\n" + bugReport);

      if(system === "c"){
        if(!canarySKey){
          canarySKey = key;
        }else if(!!canarySKey){
          canarySKey = undefined;
        }
      }else if(system === "a"){
        if(!androidSKey){
          androidSKey = key;
        }else if(!!androidSKey){
          androidSKey = undefined;
        }
      }else if(system === "i"){
        if(!iOSSKey){
          iOSSKey = key;
        }else if(!!iOSSKey){
          iOSSKey = undefined;
        }
      }
      bot.createMessage(channelID, "<@" + userID +"> Type `!header <key> <name of bug>` to finish the bug report. Your key is: `" + key + "`");
    }
  });
}

function setupTrello(key, header, channelID){
  client.hget(key, "os", function(err, os){
    client.hget(key, "report", function(err, report){
      if(!!err){
        console.log(err);
      }
      if(os.toString() === "c"){
        var listID = config.canaryTrello;
        sendToTrello(listID, header, report.toString(), channelID, key);
      }else if(os.toString() === "a"){
        var listID = config.androidTrello;
        sendToTrello(listID, header, report.toString(), channelID, key);
      }else if(os.toString() === "i"){
        var listID = config.iosTrello;
        sendToTrello(listID, header, report.toString(), channelID, key);
      }
    });
  });
}

function sendToTrello(listID, header, report, channelID, key){
  var creationSuccess = function(data) {
    bot.createMessage(channelID, "Report `" + key + "` added to Trello");
    canarySKey = undefined;
    iOSSKey = undefined;
    androidSKey = undefined;
    client.del(key);
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
