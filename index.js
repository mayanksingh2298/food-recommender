var http = require("http");
var https = require("https");
var querystring = require("querystring");
var fs = require('fs');

var express  				= require('express'),
    mongoose 				= require('mongoose'),
    passport 				= require("passport"),
    bodyParser 				= require("body-parser"),
    User					= require("./models/user"),
    outlets					= require("./scrape/output.json")
    LocalStrategy 			= require("passport-local"),
    passportLocalMongoose 	= require("passport-local-mongoose"),
    methodOverride          = require("method-override"),
    azureML                 = require("./public/ML-API.js")
// console.log(outlets.length)
// azureML.test("hello world")
mongoose.connect("mongodb://localhost/foodrecos");
// mongoose.connect("mongodb://imaginecup:imaginecup@ds054118.mlab.com:54118/foodreco-imagine-test");
//this is the online database
var app = express();
app.use('/static',express.static(__dirname+"/static"));
app.use(methodOverride("_method"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(require("express-session")({
	secret: "this is used as key for encryption and decryption",
	resave: false,
	saveUninitialized: false
}));

//saying that our app will be using these stuff
app.use(passport.initialize());
app.use(passport.session());

//used for serializing and deserializing the session
passport.use(new LocalStrategy(User.authenticate()));//defining that our database would use local strategy
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/",function(req,res){
	isLoggedIn = 0
	if(req.user)
		isLoggedIn = 1
	res.render("index",{outlets:outlets,isLoggedIn:isLoggedIn});
});
app.put("/editRatings",isLoggedIn,function(req,res){
	user = req.user
	console.log(user)
	if(!user.ratings[req.body.id]){
		user.noOfRated=Number(user.noOfRated)+1
	}
	user.ratings[req.body.id] = req.body.rating
	User.findByIdAndUpdate(user.id,user,function(err,updatedUser){
		if(err){
			res.redirect("/");
		}
		else{
			res.redirect("/profile");
		}
	} );

})
app.post("/friends",isLoggedIn,function(req,res){
	// console.log(req.body)
	actualFriends=[req.user.username]
	avgRatings=req.user.ratings
	friends=req.body.friends
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
				// console.log(actualFriends)
				noOfRated=0
				for(var j=0;j<avgRatings.length;j++){
					if (avgRatings[j]){
						noOfRated++
						avgRatings[j] = Number(avgRatings[j])/actualFriends.length
					}
				}
				console.log(avgRatings)
				//////////////////////
				learnt=[]
				toLearn=[]
				toLearnInd=[]
				predictedData=[]
				if (noOfRated<4){
					res.render("friends",{actualFriends:actualFriends,learntData:[]});
				}else{
					for(var j=0;j<outlets.length;j++){
						// console.log(i)
						// console.log("********************"+j)
						if(avgRatings[j]==null){
							toLearn.push(JSON.stringify(outlets[j].featureVector))
							toLearnInd.push(j)
						}else{
							tmp = outlets[j].featureVector
							tmp["Rating"]=Math.round(avgRatings[j]).toString()
							// console.log(tmp["Rating"]+"***")
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
					// getPred(data);
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
				           // console.log(d.toString("utf8"))
				            predictedData = JSON.parse(d.toString("utf8"))["Results"]["output1"]
				       		sortedArray=[]
				       		maxDiff=0
				       		maxRate=0
				       		for (var j=0;j<predictedData.length;j++){//to get max to scale them
				       			tmpLatLong = outlets[toLearnInd[j]]["lat,long"].split(",")
				       			tmpLat = tmpLatLong[0]
				       			tmpLong = tmpLatLong[1]
				       			diff = Math.abs(req.user.location.latitude-tmpLat)+Math.abs(req.user.location.longitude-tmpLong)
				       			maxDiff	= Math.max(maxDiff,diff)
				       			predRate = Number(predictedData[j]["Scored Labels"])
				       			maxRate = Math.max(maxRate,predRate)
				       		}
				       		for (var j=0;j<predictedData.length;j++){
				       			tmpLatLong = outlets[toLearnInd[j]]["lat,long"].split(",")
				       			tmpLat = tmpLatLong[0]
				       			tmpLong = tmpLatLong[1]
				       			diff = Math.abs(req.user.location.latitude-tmpLat)+Math.abs(req.user.location.longitude-tmpLong)
				       			predRate = Number(predictedData[j]["Scored Labels"])
				       			sortedArray.push([-diff/maxDiff+predRate/maxRate,predRate,toLearnInd[j]])
				       		}
				       		sortedArray.sort()
				       		sortedArray.reverse()
				       		sortedArray=sortedArray.splice(0,8)
				       		// console.log(sortedArray)
				       		console.log(req.user.noOfRated)
							res.render("friends",{actualFriends:actualFriends,learntData:sortedArray});

				        });
				    });
				    reqPost.write(dataString);
				    reqPost.end();
				    reqPost.on('error', function(e){
				        console.error(e);
				        });
				}
				//////////////////////

			}
		})
	}
})
app.put("/editLocation",isLoggedIn,function(req,res){
	user = req.user
	user.location = {
		name:req.body.locationName||"not provided",
		latitude:req.body.latitude,
		longitude:req.body.longitude
	}
	User.findByIdAndUpdate(user.id,user,function(err,updatedUser){
		if(err){
			res.redirect("/");
		}
		else{
			console.log(updatedUser)
			res.redirect("/profile");
		}
	} );
})

