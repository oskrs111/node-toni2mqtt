module.exports = {
    client:{
        clientName: 'toni',
        publishInterval: 5000
    },
    
    toniManero:{
		port: 80,		
        address: '127.0.0.1',
        updateInterval: 6000
    },
    
    broker:{
		port: 1883,		
		address: '127.0.0.1'
    },

    mqtt:{
        options: {
            qos: 1,
            retain: true,
            dup: false
        }
    },
	
	map:[
	{
        toniCmd:'/json.rpc',
        toniMethod: 'POST',
        toniPostBody: {jsonrpc:"2.0",method:"pca9685GetAll",id:0},
        mqttTopic:'stat/%clientName%/channel/%channel%/PWM',
        mqttBody: {brightness: 0, state: "OFF"},
        action: 'UPDATE'
    },

	{
        toniCmd:'/json.rpc',
        toniMethod: 'POST',
        toniPostBody: {jsonrpc:"2.0",method:"pca9685Set",params:{channel: 0, dutty: 0},id:0},
        mqttTopic:'cmnd/%clientName%/channel/%channel%/PWM', //{"state": "OFF"}
        action: 'OFF'
    },
    
    {
        toniCmd:'/json.rpc',
        toniMethod: 'POST',
        toniPostBody: {jsonrpc:"2.0",method:"pca9685Set",params:{channel: 0, dutty: 100},id:0},
        mqttTopic:'cmnd/%clientName%/channel/%channel%/PWM', //{"state": "ON"}
        action: 'ON'
    },
    
    {
        toniCmd:'/json.rpc',
        toniMethod: 'POST',
        toniPostBody: {jsonrpc:"2.0",method:"pca9685Set",params:{channel: 0, dutty: 0},id:0},
        mqttTopic:'cmnd/%clientName%/channel/%channel%/PWM', //{"brightness": 75, "state": "ON"}
        action: 'BRIGTHNESS'
	}    
       
	]
};