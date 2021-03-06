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
var ToKnowLocationResponse = undefined;
var cuisineList = ["Air Conditioned","American","Asian", "Barbeque and Grill","Cards Accepted","Chinese","Coastal","Coffee", 
"Continental","DJ","Dance Floor","Differently Abled Friendly","Fast Food","Games","Health Food","Home Delivery","Hookah", 
"Italian","Japanese","Lebanese","Lift","Malaysian","Mediterranean","Mexican","Mughlai","Multi-Cuisine","North Indian", 
"Oriental","Outdoor Seating","Parking","Roof Top","Seafood","Smoking Area","Take Away","Thai","Wifi"];
// var GroupUser = undefined;

// var todelete = {
// 	username: "String",
// 	password: "String",
// 	ratings: [],
// 	noOfRated: 5,
// 	location:{
// 		latitude: 28.55,
// 		longitude: 77.195,
// 		name: "String"
// 	}
// };

var mongoose 				= require('mongoose'),
    bodyParser 				= require("body-parser"),
    User					= require("../models/user"),
    outlets					= require("../scrape/output.json")
    methodOverride          = require("method-override"),
    azureML                 = require("../public/ML-API.js")

var longitude = undefined;
var latitude = undefined;
// SetDistKmResto(todelete,0.1);

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
// getLocationBasedRatings("satya niketan");
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
var locationYesNo = false;
var cuisineLocationYesNo = false;
var KnownLocationAskYesNo = false;
var KnownLocationAgainAsk = false;
var preferredCuisine = null;
// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/313572bf-d67d-4bd1-bc70-cde449f43ae2?subscription-key=2c7627c91a234133bf23a24cfb15a021&verbose=true');
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

intents.matches('Greeting', (session) => {
    if(!session.userData.name) {
		session.send("Hi! My name is Frudo. I am your Food Assistant.");
		session.beginDialog('GetUsername');
    } else {
	    session.send("Hi! " + session.userData.name + " 😎");
    	users.push(session.userData.name);
	    session.send("How may I help you?");    	
    }
});

//-------------------------------------------------------------
intents.matches('Help', (session) => {
    session.beginDialog('Help');
});

intents.matches('Thanks', (session) => {
	session.beginDialog('Thanks');
});

intents.matches('Cancel', (session) => {
    session.send("Hope you liked my service 😎. Thanks!");
    session.beginDialog('/');
});

