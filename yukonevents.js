
// Load up the Data

Locations = new Meteor.Collection("Locations");
Occurs = new Meteor.Collection("Occurrences");
Happenings = new Meteor.Collection("Events");
Owners = Locations = new Meteor.Collection("Owners");
Categories = new Meteor.Collection("Categories");
Ads = new Meteor.Collection("Ads");

if (Meteor.isClient) {
	Template.yukonevents.happenings = function () {
		return Occurs.find({}, {sort: {date:1}});
	}
}

if (Meteor.isServer) {

}
