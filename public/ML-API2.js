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


var data = {
        "Inputs": {
                "input1":
                [
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
                ],
                "input2":
                [
                    {
                     "Air Conditioned": "1", 
                     "American": "2", 
                     "Asian": "2", 
                     "Barbeque and Grill": "0", 
                     "Cards Accepted": "0", 
                     "Chinese": "2", 
                     "Coastal": "0", 
                     "Coffee": "1", 
                     "Continental": "0", 
                     "DJ": "1", 
                     "Dance Floor": "1", 
                     "Differently Abled Friendly": "1", 
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
                     "North Indian": "0", 
                     "Oriental": "0", 
                     "Outdoor Seating": "1", 
                     "Parking": "0", 
                     "Roof Top": "1", 
                     "Seafood": "0", 
                     "Smoking Area": "1", 
                     "Take Away": "0", 
                     "Thai": "0", 
                     "Wifi": "0"
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