//check using a middleware is the user is already logged in
app.get("/profile",isLoggedIn,function(req,res){
	// console.log(req.user)
	// console.log(req.user.ratings)
	learnt=[]
	toLearn=[]
	toLearnInd=[]
	predictedData=[]
	ratings = req.user.ratings
	if (req.user.noOfRated<4){
		res.render("profile",{ratings:ratings,learntData:[],location:req.user.location});
	}else{


		for(var i=0;i<outlets.length;i++){
			// console.log(i)
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
		// getPred(data);
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
	           // console.log(d.toString("utf8"))
	            predictedData = JSON.parse(d.toString("utf8"))["Results"]["output1"]
	       		sortedArray=[]
	       		maxDiff=0
	       		maxRate=0
	       		for (var i=0;i<predictedData.length;i++){//to get max to scale them
	       			tmpLatLong = outlets[toLearnInd[i]]["lat,long"].split(",")
	       			tmpLat = tmpLatLong[0]
	       			tmpLong = tmpLatLong[1]
	       			diff = Math.abs(req.user.location.latitude-tmpLat)+Math.abs(req.user.location.longitude-tmpLong)
	       			maxDiff	= Math.max(maxDiff,diff)
	       			predRate = Number(predictedData[i]["Scored Labels"])
	       			maxRate = Math.max(maxRate,predRate)
	       		}
	       		for (var i=0;i<predictedData.length;i++){
	       			tmpLatLong = outlets[toLearnInd[i]]["lat,long"].split(",")
	       			tmpLat = tmpLatLong[0]
	       			tmpLong = tmpLatLong[1]
	       			diff = Math.abs(req.user.location.latitude-tmpLat)+Math.abs(req.user.location.longitude-tmpLong)
	       			predRate = Number(predictedData[i]["Scored Labels"])
	       			sortedArray.push([-diff/maxDiff+predRate/maxRate,predRate,toLearnInd[i]])
	       		}
	       		sortedArray.sort()
	       		sortedArray.reverse()
	       		sortedArray=sortedArray.splice(0,8)
	       		// console.log(sortedArray)
	       		console.log(req.user.noOfRated)
				res.render("profile",{ratings:ratings,learntData:sortedArray,location:req.user.location});

	        });
	    });
	    reqPost.write(dataString);
	    reqPost.end();
	    reqPost.on('error', function(e){
	        console.error(e);
	        });
	}

	// res.render("secret",{ratings:ratings});
});
//Auth routes
//This one here registers the user to the database, we dont store the passoword but we store a hash
app.post("/register",function(req,res){

	//this function saves the user to the database, we dont store the password but we pass it as a second argument
	toMakeUser = {
		username:req.body.username,
		noOfRated:0,
		location:{
			name:req.body.locationName||"not provided",
			latitude:req.body.latitude,
			longitude:req.body.longitude
		}
	}
	User.register(new User(toMakeUser),req.body.password,function(err,user){
		if(err){
			console.log(err);
			res.render("register");
		}else{
			//this one starts the session that is we have now logged in
			console.log(user)
			passport.authenticate("local")(req,res,function(){
				res.redirect("/profile");
			});
		}
	});
});

//LOGIn
//this is a post request to login
//this is what is known as a middleware
//it runs before the callback function_which is empty here
app.post("/login", passport.authenticate("local",{
	successRedirect: "/profile",
	failureRedirect: "/"
}) ,function(req,res){
	//empty
});

//logout
app.get("/logout",function(req,res){
	//no changes to database, simply destroing the session details from req
	req.logout();
	res.redirect("/");
});

//next is what will happen next, which we dont need to fill as it knows what to do(express)
//next here refers to the callback code
//actually next refers 
function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/");
}
app.get("*",function(req,res){
	res.send("This page doesn't exist...What were you looking for?")
})


var port = process.env.port || 8001
app.listen(port,function(){
	console.log("listening on port "+port)
});