var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());
var inMemoryStorage = new builder.MemoryBotStorage();
//uses a waterfall technique to prompt users for input.
RatingSystem();

function RatingSystem(){
	var bot = new builder.UniversalBot(connector, function(session){
	    var msg = "Welcome to the resturant rating system.";
	    session.send(msg);
	    session.beginDialog('RateResturant');
	}).set('storage', inMemoryStorage); // Register in-memory storage 
    	
	bot.dialog('RateResturant', [
	   function (session) {
	        builder.Prompts.text(session, "Please provide a resturant name");
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
	        builder.Prompts.text(session, "Continue y/n?");
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
		        	session.endDialog();
		        }
	    	}
	    }
	]);
}
