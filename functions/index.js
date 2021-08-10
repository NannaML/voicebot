// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
var admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://voicebot-319308-default-rtdb.europe-west1.firebasedatabase.app'
});


process.env.DEBUG = 'dialogflow:debug';

exports.dialogflowFirebaseFulfillment = functions.region('europe-west3').https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add(`Hej, velkommen til din golf caddie.`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function getAgentDistanceHandler(agent) {
    var distance = agent.parameters.unitlength.amount;
    var unit = agent.parameters.unitlength.unit;

    return admin.database().ref('NannaBachMunkholm').once("value").then((snapshot) => {
        //var keys = Object.keys(snapshot.val());
        var object = snapshot.val();
        var distances = Object.values(object);
       
        var closest = distances.reduce(function (prev, curr) {
                  return (Math.abs(curr - distance) < Math.abs(prev - distance) ? curr : prev);
              });
        var iron =  Object.keys(object).find(key => object[key] === closest);
        agent.add(`For at slå ${distance} ${unit}, vil jeg anbefale et ${iron}, da du i gennemsnittet slår ${closest} ${unit} med det jern.`);
      });


  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('get-target-distance-followup', getAgentDistanceHandler);

  agent.handleRequest(intentMap);
});