intents.matches('Recommend', [(session, args, next) => {
		// session.send(args.entities[0]["entity"]);
		// session.send(args.entities[0]["type"]);
		var title = builder.EntityRecognizer.findEntity(args.entities, 'Restaurants.Cuisine');
		var placeTitle = builder.EntityRecognizer.findEntity(args.entities, 'Restaurants.Address');

		var cuisine = title ? title.entity : null;
		var place = placeTitle ? placeTitle.entity : null;
		if(cuisine || place) {
			if(cuisine){
				preferredCuisine = cuisine;
				getCuisineLocation(place,session);
			}else{
				getLocation(place,session);
			}
			// getCuisineRecommendations(MainUser, session);---------------------
		}else{
			next();	
		}
	},
	(session, results) => {
		// console.log("Going to recommend dialog");
		if(latitude && longitude){
			KnownLocationAgainAsk = true;
		}
		session.beginDialog('RecommendRestaurant');
	}
]);
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
	}else if(KnownLocationAskYesNo){
		session.send("Okay, sure");
		KnownLocationAskYesNo = false;
		session.beginDialog('RecommendRestaurant');
	}else if(locationYesNo){
		locationYesNo = false;
		var locLat = ToKnowLocationResponse.results[0].geometry.location.lat;
		var locLng = ToKnowLocationResponse.results[0].geometry.location.lng;
		session.send("Here 👇, are the restaurants that you will like :)");
		getLocationBasedRatings(locLat,locLng,session,0.1);	// within 100m distance from location
	}else if(cuisineLocationYesNo){
		cuisineLocationYesNo = false;
		var locLat = CuisineLocationResponse.results[0].geometry.location.lat;
		var locLng = CuisineLocationResponse.results[0].geometry.location.lng;
		session.send("Here 👇, are the restaurants that you will like :)");
		getCuisineRecommendations(preferredCuisine,locLat,locLng,session);
	}else{
		session.send("I guess I am not able to understand this. Let's start again.");
		session.beginDialog('Help');
	}
});
intents.matches('No', (session) => {
	if(combinedYesNo) {
		haveFriendsYesNo = false;
		if(users.length > 1) {
			if(longitude && latitude){
				if(!session.userData.name){
			    	session.send("Here are the general choice of most favorable restaurants 👇");
			    	getGeneralisedRatings(latitude,longitude,session); // ---------------------------
			    }else{
			    	session.send("Thanks, here are your combined recommendations 👇");
	    			GetGroupRecommendations(MainUser,users,session);
				}				
			}else{
				session.send("Please send me your location. Just click on + icon and click the location icon to share location.");
				if(session.message.entities[0]){
				    latitude = session.message.entities[0].geo.latitude;
				    longitude = session.message.entities[0].geo.longitude;
			    	session.send("Thanks,Here are your combined recommendations 👇");
				    if(!session.userData.name){
			    		session.send("Here are the general choice of most favorable restaurants 👇");
				    	getGeneralisedRatings(latitude,longitude,session); // ---------------------------
				    }else{
				    	MainUser.location.latitude = latitude;
				    	MainUser.location.longitude = longitude;
				    	MainUser.location.name = "";
			    		var TwentyKmResto = SetDistKmResto(MainUser,5);
		    			MainUser.TwentyKmResto = TwentyKmResto;
			    		User.findByIdAndUpdate(MainUser.id,MainUser,function(err,updatedUser){
							if(err){
								res.send("Server error 😕");
							}
							else{
								GetGroupRecommendations(MainUser,users,session);
							}
						} );
					}
			    }
			}
		}else{
			session.beginDialog('Nothing');
		}
	}else if(KnownLocationAskYesNo){
		latitude = undefined;
		longitude = undefined;
		KnownLocationAskYesNo = false;
		bot.beginDialog('RecommendRestaurant');
	}else if(locationYesNo){
		locationYesNo = false;
		session.beginDialog('AskAgainForLocation');
		// session.beginDialog('/');
	}else if(cuisineLocationYesNo){
		cuisineLocationYesNo = false;
		session.beginDialog('GetLocation');
	}else if(inNothing) {
		inNothing = false;
		session.send("Hope you liked my service. Thanks!");
		session.beginDialog('/');
	}
	else {
		session.beginDialog('Nothing');
	}
})
intents.onDefault((session) => {
	if(friendsYesNo || locationYesNo || combinedYesNo || haveFriendsYesNo || inNothing){
		session.send("Sorry, I didn't understand it 😕. Maybe a typo.....");
		session.beginDialog('/');
	}else{
	    session.send('Sorry, I did not understand that. 😕');
	    session.send('But here 👇 are the things I can do for you.')
	    session.beginDialog('Help');		
	}
});

var intent_Dialog = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', intents);    

bot.dialog('Thanks', [
	function(session){
		session.send("My pleasure 💓. I will be there to help at all times (y)");
		session.beginDialog('/');
	}
]);

bot.dialog('AskAgainForLocation', [
	function(session){
		builder.Prompts.text(session,"Please tell me your location only again properly as I am unable to find such a location. Sorry, for inconvenience :(");
	},
	function(session,results){
		getLocation(results.response,session);
	}
]);

bot.dialog('RateRestaurants', [
   	function (session) {
   		session.send("For security reasons, you can rate restaurants on our webapp only. :)");
   		session.send("Please follow [this](http://foodreco.azurewebsites.net/registerPhone) link to register yourself and/or rate restaurants");
   		session.beginDialog('Nothing');
    }
]);

