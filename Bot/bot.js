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
var luisAppId = '313572bf-d67d-4bd1-bc70-cde449f43ae2';
var luisAPIKey = '2c7627c91a234133bf23a24cfb15a021';
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
console.log(luisAppId);
console.log(luisAPIKey);
console.log(luisAPIHostName);

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
.matches('Greeting', (session) => {
    session.send("Hi! My name is Frudi. I am your Food Assistant. How may I help you?");
})
.matches('Help', (session) => {
    session.send('You reached Help intent, you said \'%s\'.', session.message.text);
})
.matches('Cancel', (session) => {
    session.send("Thank you for visiting Frudo. Please do come again!");
})
.matches('Recommend', (session) => {
    session.send("Sure. I advice you to try these restaurants.");
    session.beginDialog('RecommendRestaurant');
})
.matches('RateRestaurants', (session) => {
	session.send("Let's rate the restaurant in steps.");
	session.beginDialog('RateRestaurant');
})
.onDefault((session) => {
    session.send('Sorry, I did not understand that. :(');
});

bot.dialog('/', intents);    

//uses a waterfall technique to prompt users for input.
// Converse();

bot.dialog('RateRestaurant', [
   function (session) {
        builder.Prompts.text(session, "Please provide a restaurant name");
    },
    function (session, results) {
    	if(results.response === "exit"){
    		session.send("Thank You for rating resturants");
    		session.endDialog();
    	}else{
    		session.dialogData.resturantName = results.response;
	        builder.Prompts.text(session, "Yes this exists.");
	        var msg = new builder.Message(session)
			.text("Please Rate the resturant. It will help us to learn your taste. Thank You")
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
			session.send(msg);
    	}
    },
    function (session, results) {
    	if(results.response === "exit"){
    		session.send("Thank You for rating resturants");
    		session.endDialog();
    	}else{
	     	session.dialogData.resturantRating = results.response;   
	    	session.send(`Thank You.<br/> Details: <br/>Name: ${session.dialogData.resturantName} <br/>rating: ${session.dialogData.resturantRating}`);
	    	session.beginDialog('AskforContinue');
	    }
    }
]);

bot.dialog('AskforContinue', [
    function (session) {
        builder.Prompts.text(session, "Do you want to Continue rating resturants? y/n?");
    },
    function (session, results) {
    	if(results.response === "exit"){
    		session.send("Thank You for rating resturants");
    		session.endDialog();
    	}else{
    		if(results.response === "y"){
	        	session.beginDialog('RateResturant');
	        }else{
	        	session.send("Thank You for rating resturants");
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
    		if(results.response === "Yes, please recommend a resturant"){
	        	session.beginDialog('RecommendResturant');
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
	        	session.beginDialog('RecommendResturant');
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
	   		if(results.response === "I want to rate resturants"){
	   			session.beginDialog('RateResturant');
	   		}else if(results.response === "I want to have food"){
	   			session.beginDialog('RecommendResturant');
	   		}else{
	   			var mm = "I don't recognize this sorry :(";
	   			session.send(mm);
	   		}
	    }
	]);
}
