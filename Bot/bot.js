/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/
var http = require("http");
var https = require("https");
var querystring = require("querystring");
var fs = require('fs');

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var MainUser = undefined;
// var GroupUser = undefined;

var mongoose 				= require('mongoose'),
    bodyParser 				= require("body-parser"),
    User					= require("../models/user"),
    outlets					= require("../scrape/output.json")
    methodOverride          = require("method-override"),
    azureML                 = require("../public/ML-API.js")

// mongoose.connect("mongodb://localhost/foodrecos");
mongoose.connect("mongodb://imagine:123@ds054118.mlab.com:54118/foodreco-imagine-test");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
var inMemoryStorage = new builder.MemoryBotStorage();
// var useEmulator = (process.env.NODE_ENV === 'development');
// var Finalstorage;
// console.log(useEmulator);
// if(useEmulator){
// 	Finalstorage = inMemoryStorage;
// }else{
// 	Finalstorage = tableStorage;
// }

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', inMemoryStorage);

var friendsYesNo = false;
var haveFriendsYesNo = false;
var combinedYesNo = false;
var inNothing = false;
var users = [];

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/313572bf-d67d-4bd1-bc70-cde449f43ae2?subscription-key=2c7627c91a234133bf23a24cfb15a021&verbose=true');
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

intents.matches('Greeting', (session) => {
    if(!session.userData.name) {
		session.send("Hi! My name is Frudo. I am your Food Assistant.");
    	session.beginDialog('GetUsername');
    } else {
	    session.send("Hi! " + session.userData.name);
    	users.push(session.userData.name);
	    session.send("How may I help you?");    	
    }
});

//-------------------------------------------------------------Done
intents.matches('Help', (session) => {
    session.beginDialog('Help');
});
//-------------------------------------------------------------Done
intents.matches('Cancel', (session) => {
    session.send("Hope you liked my service. Thanks!");
});

intents.matches('Recommend', (session) => {
	session.beginDialog('RecommendRestaurant');
});
intents.matches('RateRestaurants', (session) => {
	session.beginDialog('RateRestaurants');
});
intents.matches('Yes', (session) => {
	if (friendsYesNo) {
		session.send("Please continue if you know the usernames of your friends.");
		session.send("Continue? Yes/No.");
		friendsYesNo = false;
		haveFriendsYesNo = true;
	}
	else if(haveFriendsYesNo) {
		session.beginDialog('Combined');
		// haveFriends to be false in dialog-----------------------------------------------Done
	}
});
intents.matches('No', (session) => {
	if(combinedYesNo) {
		haveFriendsYesNo = false;
		if(users.length!=1) {
			session.send("Here are your combined recommendations");
			GetGroupRecommendations(MainUser,users,session);
			// Display recommendation combined------------------------------------------------
		}else{
			session.beginDialog('Nothing');
		}
	}
	if(inNothing) {
		inNothing = false;
		session.send("Hope you liked my service. Thanks!");
	}
	else {
		session.beginDialog('Nothing');
	}
})
intents.onDefault((session) => {
    session.send('Sorry, I did not understand that. :(');
    session.send('But here are the things I can do for you.')
    session.beginDialog('Help');
});

var intent_Dialog = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', intents);    


bot.dialog('RateRestaurants', [
   	function (session) {
   		session.send("For security reasons, you can rate restaurants on our webapp only.");
   		session.send("Please follow [this](http://www.iitd.ac.in) link to register yourself and/or rate restaurants");
   		session.beginDialog('Nothing');
    }
]);

bot.dialog('RecommendRestaurant', [
    function (session) {
    	var validUser = false;
    	builder.Prompts.attachment(session, "Please send me your location. Just click on + icon and click the location icon to share location.");
    },function (session,results) {
	    console.log(results.response);
	    var latitude = results.response.attachments[0].payload.coordinates.lat;
	    var longitude = results.response.attachments[0].payload.coordinates.long;
	    $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?latlng="+position.coords.latitude+","+position.coords.longitude+"&key=AIzaSyD5Rds-FEP3YaTUZ4H5R22wR7WACcua1f4",function(data){
	        session.send("Sure. I advice you to try these restaurants.");
		    if(!session.userData.name){
		    	getPersonalisedRatings(MainUser,session); // ---------------------------
		    }else{
		    	MainUser.location.latitude = latitude;
		    	MainUser.location.longitude = longitude;
		    	MainUser.location.name = data.results[0].formatted_address;
	    		User.findByIdAndUpdate(MainUser.id,MainUser,function(err,updatedUser){
					if(err){
						res.send("Server error");
					}
					else{
						getPersonalisedRatings(MainUser,session);
					}
				} );
			}
      	})
    },
]);

