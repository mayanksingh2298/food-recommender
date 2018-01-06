/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

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

// Make sure you add code to validate these fields
// var luisAppId = process.env.LuisAppId;
// var luisAPIKey = process.env.LuisAPIKey;
// var luisAppId = '313572bf-d67d-4bd1-bc70-cde449f43ae2';
// var luisAPIKey = '2c7627c91a234133bf23a24cfb15a021';
// var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
// console.log(luisAppId);
// console.log(luisAPIKey);
// console.log(luisAPIHostName);

// const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

var yes = false;
var friends = false;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/313572bf-d67d-4bd1-bc70-cde449f43ae2?subscription-key=2c7627c91a234133bf23a24cfb15a021&verbose=true');
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
intents.matches('Greeting', (session) => {
    session.send("Hi! My name is Frudi. I am your Food Assistant. How may I help you?");
});

/////////////
intents.matches('Help', (session) => {
    session.send('Please choose what help you need.');
    // session.beginDialog();
});
////////////////
intents.matches('Cancel', (session) => {
    session.send("Thank you for visiting Frudo. Please do come again!");
});
////////////////

intents.matches('Recommend', (session) => {
    session.send("Sure. I advice you to try these restaurants.");
    builder.Prompts.text(session, "Are you going out with some friends? I can recommend you the best place according to your common taste.");
});
intents.matches('RateRestaurants', (session) => {
	session.send("Let's rate the restaurant in steps.");
	session.beginDialog('RateRestaurant');
});
intents.matches('Yes', (session) => {
	yes = true;
});
intents.matches('No', (session) => {
	yes = false;
})
intents.onDefault((session) => {
    session.send('Sorry, I did not understand that. :(');
    session.send('But here are the things I can do for you.')
    // session.beginDialog();
});

var intent_Dialog = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('Main', intents);    

bot.dialog('RateRestaurant', [
   	function (session) {
   		builder.Prompts.text(session, "Please provide a restaurant name");
    },
    function (session, results) {
    	if(results.response === "exit") {
    		console.log("check");
    		session.send("Thank You for rating restaurants");
    		session.endDialog();
    	}
    	else {
    		builder.Prompts.text(session, "Please provide a restaurant name");
    		session.dialogData.restaurantName = results.response;
    		if (true /*Condition to check restaurant from db*/) {
		        builder.Prompts.text(session, "Yes this exists.");
		        var msg = new builder.Message(session)
				.text("Please rate the restaurant out of 5. It will help us to learn your taste. Thank You")
				.suggestedActions(
				builder.SuggestedActions.create(
					session, [
						builder.CardAction.imBack(session, "1", "1"),	// (actual value, value displayed to user)
						builder.CardAction.imBack(session, "2", "2"),
						builder.CardAction.imBack(session, "3", "3"),
						builder.CardAction.imBack(session, "4", "4"),
						builder.CardAction.imBack(session, "5", "5")
					]
				));
    		}
    		else {
    			builder.Prompts.text(session, "Sorry. I could not find the mentioned restaurant.");
    		}
			session.send(msg);
    	}
    },
    function (session, results) {
    	if(results.response === "exit"){
    		session.send("Thank You for rating restaurants");
    		session.endDialog();
    	}else{
	     	session.dialogData.restaurantRating = results.response;   
	    	session.send(`Thank You.<br/> Details: <br/>Name: ${session.dialogData.restaurantName} <br/>rating: ${session.dialogData.restaurantRating}`);
	    	session.beginDialog('AskforContinue');
	    }
    }
]);

bot.dialog('AskforContinue', [
    function (session) {
        builder.Prompts.text(session, "Do you want to Continue rating restaurants? y/n?");
    },
    function (session, results) {
    	if(results.response === "exit"){
    		session.send("Thank You for rating restaurants");
    		session.endDialog();
    	}else{
    		if(results.response === "y"){
	        	session.beginDialog('Raterestaurant');
	        }else{
	        	session.send("Thank You for rating restaurants");
	        	session.beginDialog('MetastableState');
	        	// session.endDialog();
	        }
    	}
    }
]);

bot.dialog('MetastableState', [
    function (session) {
        builder.Prompts.text(session, "Anything else can I do?");
    },
    function (session, results) {
    	if(results.response === "exit"){
    		session.send("Thank You. Hope you like my service");
    		session.endDialog();
    	}else{
    		if(results.response === "Yes, please recommend a restaurant"){
	        	session.beginDialog('RecommendRestaurant');
	        }else if(results.response === "no"){
	        	session.send("Thank You. Hope you like my service");
	        	session.endDialog();
	        }else{
	        	session.send("Sorry I don't understand :(. Let's start over");
	        	session.beginDialog('MetastableState');
	        }
    	}
    }
]);

bot.dialog('RecommendRestaurant', [
    function (session) {
        builder.Prompts.text(session, "I am prety sure that you will like the food at this place.");
        
    },
    function (session,results) {
    	if(results.response === "exit"){
    		session.send("Thank You. Hope you like my service");
    		session.endDialog();
    	}else{
    		if(results.response === "Any other?"){
	        	session.beginDialog('Recommendrestaurant');
	        }else if(results.response === "Thanks"){
	        	session.send("Thank You. Hope you like my service");
	        	session.endDialog();
	        }else{
	        	session.send("Sorry, I don't recognize this :(");
	        }
    	}
	}
]);

function Converse(){
	console.log(Finalstorage);
	var bot = new builder.UniversalBot(connector, function(session){
		console.log("starting cocnversation");
	    session.beginDialog('StartConverse');
	});
	bot.set('storage', inMemoryStorage); // Register in-memory storage 
	//bot.set('storage', tableStorage);
	    	
	bot.dialog('StartConverse', [
	   function (session) {
	    	builder.Prompts.text(session, "Hi, My name is Frudi. I am your Food Assistant. How may I help you?");
	    },
	    function (session, results) {
	   		if(results.response === "I want to rate restaurants"){
	   			session.beginDialog('Raterestaurant');
	   		}else if(results.response === "I want to have food"){
	   			session.beginDialog('Recommendrestaurant');
	   		}else{
	   			var mm = "I don't recognize this sorry :(";
	   			session.send(mm);
	   		}
	    }
	]);
}
