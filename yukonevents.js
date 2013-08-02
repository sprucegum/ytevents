
// Load up the Data

Locations = new Meteor.Collection("Locations");
Occurs = new Meteor.Collection("Occurrences");
Happenings = new Meteor.Collection("Events");
Owners = Locations = new Meteor.Collection("Owners");
Categories = new Meteor.Collection("Categories");
Ads = new Meteor.Collection("Ads");
Users = new Meteor.Collection("Users");


if (Meteor.isClient) {
	Template.yukonevents.happenings = function () {
		return Occurs.find();
	};

	Template.eventsPanel.rendered = function(){
		console.log("making date things");
		$('#event-start').appendDtpicker();
		$('#event-end').appendDtpicker();
	};

	Template.eventsPanel.events({
		'click #submit-button': function () {
			category = $('#event-category').val();
			date = $('#event-date').val();
			location_data = $('#event-location').val();
			name = $('#event-name').val();
			if (Meteor.user() != null) {
				uid = Meteor.userId();
				Occurs.insert({'name':name,'date':date, 'location':location_data, 'uid':uid});
				user = Users.find( { _id:uid } ).fetch();
				console.log(user);
				if (!user.length) {
					Users.insert(Meteor.user());
				}
			}
		}
	});
	
}

if (Meteor.isServer) {
	
}