bot.dialog('Combined', [
	function (session) {
		builder.Prompts.text(session, "Enter the username of your friend.");
	},
	function (session, results) {
		var username = results.response;
		User.findOne({username: new RegExp('^'+username+'$',"i")},function(err,foundUser){
			MainUser = foundUser;
			if(err){
				session.send("Some database error has occured. Please try again");
			}else{
				if(!foundUser /*false Check username in database------------------------------------------done*/) {
					session.send("Sorry. This username does not exist.");
				}
				else {
					users.push(username);
				}
				session.send("Continue with more friends?");
				combinedYesNo = true;
			}
			session.beginDialog('/');
		});
	}
]);

bot.dialog('Help', [
	function (session, args, next) {
		var msg = new builder.Message(session)
		.text("Here are the things I can do for you.")
		.suggestedActions(
		builder.SuggestedActions.create(
			session, [
				builder.CardAction.imBack(session, "Personal Recommendations", "Personal Recommendations"),
				builder.CardAction.imBack(session, "Group Recommendations", "Group Recommendations"),
				builder.CardAction.imBack(session, "Rate Restaurants", "Rate Restaurants"),
				builder.CardAction.imBack(session, "Introduction", "Introduction")
			]
		));
		builder.Prompts.text(session, msg);
	},
	function (session, results) {
		var response = results.response;
		switch(response){
            case "Personal Recommendations":
            	console.log("1");
                session.beginDialog('RecommendRestaurant');
                break;
            case "Group Recommendations":
                console.log("2");
                session.beginDialog('Combined');
                break;
            case "Rate Restaurants":
            	console.log("3");
                session.beginDialog('RateRestaurants');
                break;
            case "Introduction":
            	console.log("4");
                session.beginDialog('GetUsername');
                break;
        }
        session.beginDialog('/');
	}
]);

bot.dialog('GetUsername', [
	function (session) {
		session.send("I'm your personalised restaurant recommending system. I can learn your taste and recommend you the best restaurants nearby accordingly. To get started, please register [here](http://www.iitd.ac.in) so that I can know you.");
		builder.Prompts.text(session, "Please provide me your username. If you don't have a username yet please register yourself [here](https://www.iitd.ac.in)"); //---------------------
	},
	function (session, results) {
		var username = results.response;
		User.findOne({username: new RegExp('^'+username+'$',"i")},function(err,foundUser){
			if(err){
				session.send("Some database error has occured. Please try again");
			}else{
				if(foundUser /*false Check username in database------------------------------------------done*/) {
					MainUser = foundUser;
					session.userData.name = results.response;
					users.push(session.userData.name);
					session.send("How may I help you?");
					session.beginDialog('/');
				}
				else {
					session.send("Sorry. This username does not exist. However, I can provide you general recommendations as well.");
					session.send("To get personalized recommendations, please register yourself [here](http://www.iitd.ac.in)"); //----------------------------------
					session.beginDialog('Nothing');
				}
			}
		});
	}
]);

// Here's the nothing dialog, to be run when no other dialog is required
bot.dialog('Nothing', [
	function (session) {
		inNothing = true;
		session.send("Is there anything else I can do for you?");
		session.beginDialog('/');
	}
]);


