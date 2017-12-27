var conf = require('./config.js');
var request = require('request');
var mqtt = require('mqtt');
var  _toniState = [];
var _map = _buildMap(conf);
var _initC = false;
var _jsonRpcId = 0;

var client  = mqtt.connect('mqtt://'+conf.broker.address); 
client.on('connect', function () {  
    if(_initC == false){
        _initC = true;
        _initF();
    }    
});
 
client.on('message', function (topic, message) {
  message = message.toString();
  console.log('mqtt.message',topic, message);    

  var obj = _mqttTopic2Cmnd(topic, message);
  if(obj != false){
    _sendHttpRequest(obj.toniCmd, obj.body);
  }  
});

client.on('error', function (error) {
    console.log('mqtt.error', error);  
  })

function _initF()
{    
    _toniState = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100];
    _mqttSubscribe();    
    setInterval(_publishTasker,conf.client.publishInterval);
    setInterval(_updateTasker,conf.toniManero.updateInterval);
    console.log("Init...Ok!");
}

function _mqttSubscribe()
{
    var topic = _getTopicByAction('ON');
    if(topic != false){
        for(channel in _toniState)
        {
            var topic_ = topic.replace('%channel%', channel);
            client.subscribe(topic_);                            
            console.log('_mqttSubscribe()', topic_);
        }
    }    
}

function _mqttTopic2Cmnd(topic, message)
{
    var request = JSON.parse(message);
    var split = topic.split('/');
    var action = _getActionByRequest(message);
    var entry = _getCmdByAction(action);
    var channel = _getTopicArgument('channel', topic, entry.mqttTopic);

    if(channel !== false){
        if(request['brightness'] != undefined){
            var int = (request['brightness'] / 2.55).toFixed(0);
            entry.toniPostBody.params.dutty = parseInt(int,10);
        } 
        entry.toniPostBody.params.channel = parseInt(channel,10);
        entry.toniPostBody.id = _jsonRpcId++;
        var obj = {toniCmd: entry.toniCmd, body:JSON.stringify(entry.toniPostBody)};
        return obj; 
    }
    return false;
}
function _getTopicArgument(argument, topic, template)
{
    var split_ = template.split('/');
    var split = topic.split('/');   //OSLL: The template must have the exact sintax of the received topic
    argument = '%' + argument + '%';
    for(var pos in split_){
        var index = parseInt(pos,10);
        if(split_[index] == argument) return split[index];            
    }
    return false;
}

    
function _publishTasker()
{
    _publishState();
}

function _updateTasker()
{
    var entry = _getCmdByAction('UPDATE');  
    if(entry != false){ 
        entry.toniPostBody.id = _jsonRpcId++;
        var body = JSON.stringify(entry.toniPostBody);
        _sendHttpRequest(entry.toniCmd, body);
    }  
}

function _publishState()
{
    var topic = _getTopicByAction('UPDATE');
    if(topic != false){
        for(channel in _toniState)
        {
            var topic_ = topic.replace('%channel%', channel);
            var state = _getState(parseInt(channel,10));
            client.publish(topic_, state, conf.mqtt.options);
            //console.log('_publishState()', topic_, state, conf.mqtt.options);
        }
    }    
}

function _sendHttpRequest(command, body){    
    var uri = 'http://' + conf.toniManero.address + ':' + conf.toniManero.port + command;
    console.log(' _sendHttpRequest(command, body)', uri, body);
    var options = {
        uri: uri,
        encoding: 'utf8',
        body: body 
    }
    request.post(options, _onHttpRequest);
}

function _onHttpRequest(error, response, body) {
    if(response && response.statusCode)
    {        
        switch(response.statusCode)
        {
            case 200:            
                _decodeToniReply(body);
                break;
        }
    }
}

function _decodeToniReply(body)
{
    console.log(' _decodeToniReply(body)',body);    
    body = JSON.parse(body);
    _toniState = body.result.duttyArray;    
    
}

function _setState(channel, dutty)
{
    _toniState[channel] = dutty;
    console.log('_setState(channel, dutty)', channel, dutty);
}

function _getState(channel)
{
    var body = _getCmdByAction('UPDATE');
    if(body != false){
        body = body.mqttBody;
        body.brightness = _toniState[channel] * 2.55;
        body.brightness = body.brightness.toFixed(0);
        body.state = (_toniState[channel] == 0)?'OFF':'ON';
        return JSON.stringify(body);
    }
    return false;
}

function _getActionByRequest(message)
{
    message = JSON.parse(message);
    if(message.brightness != undefined) return 'BRIGTHNESS';
    else if(message.state != undefined) return message.state;
    return false;
}

function _getTopicByAction(action)
{
    for(entry of _map)
    {
        if(entry.action == action) return entry.mqttTopic;
    }   
    console.log('_getTopicByAction(action) -> Not found', action);
    return false;
}

function _getCmdByAction(action)
{
    for(entry of _map)
    {
        if(entry.action == action) return entry;
    }   
    console.log('_getCmdByAction(action) -> Not found', action);
    return false;
}

function _buildMap(config)
{
    var map = []    ;
    for(entry of config.map)
    {        
        entry.mqttTopic = entry.mqttTopic.replace('%clientName%',config.client.clientName);
        map.push(entry);
    }

    console.log(map);
    return map;
}



