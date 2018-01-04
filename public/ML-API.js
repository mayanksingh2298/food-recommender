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
            // console.log(d.toString("utf8"))
			// process.stdout.write(d+"\n");
           console.log(d.toString("utf8"))
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
module.exports = {
    mlApi : buildFeatureInput,
    test : test
}
data1=[
                    {
                     "Air Conditioned": "1", 
                     "American": "2", 
                     "Asian": "0", 
                     "Barbeque and Grill": "0", 
                     "Cards Accepted": "1", 
                     "Chinese": "2", 
                     "Coastal": "0", 
                     "Coffee": "0", 
                     "Continental": "0", 
                     "DJ": "1", 
                     "Dance Floor": "1", 
                     "Differently Abled Friendly": "0", 
                     "Fast Food": "0", 
                     "Games": "0", 
                     "Health Food": "0", 
                     "Home Delivery": "1", 
                     "Hookah": "1", 
                     "Italian": "2", 
                     "Japanese": "0", 
                     "Lebanese": "0", 
                     "Lift": "1", 
                     "Malaysian": "0", 
                     "Mediterranean": "0", 
                     "Mexican": "0", 
                     "Mughlai": "0", 
                     "Multi-Cuisine": "0", 
                     "North Indian": "2", 
                     "Oriental": "0", 
                     "Outdoor Seating": "1", 
                     "Parking": "0", 
                     "Roof Top": "1", 
                     "Seafood": "0", 
                     "Smoking Area": "1", 
                     "Take Away": "1", 
                     "Thai": "0", 
                     "Wifi": "0",
                     "Rating": "5"
                  }
                ]
data2=[{"Air Conditioned":"1","American":"0","Asian":"0","Barbeque and Grill":"0","Cards Accepted":"0","Chinese":"0","Coastal":"0","Coffee":"0","Continental":"0","DJ":"0","Dance Floor":"0","Differently Abled Friendly":"0","Fast Food":"0","Games":"0","Health Food":"0","Home Delivery":"1","Hookah":"0","Italian":"2","Japanese":"0","Lebanese":"0","Lift":"0","Malaysian":"0","Mediterranean":"0","Mexican":"0","Mughlai":"0","Multi-Cuisine":"0","North Indian":"0","Oriental":"0","Outdoor Seating":"0","Parking":"1","Roof Top":"0","Seafood":"0","Smoking Area":"0","Take Away":"1","Thai":"0","Wifi":"0"}

                ]
// buildFeatureInput(data1,data2);
function test(x){
    console.log(x)
}