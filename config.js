var config = {
  botID: '240545475118235648',                //bot's user ID
  DTserverID: '197038439483310086',           //iscord Testers server ID

  channels: {
    iosChannel: '202491590390841344',         //ios text Channel
    androidChannel: '232568032394870784',     //android text Channel
    canaryChannel: '197038744908333066',      //canary text Channel
    linuxChannel: '238073742624948225',       //linux text Channel
    modLogChannel: "241625778368806912",      //mod log text Channel
    bugHunterChannel: '217764019661045761',   //bug hunter text Channel
    queueChannel: '253923313460445184',       //bug approval text channel
    allChannels: 'allChannels'                //fake channel for everyone
  },

  roles: {
    devRole: '197042389569765376',            //dev role
    hunterRole: '197042209038663680',         //bug hunter role
    adminRole: '197042322939052032',          //admin role
    androidAlphaRole: '234838349800538112',   //android alpha role
    iosTestflightRole: '234838392464998402',  //ios testflight role
    linuxTesterRole: '278229255169638410',    //linux role
    trelloModRole: '197400761104203776',      //trello mod role
    everybodyRole: 'everybody'                //fake role for everyone
  },

  cards: {
    iosCard: '57fd4af58042f56c271d46b3',      //ios user report card
    androidCard: '57f2a30d861fa9b5816c9717',  //android user report card
    canaryCard: '5771677fda45a436c5b8d255',   //canary user report card
    linuxCard: '5846f9f1c7b3c505ea4a56be'     //linux user report card
  },

  emotes: {
    greenTick: '312314752711786497',          //green tick emote ID
    redTick: '312314733816709120'             //red tick emote ID
  }
}
module.exports = config;
