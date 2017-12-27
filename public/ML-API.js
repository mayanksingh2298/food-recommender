var http = require("http");
var https = require("https");
var querystring = require("querystring");
var fs = require('fs');

function getPred(data) {
	// console.log('===getPred()===');
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
	// console.log('data: ' + data);
	// console.log('method: ' + method);
	// console.log('api_key: ' + api_key);
	// console.log('headers: ' + headers);
	// console.log('options: ' + options);

	var reqPost = https.request(options, function (res) {
		// console.log('===reqPost()===');
		// console.log('StatusCode: ', res.statusCode);
		// console.log('headers: ', res.headers);
		res.on('data', function(d) {
			process.stdout.write(d);
		});
	});
	// Would need more parsing out of prediction from the result
	reqPost.write(dataString);
	reqPost.end();
	reqPost.on('error', function(e){
		console.error(e);
		});
}

 

//Could build feature inputs from web form or RDMS. This is the new data that needs to be passed to the web service.

function buildFeatureInput(){
	// console.log('===performRequest()===');
	var data = {
        "Inputs": {
                "input1":
                [
                    {
                            'Indian': "10",   
                            'Chinese': "4",   
                            'Italian': "3",   
                            'Smoke': "1",   
                            'AC': "8",   
                            'drink': "1",   
                            'Rating': "5",   
                    },
                    {
                            'Indian': "1",   
                            'Chinese': "6",   
                            'Italian': "7",   
                            'Smoke': "8",   
                            'AC': "10",   
                            'drink': "9",   
                            'Rating': "1",   
                    },
                    {
                            'Indian': "7",   
                            'Chinese': "8",   
                            'Italian': "7",   
                            'Smoke': "10",   
                            'AC': "8",   
                            'drink': "9",   
                            'Rating': "2",   
                    },
                ],
                "input2":
                [
                    {
                            'Indian': "8",   
                            'Chinese': "2",   
                            'Italian': "3",   
                            'Smoke': "1",   
                            'AC': "7",   
                            'drink': "1",   
                    },
                    {
                            'Indian': "3",   
                            'Chinese': "6",   
                            'Italian': "7",   
                            'Smoke': "7",   
                            'AC': "7",   
                            'drink': "7",   
                    },
                    {
                            'Indian': "8",   
                            'Chinese': "5",   
                            'Italian': "6",   
                            'Smoke': "8",   
                            'AC': "10",   
                            'drink': "9",   
                    },
                    {
                            'Indian': "10",   
                            'Chinese': "0",   
                            'Italian': "0",   
                            'Smoke': "0",   
                            'AC': "10",   
                            'drink': "0",   
                    }
                ],
        },
    "GlobalParameters":  {
    }
}
	getPred(data);
}
function send404Reponse(response) {
	response.writeHead(404, {"Context-Type": "text/plain"});
	response.write("Error 404: Page not Found!");
	response.end();
}

function onRequest(request, response) {
	if(request.method == 'GET' && request.url == '/' ){
		response.writeHead(200, {"Context-Type": "text/plain"});
		fs.createReadStream("./index.html").pipe(response);
	}else {
		send404Reponse(response);
	}
}

// http.createServer(onRequest).listen(8050);
// console.log("Server is now running on port 8050");
buildFeatureInput();