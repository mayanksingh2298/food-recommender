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

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
// var bot = new builder.UniversalBot(connector, function (session) {

//     if(session.message.text === "rate"){
// 	    var msg = new builder.Message(session)
// 		.text("Please Rate the resturant. It will help us to learn your taste. First write a name and then give desired rating. Thank You")
// 		.suggestedActions(
// 		builder.SuggestedActions.create(
// 			session, [
// 				builder.CardAction.imBack(session, "Your rating = 1", "1"),
// 				builder.CardAction.imBack(session, "Your rating = 2", "2"),
// 				builder.CardAction.imBack(session, "Your rating = 3", "3"),
// 				builder.CardAction.imBack(session, "Your rating = 4", "4"),
// 				builder.CardAction.imBack(session, "Your rating = 5", "5")
// 			]
// 		));
// 		session.send(msg);
//     }else{
//     	session.send("You said: %s", session.message.text);
//     }
// });


RatingSystem(1);

function RatingSystem(start){
	var inMemoryStorage = new builder.MemoryBotStorage();
	//uses a waterfall technique to prompt users for input.

	var bot = new builder.UniversalBot(connector, [
	    function (session) {
	        if(start === 1){
		        session.send("Welcome to the resturant rating system.");
	        }
	        builder.Prompts.text(session, "Please provide a resturant name");
	    },
	    function (session, results) {
	        session.dialogData.resturantName = results.response;
	        builder.Prompts.number(session, "Yes this exists.");
	    
	        var msg = new builder.Message(session)
			.text("Please Rate the resturant. It will help us to learn your taste. Thank You")
			.suggestedActions(
			builder.SuggestedActions.create(
				session, [
					builder.CardAction.imBack(session, "Your rating = 1", "1"),
					builder.CardAction.imBack(session, "Your rating = 2", "2"),
					builder.CardAction.imBack(session, "Your rating = 3", "3"),
					builder.CardAction.imBack(session, "Your rating = 4", "4"),
					builder.CardAction.imBack(session, "Your rating = 5", "5")
				]
			));
			session.send(msg);
	    },
	    function (session, results) {
	     	session.dialogData.resturantRating = results.response;   
	    	session.send(`Thank You.<br/> Details: <br/>Name: ${session.dialogData.resturantName} <br/>rating: ${session.dialogData.resturantRating}`);
	        builder.Prompts.text(session, "Continue y/n?");
	    },
	    function (session, results) {
	     	//session.dialogData.resturantRating = results.response;   
	    	//session.send(`Thank You.<br/> Details: <br/>Name: ${session.dialogData.resturantName} <br/>rating: ${session.dialogData.resturantRating}`);
	        if(results.response === "y"){
		//        session.send("Loopback");
				RatingSystem(0);
	        }else{
	        	session.endDialog();        	
	        }
	    }
	]).set('storage', inMemoryStorage); // Register in-memory storage	
}
