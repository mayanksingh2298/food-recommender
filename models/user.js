var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	ratings: [],
	noOfRated: Number,
	location:{
		latitude: String,
		longitude: String,
		name: String
	}
});
//this would take all methods from this passport... package and add them in our schema
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",UserSchema);