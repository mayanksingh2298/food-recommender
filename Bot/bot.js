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
Converse();

function Converse(){
	var bot = new builder.UniversalBot(connector, function(session){
	    session.beginDialog('StartConverse');
	}).set('storage', inMemoryStorage); // Register in-memory storage 
    	
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
		        }
	    	}
	    }
	]);

	bot.dialog('RecommendResturant', [
	    function (session) {
	        builder.Prompts.text(session, "I advise you to try these resturants. I am prety sure that you will like the food at this place.");
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
}