bot.dialog('RecommendRestaurant', [
    function (session,args,next) {
    	var validUser = false;
    	// console.log("In recommend");
		if(longitude && latitude){
			// console.log("LatLong known");
			if(KnownLocationAgainAsk){
				session.send("Should I use your previous position?");
				KnownLocationAgainAsk = false;
				KnownLocationAskYesNo = true;
				session.beginDialog('/');				
			}else{
				if(!session.userData.name){
			    	session.send("Here are the general choice of most favorable restaurants 👇");
			    	getGeneralisedRatings(latitude,longitude,session); // ---------------------------
			    }else{
			    	getPersonalisedRatings(MainUser,session);
				}				
			}
		}else{
			if(!session.message.entities[0]){
				session.send("Please send me your location. Just click on + icon and click the location icon to share location.");
			}
			if(session.message.entities[0]){
			    latitude = session.message.entities[0].geo.latitude;
			    longitude = session.message.entities[0].geo.longitude;
		        session.send("Sure. I advice you to try these restaurants.");
			    if(!session.userData.name){
			    	session.send("Here are the general choice of most favorable restaurants 👇");
			    	getGeneralisedRatings(latitude,longitude,session); // ---------------------------
			    }else{
			    	MainUser.location.latitude = latitude;
			    	MainUser.location.longitude = longitude;
			    	MainUser.location.name = "";
		    		var TwentyKmResto = SetDistKmResto(MainUser,5);
		    		MainUser.TwentyKmResto = TwentyKmResto;
		    		User.findByIdAndUpdate(MainUser.id,MainUser,function(err,updatedUser){
						if(err){
							res.send("Server error 😕");
						}
						else{
							getPersonalisedRatings(MainUser,session);
						}
					});
				}
	    	}
	    }
    }
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
				session.send("Some database error has occured 😕. Please try again");
			}else{
				if(!foundUser) {
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
		session.send("I can learn your taste and recommend the best restaurants that will definitely suit your taste!!!");
 		var msg = new builder.Message(session);
	    msg.attachmentLayout(builder.AttachmentLayout.carousel)
	    msg.attachments([
	        new builder.HeroCard(session)
	            .title("Personalised Recommendations")
	            .subtitle("Get the best restaurants for you based on your previous ratings.\n\n")
	            .text("Try asking me the following:\n\n-Suggest me the best restaurants to have Chinese.\n\n-Recommend me some restaurant in Connaught Place.\n\n-What should I have today"),
	        new builder.HeroCard(session)
	            .title("Group Recommendations")
	            .subtitle("Give usernames of your friends and get the best recommendations for your group as a whole\n\n")
	            .text("Try the personalised recommendation and then input your friends' usernames. And voila, it's done!!!")
            new builder.HeroCard(session)
	            .title("Location Based Recommendations")
	            .subtitle("Provide me your desired location and I'll tell you the most favoured restaurants at the location\n\n")
	            .text("Try the following:\n\n-Suggest me the best restaurants in Gurgaon.\n\n-I want to have dinner today at Satya Niketan"),
            new builder.HeroCard(session)
	            .title("Cuisine Based Recommendations")
	            .subtitle("Provide me cuisine you desire today and leave the rest on me!!!\n\n")
	            .text("Try the following:\n\n-I want to have American tonight.\n\n-Recommend me the best place to eat Continental"),
            new builder.HeroCard(session)
	            .title("Register")
	            .subtitle("I can provide you personalised recommendations only if I know you!\n\n")
	            .text("Please register yourself at http://foodreco.azurewebsites.net/registerPhone\n\nThereafter, rate any four restaurants to get the best results"),
            new builder.HeroCard(session)
	            .title("Team")
	            .subtitle("Here are my Developers\n\n")
	            .text("Mayank Singh Chauhan\n\nAtishya Jain\n\nDivyanshu Saxena"),            
	    ]);
		session.send(msg);
		// builder.Prompts.text(session, "Read More about:");
		msg = new builder.Message(session)
		.text("Read more about: ")
		.suggestedActions(
			builder.SuggestedActions.create(
				session, [
        	builder.CardAction.postBack(session, "Personalised Recommendations", "Personalised Recommendations"),
            builder.CardAction.postBack(session, "Group Recommendations", "Group Recommendations"),
           	builder.CardAction.postBack(session, "Cuisine Recommendations", "Cuisine Recommendations"),
        	builder.CardAction.postBack(session, "Location Recommendations", "Location Recommendations"),
        	builder.CardAction.postBack(session, "Register", "Register")
    	]));
    	builder.Prompts.text(session, msg);
 		// session.send("Help needs remanufacturing");
	},
	function(session, results) {
		var response = results.response;
		// session.send(response);
		switch (response) {
			case "Personalised Recommendations":
				session.send("Get the best restaurants for you based on your previous ratings.\n\nTry asking me the following:\n\n-Suggest me the best restaurants to have Chinese.\n\n-Recommend me some restaurant in Connaught Place.\n\n-What should I have today");
				break;
			case "Group Recommendations":
				session.send("Give usernames of your friends and get the best recommendations for your group as a whole\n\nTry the personalised recommendation and then input your friends' usernames. And voila, it's done!!!");
				break;
			case "Location Based Recommendations":
				session.send("Provide me your desired location and I'll tell you the most favoured restaurants at the location\n\nTry the following:\n\n-Suggest me the best restaurants in Gurgaon.\n\n-I want to have dinner today at Satya Niketan");
				break;
			case "Cuisine Based Recommendations":
				session.send("Provide me cuisine you desire today and leave the rest on me!!!\n\nTry the following:\n\n-I want to have American tonight.\n\n-Recommend me the best place to eat Continental");
				break;
			case "Register":
				session.send("I can provide you personalised recommendations only if I know you!\n\nPlease register yourself at http://foodreco.azurewebsites.net/registerPhone\n\nThereafter, rate any four restaurants to get the best results");
				break;	
			default:
				break;
		}
		session.beginDialog('/');
	}
]);