function getPersonalisedRatings(req,res){
	var learnt=[]
	var toLearn=[]
	var toLearnInd=[]
	var predictedData=[]
	var ratings = req.ratings
	if (req.noOfRated<4){
		res.send("It seems that you haven't rated enough restaurants to generate a personalised experience. Please visit [here](https://www.iitd.ac.in) and rate some more restaurants.");//---------------------------------
		res.beginDialog('/');
	}else{
		for(var i=0;i<outlets.length;i++){
			if(ratings[i]==null){
				toLearn.push(JSON.stringify(outlets[i].featureVector))
				toLearnInd.push(i)
			}else{
				tmp = outlets[i].featureVector
				tmp["Rating"]=ratings[i]
				console.log(tmp["Rating"]+"***")
				tmp =JSON.stringify(tmp)
				learnt.push(tmp)
			}
		}

		data1new=[]
	    data2new=[]
	    for(var i=0;i<learnt.length;i++){
	        data1new.push(JSON.parse(learnt[i]))
	    }
	    for(var i=0;i<toLearn.length;i++){
	        data2new.push(JSON.parse(toLearn[i]))
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
	    var reqPost = https.request(options, function (res2) {
	        res2.on('data', function(d) {
	            predictedData = JSON.parse(d.toString("utf8"))["Results"]["output1"]
	       		sortedArray=[]
	       		maxDiff=0
	       		maxRate=0
	       		for (var i=0;i<predictedData.length;i++){//to get max to scale them
	       			tmpLatLong = outlets[toLearnInd[i]]["lat,long"].split(",")
	       			tmpLat = tmpLatLong[0]
	       			tmpLong = tmpLatLong[1]
	       			diff = Math.abs(req.location.latitude-tmpLat)+Math.abs(req.location.longitude-tmpLong)
	       			maxDiff	= Math.max(maxDiff,diff)
	       			predRate = Number(predictedData[i]["Scored Labels"])
	       			maxRate = Math.max(maxRate,predRate)
	       		}
	       		for (var i=0;i<predictedData.length;i++){
	       			tmpLatLong = outlets[toLearnInd[i]]["lat,long"].split(",")
	       			tmpLat = tmpLatLong[0]
	       			tmpLong = tmpLatLong[1]
	       			diff = Math.abs(req.location.latitude-tmpLat)+Math.abs(req.location.longitude-tmpLong)
	       			predRate = Number(predictedData[i]["Scored Labels"])
	       			sortedArray.push([-diff/maxDiff+predRate/maxRate,predRate,toLearnInd[i]])
	       		}
	       		sortedArray.sort()
	       		sortedArray.reverse()
	       		sortedArray = sortedArray.splice(0,8)
	       		session = res;
	       		// console.log(req.noOfRated)
				// res.send("profile",{ratings:ratings,learntData:sortedArray,location:req.location});
				var msg = new builder.Message(session);
			    msg.attachmentLayout(builder.AttachmentLayout.carousel)
			    msg.attachments([
			        new builder.HeroCard(session)
			            .title(outlets[sortedArray[0][2]].name)
			            .subtitle("Best Cuisines: " + outlets[sortedArray[0][2]].cuisine)
			            .text("Address : " + outlets[sortedArray[0][2]].address)
			            .images([builder.CardImage.create(session, outlets[sortedArray[0][2]].img)]),
			        new builder.HeroCard(session)
			            .title(outlets[sortedArray[1][2]].name)
			            .subtitle("Best Cuisines: " + outlets[sortedArray[1][2]].cuisine)
			            .text("Address : " + outlets[sortedArray[1][2]].address)
			            .images([builder.CardImage.create(session, outlets[sortedArray[1][2]].img)]),
			        new builder.HeroCard(session)
			            .title(outlets[sortedArray[2][2]].name)
			            .subtitle("Best Cuisines: " + outlets[sortedArray[2][2]].cuisine)
			            .text("Address : " + outlets[sortedArray[2][2]].address)
			            .images([builder.CardImage.create(session, outlets[sortedArray[2][2]].img)]),
			        new builder.HeroCard(session)
			            .title(outlets[sortedArray[3][2]].name)
			            .subtitle("Best Cuisines: " + outlets[sortedArray[3][2]].cuisine)
			            .text("Address : " + outlets[sortedArray[3][2]].address)
			            .images([builder.CardImage.create(session, outlets[sortedArray[3][2]].img)]),			            
			        new builder.HeroCard(session)
			            .title(outlets[sortedArray[4][2]].name)
			            .subtitle("Best Cuisines: " + outlets[sortedArray[4][2]].cuisine)
			            .text("Address : " + outlets[sortedArray[4][2]].address)
			            .images([builder.CardImage.create(session, outlets[sortedArray[4][2]].img)]),
			        new builder.HeroCard(session)
			            .title(outlets[sortedArray[5][2]].name)
			            .subtitle("Best Cuisines: " + outlets[sortedArray[5][2]].cuisine)
			            .text("Address : " + outlets[sortedArray[5][2]].address)
			            .images([builder.CardImage.create(session, outlets[sortedArray[5][2]].img)]),
			        new builder.HeroCard(session)
			            .title(outlets[sortedArray[6][2]].name)
			            .subtitle("Best Cuisines: " + outlets[sortedArray[6][2]].cuisine)
			            .text("Address : " + outlets[sortedArray[6][2]].address)
			            .images([builder.CardImage.create(session, outlets[sortedArray[6][2]].img)]),
			        new builder.HeroCard(session)
			            .title(outlets[sortedArray[7][2]].name)
			            .subtitle("Best Cuisines: " + outlets[sortedArray[7][2]].cuisine)
			            .text("Address : " + outlets[sortedArray[7][2]].address)
			            .images([builder.CardImage.create(session, outlets[sortedArray[7][2]].img)]),
			    ]);
			    session.send(msg);
	    	    session.send("Are you going out with some friends? I can recommend you the best place according to your common taste.");
			    friendsYesNo = true;
			    session.beginDialog('/');
	        });
	    });
	    reqPost.write(dataString);
	    reqPost.end();
	    reqPost.on('error', function(e){
	        console.error(e);
	        });
	}
}


function GetGroupRecommendations(req,friends,res){
	session = res;
	var actualFriends=[req.username]
	var avgRatings=req.ratings
	counter=0
	for(var i=0;i<friends.length;i++){
		User.findOne({username:new RegExp('^'+friends[i]+'$',"i")},function(err,foundUser){	
			counter++
			if(foundUser){
				actualFriends.push(foundUser.username)
				for(var j=0;j<foundUser.ratings.length;j++){
					console.log(foundUser.ratings[j]+"*")
					if(!foundUser.ratings[j])
						continue
					else if(foundUser.ratings[j] && !avgRatings[j])
						avgRatings[j] = foundUser.ratings[j]
					else
						avgRatings[j] = Number(avgRatings[j])+Number(foundUser.ratings[j])
				}
			}
			if(counter==friends.length){
				noOfRated=0
				for(var j=0;j<avgRatings.length;j++){
					if (avgRatings[j]){
						noOfRated++
						avgRatings[j] = Number(avgRatings[j])/actualFriends.length
					}
				}
				learnt=[]
				toLearn=[]
				toLearnInd=[]
				predictedData=[]
				if (noOfRated<4){
					res.send("You have entered a wrong name");
					res.beginDialog('/');
				}else{
					for(var j=0;j<outlets.length;j++){
						if(avgRatings[j]==null){
							toLearn.push(JSON.stringify(outlets[j].featureVector))
							toLearnInd.push(j)
						}else{
							tmp = outlets[j].featureVector
							tmp["Rating"]=Math.round(avgRatings[j]).toString()
							tmp =JSON.stringify(tmp)
							learnt.push(tmp)
						}
					}
					
					data1new=[]
				    data2new=[]
				    for(var j=0;j<learnt.length;j++){
				        data1new.push(JSON.parse(learnt[j]))
				    }
				    for(var j=0;j<toLearn.length;j++){
				        data2new.push(JSON.parse(toLearn[j]))
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
				    var reqPost = https.request(options, function (res2) {
				        res2.on('data', function(d) {
				            predictedData = JSON.parse(d.toString("utf8"))["Results"]["output1"]
				       		sortedArray=[]
				       		maxDiff=0
				       		maxRate=0
				       		for (var j=0;j<predictedData.length;j++){//to get max to scale them
				       			tmpLatLong = outlets[toLearnInd[j]]["lat,long"].split(",")
				       			tmpLat = tmpLatLong[0]
				       			tmpLong = tmpLatLong[1]
				       			diff = Math.abs(req.location.latitude-tmpLat)+Math.abs(req.location.longitude-tmpLong)
				       			maxDiff	= Math.max(maxDiff,diff)
				       			predRate = Number(predictedData[j]["Scored Labels"])
				       			maxRate = Math.max(maxRate,predRate)
				       		}
				       		for (var j=0;j<predictedData.length;j++){
				       			tmpLatLong = outlets[toLearnInd[j]]["lat,long"].split(",")
				       			tmpLat = tmpLatLong[0]
				       			tmpLong = tmpLatLong[1]
				       			diff = Math.abs(req.location.latitude-tmpLat)+Math.abs(req.location.longitude-tmpLong)
				       			predRate = Number(predictedData[j]["Scored Labels"])
				       			sortedArray.push([-diff/maxDiff+predRate/maxRate,predRate,toLearnInd[j]])
				       		}
				       		sortedArray.sort()
				       		sortedArray.reverse()
				       		sortedArray=sortedArray.splice(0,8)

							var msg = new builder.Message(session);
						    msg.attachmentLayout(builder.AttachmentLayout.carousel)
						    msg.attachments([
						        new builder.HeroCard(session)
						            .title(outlets[sortedArray[0][2]].name)
						            .subtitle("Best Cuisines: " + outlets[sortedArray[0][2]].cuisine)
						            .text("Address : " + outlets[sortedArray[0][2]].address)
						            .images([builder.CardImage.create(session, outlets[sortedArray[0][2]].img)]),
						        new builder.HeroCard(session)
						            .title(outlets[sortedArray[1][2]].name)
						            .subtitle("Best Cuisines: " + outlets[sortedArray[1][2]].cuisine)
						            .text("Address : " + outlets[sortedArray[1][2]].address)
						            .images([builder.CardImage.create(session, outlets[sortedArray[1][2]].img)]),
						        new builder.HeroCard(session)
						            .title(outlets[sortedArray[2][2]].name)
						            .subtitle("Best Cuisines: " + outlets[sortedArray[2][2]].cuisine)
						            .text("Address : " + outlets[sortedArray[2][2]].address)
						            .images([builder.CardImage.create(session, outlets[sortedArray[2][2]].img)]),
						        new builder.HeroCard(session)
						            .title(outlets[sortedArray[3][2]].name)
						            .subtitle("Best Cuisines: " + outlets[sortedArray[3][2]].cuisine)
						            .text("Address : " + outlets[sortedArray[3][2]].address)
						            .images([builder.CardImage.create(session, outlets[sortedArray[3][2]].img)]),			            
						        new builder.HeroCard(session)
						            .title(outlets[sortedArray[4][2]].name)
						            .subtitle("Best Cuisines: " + outlets[sortedArray[4][2]].cuisine)
						            .text("Address : " + outlets[sortedArray[4][2]].address)
						            .images([builder.CardImage.create(session, outlets[sortedArray[4][2]].img)]),
						        new builder.HeroCard(session)
						            .title(outlets[sortedArray[5][2]].name)
						            .subtitle("Best Cuisines: " + outlets[sortedArray[5][2]].cuisine)
						            .text("Address : " + outlets[sortedArray[5][2]].address)
						            .images([builder.CardImage.create(session, outlets[sortedArray[5][2]].img)]),
						        new builder.HeroCard(session)
						            .title(outlets[sortedArray[6][2]].name)
						            .subtitle("Best Cuisines: " + outlets[sortedArray[6][2]].cuisine)
						            .text("Address : " + outlets[sortedArray[6][2]].address)
						            .images([builder.CardImage.create(session, outlets[sortedArray[6][2]].img)]),
						        new builder.HeroCard(session)
						            .title(outlets[sortedArray[7][2]].name)
						            .subtitle("Best Cuisines: " + outlets[sortedArray[7][2]].cuisine)
						            .text("Address : " + outlets[sortedArray[7][2]].address)
						            .images([builder.CardImage.create(session, outlets[sortedArray[7][2]].img)]),
						    ]);
						    session.send(msg);
				        });
				    });
					reqPost.write(dataString);
				    reqPost.end();
				    reqPost.on('error', function(e){
				        console.error(e);
				        });
					res.beginDialog('Nothing');
				}
			}
		})
	}
}