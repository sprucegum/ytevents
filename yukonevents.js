
// Load up the Data

Locations = new Meteor.Collection("Locations");
Occurs = new Meteor.Collection("Occurrences");
Happenings = new Meteor.Collection("Events");
Owners = Locations = new Meteor.Collection("Owners");
Categories = new Meteor.Collection("Categories");
Ads = new Meteor.Collection("Ads");

if (Meteor.isClient) {
	Template.yukonevents.happenings = function () {
		return Occurs.find();
	}

	Template.yukonevents.events({
		'click .new-data': function () {
			var t = event.currentTarget;
			console.log(t);
		}
	});

}

if (Meteor.isServer) {
}

