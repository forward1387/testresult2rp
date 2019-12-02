'use strict';

const RPClient = require('reportportal-client'),
  _ = require('underscore'),
  {log} = require('./logger'),
  fs = require('fs');

let sendStep = async(client, lunchId, containerId, step) => {
  if(!step.name && !step.embeddings) {return;} 

  let stepItem = await client.startTestItem({
    type: 'STEP',
    name: `${step.keyword} ${step.name ? step.name : ''}`
  }, lunchId, containerId);
  log.debug(`Step Started: ${step.keyword} ${step.name ? step.name : ''}(id=${stepItem.tempId})`);  

  return stepItem.promise.then(() => {
    log.debug(`Step Finished: ${step.keyword} ${step.name ? step.name : ''}(id=${stepItem.tempId})`);
    return client.finishTestItem(stepItem.tempId, {
      status: step.result.status
    }).promise;
  }).then(() => {
    if (step.result.status.toLowerCase() === 'failed') {
      return client.sendLog(stepItem.tempId, {
        message: step.result.error_message,
        status: 'error'
      }); 
    }else if(step.embeddings) {
      let attachment = step.embeddings[0];

      if (attachment.mime_type === 'image/png') {
        return client.sendLog(stepItem.tempId, {}, {
          name: step.keyword,  
          type: attachment.mime_type,
          content: attachment.data
        });
      } else {
        return client.sendLog(stepItem.tempId, {
          message: attachment.data,
          status: 'info'
        });
      } 
    }
  });
};

let sendScenario = async(client, lunchId, containerId, scenario) => {
  let scenarioItem = await client.startTestItem({
    type: 'TEST',
    name: scenario.name
  }, lunchId, containerId);
  log.debug(`Scenario Started: ${scenario.name}(id=${scenarioItem.tempId})`);  

  let stepFlow = scenarioItem.promise;
  let status = 'PASSED';
  for (let step of scenario.steps) {
    if(step.result.status === 'failed') {status = 'FAILED';}
    stepFlow = stepFlow.then(() => sendStep(client, lunchId, scenarioItem.tempId, step));
  }
  return stepFlow.then(() => {
    log.debug(`Scenario Finished: ${scenario.name}(id=${scenarioItem.tempId})`);  
    return client.finishTestItem(scenarioItem.tempId, {
      status: status
    }).promise.then(() => status);
  });
};
 
let sendFeature = async(client, lunchId, feature) => {
  let featureItem = await client.startTestItem({
    type: 'STORY',
    name: feature.id
  }, lunchId);

  return featureItem.promise.then(() => {
    log.debug(`Feature Started: ${feature.id}(id=${featureItem.tempId})`);  
    return Promise.all(
      _.map(feature.elements, (scenario) => sendScenario(client, lunchId, featureItem.tempId, scenario))
    );
  }).then((status) => {
    let st = 'PASSED';
    _.forEach(status, (stat) => {
      if(stat.toLowerCase() === 'failed') {st = 'FAILED';}
    });  
    log.debug(`Feature Finished: ${feature.id}(id=${featureItem.tempId})`); 
    return client.finishTestItem(featureItem.tempId, {
      status: st
    }).promise;
  });
};


let sendResults = async(client, report, config) => {
  await client.checkConnect();

  let launchObj = client.startLaunch({
    name: config.launch,
    description: 'lunch for testing send report'
    //tags: ["tag1", "tag2"],
    //this param used only when you need client to send data into the existing launch
    //id: 'id'
  });

  return launchObj.promise.then(() => {
    log.debug(`Lunch Started: ${config.launch}(id=${launchObj.tempId})`);  
    return Promise.all(_.map(report, (feature) => sendFeature(client, launchObj.tempId, feature))); 
  }).then(() => {
    log.debug(`Lunch Finished: ${config.launch}(id=${launchObj.tempId})`);  
    return client.finishLaunch(launchObj.tempId, {
      status: 'STOPPED'
    }).promise;
  });
};

exports.parseAndSendCucumberResults = async(argv) => {
  let config = {token: argv.token, endpoint: argv.endpoint, launch: argv.launch, project: argv.project, mode: argv.mode},
    client = new RPClient(config),
    report = JSON.parse(fs.readFileSync(argv.f, 'utf-8'));

  return sendResults(client, report, config);
};