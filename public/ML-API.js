var http = require("http");
var https = require("https");
var querystring = require("querystring");
var fs = require('fs');

function getPred(data) {
	var dataString = JSON.stringify(data)
	var host = 'ussouthcentral.services.azureml.net'
	var path = '/workspaces/28e0446f7f3f475083aef3186ce5e9b1/services/23160a643d124e87974fee18d2572197/execute?api-version=2.0&format=swagger'
	var method = 'POST'
	var api_key = 'H36SNAlOQpz19IIIAcgFcbO6nrSdFrk8ieqMe/QIi3+dqx66tyqJyM36Ykm4Ua0QuRlc8WFqLuNnEG9vQiSzTA=='
	var headers = {'Content-Type':'application/json', 'Authorization':'Bearer ' + api_key};
	var options = {
		host: host,
		port: 443,
		path: path,
		method: 'POST',
		headers: headers
};
	var reqPost = https.request(options, function (res) {
		res.on('data', function(d) {
           console.log(d.toString("utf8"))
        });
	});
	reqPost.write(dataString);
	reqPost.end();
	reqPost.on('error', function(e){
		console.error(e);
		});
}

 

//Could build feature inputs from web form or RDMS. This is the new data that needs to be passed to the web service.

function buildFeatureInput(data1,data2){
	// console.log('===performRequest()===');
    data1new=[]
    data2new=[]
    for(var i=0;i<data1.length;i++){
        data1new.push(JSON.parse(data1[i]))
    }
    for(var i=0;i<data2.length;i++){
        data2new.push(JSON.parse(data2[i]))
    }

	var data = {
        "Inputs": {
                "input1":data1new
                ,
                "input2":data2new
                ,
        },
    "GlobalParameters":  {
    }
}
	// getPred(data);
    var dataString = JSON.stringify(data)
    var host = 'ussouthcentral.services.azureml.net'
    var path = '/workspaces/28e0446f7f3f475083aef3186ce5e9b1/services/23160a643d124e87974fee18d2572197/execute?api-version=2.0&format=swagger'
    var method = 'POST'
    var api_key = 'H36SNAlOQpz19IIIAcgFcbO6nrSdFrk8ieqMe/QIi3+dqx66tyqJyM36Ykm4Ua0QuRlc8WFqLuNnEG9vQiSzTA=='
    var headers = {'Content-Type':'application/json', 'Authorization':'Bearer ' + api_key};
    var options = {
        host: host,
        port: 443,
        path: path,
        method: 'POST',
        headers: headers
};
    var reqPost = https.request(options, function (res) {
        res.on('data', function(d) {
           console.log(d.toString("utf8"))
        });
    });
    reqPost.write(dataString);
    reqPost.end();
    reqPost.on('error', function(e){
        console.error(e);
        });

}
module.exports = {
    mlApi : buildFeatureInput,
}