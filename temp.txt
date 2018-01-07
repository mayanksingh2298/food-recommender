/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var FunDatabase = require('./../Database/Bot_database');

var mongoose 				= require('mongoose'),
    bodyParser 				= require("body-parser"),
    User					= require("../models/user"),
    outlets					= require("../scrape/output.json")
    methodOverride          = require("method-override"),
    azureML                 = require("../public/ML-API.js")

// console.log(outlets.length)
// azureML.test("hello world")
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
var useEmulator = (process.env.NODE_ENV === 'development');
var Finalstorage;
console.log(useEmulator);
if(useEmulator){
	Finalstorage = inMemoryStorage;
}else{
	Finalstorage = tableStorage;
}

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', inMemoryStorage);

var friendsYesNo = false;
var haveFriendsYesNo = false;
var combinedYesNo = false;
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
			// Display recommendation combined------------------------------------------------
		}
	}
	session.beginDialog('Nothing');
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
	    session.send("Sure. I advice you to try these restaurants.");
	    if(!session.userData.name) {
	    	// General Retrieval--------------------------------------
	    } else {
	    	// Retrieve restaurants from database-------------------------Done
	    	var username = session.userData.name;
		    User.findOne({username: new RegExp('^'+username+'$',"i")},function(err,foundUser){
				if(err){
					session.send("Some database error has occured. Please try again");
				}else{
					if (!foundUser) {
						session.send("Sorry. This username does not exist. Please check out the following general recommendations.");
						// General Retrieval-------------------------------------
					}
					else {

					}
				}
			});
		}
	    session.send("Are you going out with some friends? I can recommend you the best place according to your common taste.");
	    friendsYesNo = true;
	    session.beginDialog('/');
    }
]);

bot.dialog('Combined', [
	function (session) {
		builder.Prompts.text(session, "Enter the username of your friend.");
	},
	function (session, results) {
		var username = results.response;
		User.findOne({username: new RegExp('^'+username+'$',"i")},function(err,foundUser){
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
		// builder.Prompts.choice(session, "Please choose what help you need.", "Personal Recommendations|Group Recommendations|Rate Restaurants|Introduction");
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
		// session.send(msg);
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
		session.send("Is there anything else I can do for you?");
		session.beginDialog('/');
	}
]);

// bot.dialog('AskforContinue', [
//     function (session) {
//         builder.Prompts.text(session, "Do you want to Continue rating restaurants? y/n?");
//     },
//     function (session, results) {
//     	if(results.response === "exit"){
//     		session.send("Thank You for rating restaurants");
//     		session.endDialog();
//     	}else{
//     		if(results.response === "y"){
// 	        	session.beginDialog('Raterestaurant');
// 	        }else{
// 	        	session.send("Thank You for rating restaurants");
// 	        	session.beginDialog('MetastableState');
// 	        	// session.endDialog();
// 	        }
//     	}
//     }
// ]);

// bot.dialog('MetastableState', [
//     function (session) {
//         builder.Prompts.text(session, "Anything else can I do?");
//     },
//     function (session, results) {
//     	if(results.response === "exit"){
//     		session.send("Thank You. Hope you like my service");
//     		session.endDialog();
//     	}else{
//     		if(results.response === "Yes, please recommend a restaurant"){
// 	        	session.beginDialog('RecommendRestaurant');
// 	        }else if(results.response === "no"){
// 	        	session.send("Thank You. Hope you like my service");
// 	        	session.endDialog();
// 	        }else{
// 	        	session.send("Sorry I don't understand :(. Let's start over");
// 	        	session.beginDialog('MetastableState');
// 	        }
//     	}
//     }
// ]);

// function Converse(){
// 	console.log(Finalstorage);
// 	var bot = new builder.UniversalBot(connector, function(session){
// 		console.log("starting cocnversation");
// 	    session.beginDialog('StartConverse');
// 	});
// 	bot.set('storage', inMemoryStorage); // Register in-memory storage 
// 	//bot.set('storage', tableStorage);
	    	
// 	bot.dialog('StartConverse', [
// 	   function (session) {
// 	    	builder.Prompts.text(session, "Hi, My name is Frudi. I am your Food Assistant. How may I help you?");
// 	    },
// 	    function (session, results) {
// 	   		if(results.response === "I want to rate restaurants"){
// 	   			session.beginDialog('Raterestaurant');
// 	   		}else if(results.response === "I want to have food"){
// 	   			session.beginDialog('Recommendrestaurant');
// 	   		}else{
// 	   			var mm = "I don't recognize this sorry :(";
// 	   			session.send(mm);
// 	   		}
// 	    }
// 	]);
// }
