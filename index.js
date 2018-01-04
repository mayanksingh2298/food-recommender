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
mongoose.connect("mongodb://localhost/foodreco");
// mongoose.connect("mongodb://imaginecup:imaginecup@ds054118.mlab.com:54118/foodreco-imagine-test");
//this is the online database
var app = express();
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
	res.render("index",{outlets:outlets});
});
app.put("/editRatings",isLoggedIn,function(req,res){
	user = req.user
	console.log(user)
	user.ratings[req.body.id] = req.body.rating
	User.findByIdAndUpdate(user.id,user,function(err,updatedUser){
		if(err){
			res.redirect("/login");
		}
		else{
			res.redirect("/secret");
		}
	} );

})

//check using a middleware is the user is already logged in
app.get("/secret",isLoggedIn,function(req,res){
	// console.log(req.user)
	// console.log(req.user.ratings)
	learnt=[]
	toLearn=[]
	toLearnInd=[]
	ratings = req.user.ratings
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
	

	azureML.mlApi(learnt,toLearn)
	console.log("after")


	res.render("secret",{ratings:ratings});
});
//Auth routes
app.get("/register",function(req,res){
	res.render("register");
});
//This one here registers the user to the database, we dont store the passoword but we store a hash
app.post("/register",function(req,res){

	//this function saves the user to the database, we dont store the password but we pass it as a second argument
	User.register(new User({username:req.body.username}),req.body.password,function(err,user){
		if(err){
			console.log(err);
			res.render("register");
		}else{
			//this one starts the session that is we have now logged in
			passport.authenticate("local")(req,res,function(){
				res.redirect("/secret");
			});
		}
	});
});

//LOGIn
//render login form
app.get("/login",function(req,res){
	res.render("login");
});
//this is a post request to login
//this is what is known as a middleware
//it runs before the callback function_which is empty here
app.post("/login", passport.authenticate("local",{
	successRedirect: "/secret",
	failureRedirect: "/login"
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
	res.redirect("/login");
}
app.get("*",function(req,res){
	res.send("This page doesn't exist...What were you looking for?")
})













var port = process.env.port || 8000
app.listen(port,function(){
	console.log("listening on port "+port)
});