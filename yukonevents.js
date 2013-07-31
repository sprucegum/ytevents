
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

	Template.eventsPanel.events({
		'click #submit-button': function () {
			location_data = $('#event-location').val();
			name = $('#event-name').val();
			category = $('#event-category').val();
			date = $('#event-date').val();
			Occurs.insert({'name':name,'date':date, 'location':location_data});
		}
	});
	
}

if (Meteor.isServer) {
	
}