bot.dialog('GetUsername', [
	function (session) {
		session.send("I'm your personalised restaurant recommending system. I can learn your taste and recommend you the best restaurants nearby accordingly.");
		builder.Prompts.text(session, "Please provide me your username. If you don't have a username yet please register yourself [here](https://foodreco.azurewebsites.net/registerPhone)"); //---------------------
	},
	function (session, results) {
		var username = results.response;
		User.findOne({username: new RegExp('^'+username+'$',"i")},function(err,foundUser){
			if(err){
				session.send("Some database error has occured 😕. Please try again");
			}else{
				if(foundUser /*false Check username in database------------------------------------------done*/) {
					MainUser = foundUser;
					// console.log(MainUser);
					session.userData.name = results.response;
					users.push(session.userData.name);
					session.send("How may I help you? (Type help to get started)");
					session.beginDialog('/');
				}
				else {
					session.send("Sorry. This username does not exist. However, I can provide you general recommendations as well.");
					session.send("To get personalized recommendations, please register yourself [here](http://foodreco.azurewebsites.net/registerPhone) . However, I can still recommend you some restaurants based on general recommendations/cuisines/specific location for you :)"); //----------------------------------
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
		session.send("Is there anything I can do for you?");
		session.beginDialog('/');
	}
]);

bot.dialog('GetLocation', [
	function (session) {
		session.send("I need your desired location to provide the best results. Just click on + icon and click the location icon to share location.");//---------------------------Wrong location not handled
		if(session.message.entities[0]){
		    latitude = session.message.entities[0].geo.latitude;
		    longitude = session.message.entities[0].geo.longitude;
	    	session.send("Thanks, here are your recommendations 👇");
	    	getCuisineRecommendations(preferredCuisine,latitude,longitude,session);
	    }
	}
]);

function getPersonalisedRatings(req,res){
	var learnt=[]
	var toLearn=[]
	var toLearnInd=[]
	var predictedData=[]
	var ratings = req.ratings
	
	if (req.noOfRated<4){
		res.send("It seems that you haven't rated enough restaurants to generate a personalised experience. Please visit [here](https://foodreco.azurewebsites.net/loginPhone) and rate some more restaurants.");//---------------------------------
		res.send("However, I can still provide you the most favourable restaurants.");
		getGeneralisedRatings(latitude,longitude,req);
		res.beginDialog('/');
	}else{
		for(var i=0;i<req.TwentyKmResto.length;i++){
			if(ratings[req.TwentyKmResto[i].id]==null){
				toLearn.push(JSON.stringify(req.TwentyKmResto[i].featureVector))
				toLearnInd.push(req.TwentyKmResto[i].id)
			}else{
				tmp = req.TwentyKmResto[i].featureVector
				tmp["Rating"]=ratings[req.TwentyKmResto[i].id]
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
	combinedYesNo = false;
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
						avgRatings[j] = Math.round(Number(avgRatings[j])/actualFriends.length)
					}
				}
				learnt=[]
				toLearn=[]
				toLearnInd=[]
				predictedData=[]
				if (noOfRated<4){
					res.send("You have rated less restaurants than required.");
					res.beginDialog('/');
				}else{
					for(var i=0;i<req.TwentyKmResto.length;i++){
						if(avgRatings[req.TwentyKmResto[i].id]==null){
							toLearn.push(JSON.stringify(req.TwentyKmResto[i].featureVector))
							toLearnInd.push(req.TwentyKmResto[i].id)
						}else{
							tmp = req.TwentyKmResto[i].featureVector
							tmp["Rating"]=avgRatings[req.TwentyKmResto[i].id]
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
		})
	}
}

function getGeneralisedRatings(lat,long,session){
	var ToRecommend = [];
	var user = {
		location:{
			latitude: lat,
			longitude: long
		}
	};
	ToRecommend = SetDistKmResto(user,5);
	ToRecommend.sort(function(a, b){
		return b.genrat-a.genrat;	// Automatic descending
	})

	var sortedArray=ToRecommend.splice(0,8);
	var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title(sortedArray[0].name)
            .subtitle("Best Cuisines: " + sortedArray[0].cuisine)
            .text("Address : " + sortedArray[0].address)
            .images([builder.CardImage.create(session, sortedArray[0].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[1].name)
            .subtitle("Best Cuisines: " + sortedArray[1].cuisine)
            .text("Address : " + sortedArray[1].address)
            .images([builder.CardImage.create(session, sortedArray[1].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[2].name)
            .subtitle("Best Cuisines: " + sortedArray[2].cuisine)
            .text("Address : " + sortedArray[2].address)
            .images([builder.CardImage.create(session, sortedArray[2].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[3].name)
            .subtitle("Best Cuisines: " + sortedArray[3].cuisine)
            .text("Address : " + sortedArray[3].address)
            .images([builder.CardImage.create(session, sortedArray[3].img)]),			            
        new builder.HeroCard(session)
            .title(sortedArray[4].name)
            .subtitle("Best Cuisines: " + sortedArray[4].cuisine)
            .text("Address : " + sortedArray[4].address)
            .images([builder.CardImage.create(session, sortedArray[4].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[5].name)
            .subtitle("Best Cuisines: " + sortedArray[5].cuisine)
            .text("Address : " + sortedArray[5].address)
            .images([builder.CardImage.create(session, sortedArray[5].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[6].name)
            .subtitle("Best Cuisines: " + sortedArray[6].cuisine)
            .text("Address : " + sortedArray[6].address)
            .images([builder.CardImage.create(session, sortedArray[6].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[7].name)
            .subtitle("Best Cuisines: " + sortedArray[7].cuisine)
            .text("Address : " + sortedArray[7].address)
            .images([builder.CardImage.create(session, sortedArray[7].img)]),
    ]);
    session.send(msg);
    session.beginDialog('/');
}

function getLocationBasedRatings(lat,long,session,dist){
	var ToRecommend = [];
	var user = {
		location:{
			latitude: lat,
			longitude: long
		},
		ratings:[]
	};
	if(MainUser){
		user = MainUser;
		user.location.latitude = lat;
		user.location.longitude = long;
		latitude = lat;
		longitude = long;
		MainUser = user;
		getPersonalisedRatings(user,session);
	}else{
		ToRecommend = SetDistKmResto(user,dist);
		ToRecommend.sort(function(a, b){
			return b.genrat-a.genrat;	// Automatic descending
		})

		var sortedArray=ToRecommend.splice(0,8);
		var msg = new builder.Message(session);
	    msg.attachmentLayout(builder.AttachmentLayout.carousel)
	    msg.attachments([
	        new builder.HeroCard(session)
	            .title(sortedArray[0].name)
	            .subtitle("Best Cuisines: " + sortedArray[0].cuisine)
	            .text("Address : " + sortedArray[0].address)
	            .images([builder.CardImage.create(session, sortedArray[0].img)]),
	        new builder.HeroCard(session)
	            .title(sortedArray[1].name)
	            .subtitle("Best Cuisines: " + sortedArray[1].cuisine)
	            .text("Address : " + sortedArray[1].address)
	            .images([builder.CardImage.create(session, sortedArray[1].img)]),
	        new builder.HeroCard(session)
	            .title(sortedArray[2].name)
	            .subtitle("Best Cuisines: " + sortedArray[2].cuisine)
	            .text("Address : " + sortedArray[2].address)
	            .images([builder.CardImage.create(session, sortedArray[2].img)]),
	        new builder.HeroCard(session)
	            .title(sortedArray[3].name)
	            .subtitle("Best Cuisines: " + sortedArray[3].cuisine)
	            .text("Address : " + sortedArray[3].address)
	            .images([builder.CardImage.create(session, sortedArray[3].img)]),			            
	        new builder.HeroCard(session)
	            .title(sortedArray[4].name)
	            .subtitle("Best Cuisines: " + sortedArray[4].cuisine)
	            .text("Address : " + sortedArray[4].address)
	            .images([builder.CardImage.create(session, sortedArray[4].img)]),
	        new builder.HeroCard(session)
	            .title(sortedArray[5].name)
	            .subtitle("Best Cuisines: " + sortedArray[5].cuisine)
	            .text("Address : " + sortedArray[5].address)
	            .images([builder.CardImage.create(session, sortedArray[5].img)]),
	        new builder.HeroCard(session)
	            .title(sortedArray[6].name)
	            .subtitle("Best Cuisines: " + sortedArray[6].cuisine)
	            .text("Address : " + sortedArray[6].address)
	            .images([builder.CardImage.create(session, sortedArray[6].img)]),
	        new builder.HeroCard(session)
	            .title(sortedArray[7].name)
	            .subtitle("Best Cuisines: " + sortedArray[7].cuisine)
	            .text("Address : " + sortedArray[7].address)
	            .images([builder.CardImage.create(session, sortedArray[7].img)]),
	    ]);
	    session.send(msg);
	    session.beginDialog('/');		
	}
}

function getCuisineLocation(address, session) {
	if(address) {
		var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&key=AIzaSyCzAuBSIq6lUOLTNjNbFCt5uo7QbD7WZo8';
		https.get(url, function(res){
		    var body = '';
		    res.on('data', function(chunk){
		        body += chunk;
		    });
		    res.on('end', function(){
		        var googleResponse = JSON.parse(body);
		        var ReceivedAddr = googleResponse.results[0].formatted_address;
		        session.send("Please say yes if this is your location:");
		        session.send(ReceivedAddr);
		        cuisineLocationYesNo = true;
		        session.beginDialog('/');
		        CuisineLocationResponse = googleResponse;
		    });
		}).on('error', function(e){
		      console.log("Got an error: ", e);
		});
	}
	else {
		session.beginDialog('GetLocation');
	}
}

function getCuisineRecommendations(cuisine, lat, long, req){
	var ToRecommend = [];
	var user = {
		location:{
			latitude: lat,
			longitude: long
		}
	};
	ToRecommend = SetDistKmResto(user,5);
	ToRecommend.sort(function(a, b){
		if(a.featureVector.cuisine!=0 && b.featureVector.cuisine!=0){
			return b.genrat-a.genrat;	// Automatic descending
		}else if(a.featureVector.cuisine==0){
			return b.genrat;
		}else{
			return a.genrat;
		}
	})

	var sortedArray=ToRecommend.splice(0,8);
	var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title(sortedArray[0].name)
            .subtitle("Best Cuisines: " + sortedArray[0].cuisine)
            .text("Address : " + sortedArray[0].address)
            .images([builder.CardImage.create(session, sortedArray[0].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[1].name)
            .subtitle("Best Cuisines: " + sortedArray[1].cuisine)
            .text("Address : " + sortedArray[1].address)
            .images([builder.CardImage.create(session, sortedArray[1].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[2].name)
            .subtitle("Best Cuisines: " + sortedArray[2].cuisine)
            .text("Address : " + sortedArray[2].address)
            .images([builder.CardImage.create(session, sortedArray[2].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[3].name)
            .subtitle("Best Cuisines: " + sortedArray[3].cuisine)
            .text("Address : " + sortedArray[3].address)
            .images([builder.CardImage.create(session, sortedArray[3].img)]),			            
        new builder.HeroCard(session)
            .title(sortedArray[4].name)
            .subtitle("Best Cuisines: " + sortedArray[4].cuisine)
            .text("Address : " + sortedArray[4].address)
            .images([builder.CardImage.create(session, sortedArray[4].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[5].name)
            .subtitle("Best Cuisines: " + sortedArray[5].cuisine)
            .text("Address : " + sortedArray[5].address)
            .images([builder.CardImage.create(session, sortedArray[5].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[6].name)
            .subtitle("Best Cuisines: " + sortedArray[6].cuisine)
            .text("Address : " + sortedArray[6].address)
            .images([builder.CardImage.create(session, sortedArray[6].img)]),
        new builder.HeroCard(session)
            .title(sortedArray[7].name)
            .subtitle("Best Cuisines: " + sortedArray[7].cuisine)
            .text("Address : " + sortedArray[7].address)
            .images([builder.CardImage.create(session, sortedArray[7].img)]),
    ]);
    session.send(msg);
    session.beginDialog('/');
}

function SetDistKmResto(updatedUser,dist){
	var TwentyKmResto = [];
	while(TwentyKmResto.length <= 8){
		for(var i = 0;i<outlets.length;i++){
			var fields = outlets[i]["lat,long"].split(',');
			tmpDist = getDistanceFromLatLonInKm(Number(updatedUser.location.latitude),Number(updatedUser.location.longitude),Number(fields[0]),Number(fields[1]));
			if(tmpDist <= dist){
				TwentyKmResto.push(outlets[i]);
			}else if(updatedUser.ratings[i]){
				TwentyKmResto.push(outlets[i]);
			}
		}
		dist = dist+1;
	}
	return TwentyKmResto;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

function getLocation(address,session){
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&key=AIzaSyCzAuBSIq6lUOLTNjNbFCt5uo7QbD7WZo8';
	https.get(url, function(res){
	    var body = '';
	    res.on('data', function(chunk){
	        body += chunk;
	    });
	    res.on('end', function(){
	        var googleResponse = JSON.parse(body);
	        var ReceivedAddr = googleResponse.results[0].formatted_address;
	        session.send("Please say yes if this is your location:");
	        session.send(ReceivedAddr);
	        locationYesNo = true;
	        session.beginDialog('/');
	        ToKnowLocationResponse = googleResponse;
	    });
	}).on('error', function(e){
	      console.log("Got an error: ", e);
	});
}