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

  var channelID = msg.channel.id;
  var user = msg.author.username + "#" + msg.author.discriminator;
  var userID = msg.author.id;

    switch (command.toLowerCase()) {
      case "!android":
        if(msg.channel.id === config.android){
          var android = config.androidAlpha;
          var roles = msg.member.roles;
          var index = roles.indexOf(android);
          if(index === -1){
            roles.push(android);
            bot.editGuildMember(msg.guild.id, msg.author.id, {
              roles: roles
            }).then(() => {
              bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, you have been given the role of `Android Alpha`.  Use the same command again to remove this role from yourself.");
            });
          }else{
            roles.splice(index, 1);
            bot.editGuildMember(msg.guild.id, msg.author.id, {
              roles: roles
            }).then(() => {
              bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, you have been removed from the `Android Alpha` role. Use the same command again to add this role to yourself.");
            });
          }
        }
        break;
      case "!ios":
        if(msg.channel.id === config.ios){
          var ios = config.iosTestflight;
          var roles = msg.member.roles;
          var index = roles.indexOf(ios);
          if(index === -1){
            roles.push(ios);
            bot.editGuildMember(msg.guild.id, msg.author.id, {
              roles: roles
            }).then(() => {
              bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, you have been given the role of `iOSTestflight`.  Use the same command again to remove this role from yourself.");
            });
          }else{
            roles.splice(index, 1);
            bot.editGuildMember(msg.guild.id, msg.author.id, {
              roles: roles
            }).then(() => {
              bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, you have been removed from the `iOSTestflight` role. Use the same command again to add this role to yourself.");
            });
          }
        }
        break;
    }

  if(msg.channel.id === config.android || msg.channel.id === config.canary || msg.channel.id === config.ios){

    if(command.toLowerCase() === "!canrepro"){
      var joinedMessage = messageSplit.join(' ');
      var splitter = joinedMessage.indexOf("|");
      var url = joinedMessage.substr(0, splitter).trim();
      var clientInfo = joinedMessage.substr(splitter + 1).trim();
      var trelloURL = url.match(/[^/]+(?=$|$)/gi);

      if(splitter > -1 && !!clientInfo){
        t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
          if(!!urlData.id){
            var status = "Can reproduce.\n";
            repro(status, user, clientInfo, channelID, trelloURL, userID);
          }else{
            bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, incorrect url");
          }
        });

      }else{
        bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, please provide a valid URL and a client version");
      }
    }
    if(command.toLowerCase() === "!cannotrepro"){
      var joinedMessage = messageSplit.join(' ');
      var splitter = joinedMessage.indexOf("|");
      var url = joinedMessage.substr(0, splitter).trim();
      var clientInfo = joinedMessage.substr(splitter + 1).trim();
      var trelloURL = url.match(/[^/]+(?=$|$)/gi);

      if(splitter > -1 && !!clientInfo){
        t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
          if(!!urlData.id){
            var status = "Can't reproduce.\n";
            repro(status, user, clientInfo, channelID, trelloURL, userID);
          }else{
            bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, incorrect url");
          }
        });
      }else{
        bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, please provide a valid URL and a client version");
      }
    }

    if(command.toLowerCase() === "!attach"){
      var dev = msg.member.roles.indexOf(config.dev);
      var hunter = msg.member.roles.indexOf(config.hunter);
      var admin = msg.member.roles.indexOf(config.admin);

      if(dev > -1 || hunter > -1 || admin > -1){
        var attachment;
        var joinedMessage = messageSplit.join(' ');

        var splitter = joinedMessage.indexOf("|");
        var url = joinedMessage.substr(0, splitter).trim();
        var attachmentUrl = joinedMessage.substr(splitter + 1).trim();
        var trelloURL = url.match(/[^/]+(?=$|$)/gi);


        t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
          if(!!urlData.id){
            if(!!msg.attachments[0]){
              attachment = msg.attachments[0].url;
              addAttachment(channelID, attachment, user, trelloURL, userID);
            }else if(!!attachmentUrl.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)){
              attachment = attachmentUrl;
              addAttachment(channelID, attachment, user, trelloURL, userID);
            }else{
              bot.createMessage(msg.channel.id, "<@" + msg.author.id + "> Please include a valid image");
            }

          }else{
            bot.createMessage(msg.channel.id, "<@" + msg.author.id + "> Please include a valid trello link");
          }
        });
      }
    } // Add attachments to reports // Attach files to existing reports
    if(command.toLowerCase() === "!edit"){
        var dev = msg.member.roles.indexOf(config.dev);
        var hunter = msg.member.roles.indexOf(config.hunter);
        var admin = msg.member.roles.indexOf(config.admin);

        if(dev > -1 || hunter > -1 || admin > -1){
          var attachment;

          var joinedMessage = messageSplit.join(' ');
          var splitter = msg.content.match(/\|/g);

          const splitURLReport = joinedMessage.indexOf("|");
          var url = joinedMessage.substr(0, splitURLReport).trim();
          var trelloURL = url.match(/[^/]+(?=$|$)/gi);

          var report = joinedMessage.substr(splitURLReport + 1).trim();

          var lowerCaseReport = report.toLowerCase();
          var matchFormat = lowerCaseReport.match(/\bsteps to reproduce|expected result|actual result/gi);

          if(!!splitter && splitter.length < 2 && !!matchFormat && matchFormat.length === 3 && matchFormat.indexOf('steps to reproduce') > -1 && matchFormat.indexOf('expected result')  > -1 && matchFormat.indexOf('actual result') > -1){

            t.get("/1/cards/" + trelloURL, { }, function(errorURL, urlData) {
              if(!!urlData.id){

                var attachment;

                var section2 = report.match(/(steps to reproduce)([\s\S]*)(?=expected result)/gi);
                var section3 = report.match(/(expected result)([\s\S]*)(?=actual result)/gi);

                var systemClient = lowerCaseReport.match(/\b(?:system setting)|\b(?:client version)/gi);

                if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('system setting') > -1){
                  var section4 = report.match(/(actual result)([\s\S]*)(?=system setting)/gi);
                  var section5 = report.match(/(system setting)([\s\S]*)/gi);

                  var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                  var section5Clean = section5[0].replace(/(System Setting(s)?(:)?)([\s\S]*)/gi, '$4');
                  var combinedSections = section4Clean + "\n####System settings:\n" + section5Clean;
                }else if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('client version') > -1){
                  var section4 = report.match(/(actual result)([\s\S]*)(?=client version)/gi);
                  var section5 = report.match(/(client version)([\s\S]*)/gi);

                  var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                  var section5Clean = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                  var combinedSections = section4Clean + "\n####Client version:\n" + section5Clean;
                }else if(!!systemClient && systemClient.length === 2){

                  var section4 = report.match(/(actual result)([\s\S]*)(?=client version)/gi);
                  var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                  if(systemClient[0] === "client version"){
                    var section5 = report.match(/(client version)([\s\S]*)(?=system setting)/gi);
                    var section5Clean = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                    var section6 = report.match(/(system setting)([\s\S]*)/gi);
                    var section6Clean = section6[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                  }else{
                    var section5 = report.match(/(system setting)([\s\S]*)(?=client version)/gi);
                    var section5Clean = section5[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                    var section6 = report.match(/(client version)([\s\S]*)/gi);
                    var section6Clean = section6[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                  }
                  var combinedSections = section4Clean + "\n####System settings:\n" + section5Clean + "\n####Client version:\n" + section6Clean;
                }else{
                  var section4 = report.match(/(actual result)([\s\S]*)/gi);
                  var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                  var combinedSections = section4Clean;
                }

                var section2Clean = section2[0].replace(/(steps to reproduce(s)?(:)?)([\s\S]*)/gi, '$4');
                var section3Clean = section3[0].replace(/(expected result(s)?(:)?)([\s\S]*)/gi, '$4');

                if(!section2){
                  section2.push(' ');
                }else if(!section3){
                  section3.push(' ');
                }else if(!section4){
                  section4.push(' ');
                }

                if(section2[0].indexOf(' - ') > -1){

                  var section2String = section2Clean.replace(/(-)\s/g, '\n$&'); // give new lines to the list

                  if(!section2String){
                    section2String.push(' ');
                  }

                  const reportString = "Reported by " + user + '\n\n####Steps to reproduce:' + section2String + '\n\n####Expected result:\n' + section3Clean + '\n####Actual result:\n' + combinedSections;

                  if(!!msg.attachments[0]){
                    attachment = msg.attachments[0].url;
                  }else{
                    attachment = undefined;
                  }

                  updateTrelloCard(trelloURL, attachment, channelID, reportString, '<@' + msg.author.id + '>', user);
                }else{
                  bot.createMessage(msg.channel.id, "<@" + msg.author.id + "> Please format the list correctly ` - item one - item two - item three (etc)`"); // need a better response
                }

              }else{
                bot.createMessage(msg.channel.id, "<@" + msg.author.id + "> I can’t find that issue in Trello. Please double check the URL.");
              }
            });
          }else{
            bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, please use the standard `!edit <URL> | <content>` format.");
          }
        }

    } // Edit an existing reports

    if(command.toLowerCase() === "!submit"){ // Submit a report
      var dev = msg.member.roles.indexOf(config.dev);
      var hunter = msg.member.roles.indexOf(config.hunter);
      var admin = msg.member.roles.indexOf(config.admin);

      if(dev > -1 || hunter > -1 || admin > -1){
        var splitter = msg.content.match(/\|/g);
        var joinedMessage = messageSplit.join(' ');

        const pipe = joinedMessage.indexOf("|");
        const header = joinedMessage.substr(0, pipe).trim();
        var report = joinedMessage.substr(pipe + 1).trim();

        var lowerCaseReport = report.toLowerCase();
        var matchFormat = lowerCaseReport.match(/\bsteps to reproduce|expected result|actual result/gi);

        if(!!splitter && splitter.length < 2 && !!matchFormat && matchFormat.length === 3 && matchFormat.indexOf('steps to reproduce') > -1 && matchFormat.indexOf('expected result')  > -1 && matchFormat.indexOf('actual result') > -1){

          t.get("/1/search/", { query: header}, function(errorQuery, searchedQuery) {

            if(!!searchedQuery.cards && searchedQuery.cards.length > 0){
              bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, It looks like that report already exists. <" + searchedQuery.cards[0].shortUrl + ">");
            }else{

              var attachment;

              var section2 = report.match(/(steps to reproduce)([\s\S]*)(?=expected result)/gi);
              var section3 = report.match(/(expected result)([\s\S]*)(?=actual result)/gi);

              var systemClient = lowerCaseReport.match(/\b(?:system setting)|\b(?:client version)/gi);

              if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('system setting') > -1){
                var section4 = report.match(/(actual result)([\s\S]*)(?=system setting)/gi);
                var section5 = report.match(/(system setting)([\s\S]*)/gi);

                var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                var section5Clean = section5[0].replace(/(System Setting(s)?(:)?)([\s\S]*)/gi, '$4');
                var combinedSections = section4Clean + "\n####System settings:\n" + section5Clean;
              }else if(!!systemClient && systemClient.length === 1 && systemClient.indexOf('client version') > -1){
                var section4 = report.match(/(actual result)([\s\S]*)(?=client version)/gi);
                var section5 = report.match(/(client version)([\s\S]*)/gi);

                var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');
                var section5Clean = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                var combinedSections = section4Clean + "\n####Client version:\n" + section5Clean;
              }else if(!!systemClient && systemClient.length === 2){

                var section4 = report.match(/(actual result)([\s\S]*)(?=client version)/gi);
                var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                if(systemClient[0] === "client version"){
                  var section5 = report.match(/(client version)([\s\S]*)(?=system setting)/gi);
                  var section5Clean = section5[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                  var section6 = report.match(/(system setting)([\s\S]*)/gi);
                  var section6Clean = section6[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                }else{
                  var section5 = report.match(/(system setting)([\s\S]*)(?=client version)/gi);
                  var section5Clean = section5[0].replace(/(system setting(s)?(:)?)([\s\S]*)/gi, '$4');
                  var section6 = report.match(/(client version)([\s\S]*)/gi);
                  var section6Clean = section6[0].replace(/(client version(s)?(:)?)([\s\S]*)/gi, '$4');
                }
                var combinedSections = section4Clean + "\n####System settings:\n" + section5Clean + "\n####Client version:\n" + section6Clean;
              }else{
                var section4 = report.match(/(actual result)([\s\S]*)/gi);

                var section4Clean = section4[0].replace(/(actual result(s)?(:)?)([\s\S]*)/gi, '$4');

                var combinedSections = section4Clean;
              }

              var section2Clean = section2[0].replace(/(steps to reproduce(s)?(:)?)([\s\S]*)/gi, '$4');
              var section3Clean = section3[0].replace(/(expected result(s)?(:)?)([\s\S]*)/gi, '$4');

              if(!section2){
                section2.push(' ');
              }else if(!section3){
                section3.push(' ');
              }else if(!section4){
                section4.push(' ');
              }

              if(section2[0].indexOf(' - ') > -1){

                var section2String = section2Clean.replace(/(-)\s/g, '\n$&'); // give new lines to the list

                if(!section2String){
                  section2String.push(' ');
                }

                const reportStringSubmit = "Reported by " + user + '\n\n####Steps to reproduce:' + section2String + '\n\n####Expected result:\n' + section3Clean + '\n####Actual result:\n' + combinedSections;

                bot.createMessage(msg.channel.id, "Header: " + header + "\n\n" + reportStringSubmit);

                if(!!msg.attachments[0]){
                  attachment = msg.attachments[0].url;
                }else{
                  attachment = undefined;
                }

                if(msg.channel.id === config.ios){
                  var listID = config.iosCard;
                  sendToTrello(listID, header, reportStringSubmit, msg.channel.id, attachment);

                }else if(msg.channel.id === config.android){
                  var listID = config.androidCard;
                  sendToTrello(listID, header, reportStringSubmit, msg.channel.id, attachment);

                }else if(msg.channel.id === config.canary){
                  var listID = config.canaryCard;
                  sendToTrello(listID, header, reportStringSubmit, msg.channel.id, attachment);

                }
              }else{
                bot.createMessage(msg.channel.id, "<@" + msg.author.id + "> Please format the list correctly ` - item one - item two - item three (etc)`"); // need a better response
              }

            }
          });
        }else{
          bot.createMessage(msg.channel.id, "<@" + msg.author.id + ">, you need to include `Steps to Reproduce:`, `Expected Results:` and `Actual Results:` in your report.");
        }
      }
    }
  }
});
function repro(status, user, clientInfo, channelID, trelloURL, userID){
  var sentRepro = function(error, data){
    if(!!error){
      bot.createMessage(channelID, "Something went wrong, please try again");
    }else{
      bot.createMessage(channelID, "<@" + userID + ">, your note has been added to the ticket.");
    }
  }
  var reproInfo = {
    text: status + clientInfo + "\n\n" + user
  }
  t.post("/1/cards/" + trelloURL + "/actions/comments", reproInfo, sentRepro);
}
function addAttachment(channelID, attachment, user, cardID, userID){

  var attachmentAdded = function(attachmentAddedErr, dataAttachment){
    if(!!attachmentAddedErr){
      bot.createMessage(channelID, "Something went wrong, please try again");
    }else{
      bot.createMessage(channelID, "<@" + userID + ">, your attachment has been added.");
    }
  }
  var addAttachment = {
    url: attachment,
    name: user
  }
  t.post('/1/cards/' + cardID + '/attachments', addAttachment, attachmentAdded);

}
function sendToTrello(listID, header, report, channelID, attachment){
  var creationSuccess = function(creationSuccessErr, data) {
    if(!!creationSuccessErr){
      console.log(creationSuccessErr);
    }
    if(!!attachment){
      var attachmentAdded = function(attachmentAddedErr, dataAttachment){
        if(!!attachmentAddedErr){
          console.log(attachmentAddedErr);
        }
        bot.createMessage(channelID, "Report added to Trello <" + data.shortUrl + ">");
      }
      var addAttachment = {
        url: attachment
      }
      t.post('/1/cards/' + data.id + '/attachments', addAttachment, attachmentAdded);
    }else{
      bot.createMessage(channelID, "Report added to Trello <" + data.shortUrl + ">");
    }
  };
  var newCard = {
    name: header,
    desc: report,
    idList: listID,
    pos: 'top'
  };
  t.post('/1/cards/', newCard, creationSuccess);
}
function updateTrelloCard(cardID, attachment, channelID, report, userID, userName){
  var cardUpdated = function(error, data){
    if(!!attachment){
      var attachmentAdded = function(attachmentAddedErr, dataAttachment){
        if(!!attachmentAddedErr){
          console.log(attachmentAddedErr);
        }
        bot.createMessage(channelID, userID + ", the Bug Report at <" + data.shortUrl + "> has been successfully updated.");
      }
      var addAttachment = {
        url: attachment,
        name: userName
      }
      t.post('/1/cards/' + data.id + '/attachments', addAttachment, attachmentAdded);
    }else{
      bot.createMessage(channelID, userID + ", the Bug Report at <" + data.shortUrl + "> has been successfully updated.");
    }
  }
  var updateCard = {
    value: report
  }
  t.put('/1/cards/' + cardID + '/desc', updateCard, cardUpdated);
}
bot.connect();
