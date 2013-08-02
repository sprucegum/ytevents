
// Load up the Data

Locations = new Meteor.Collection("Locations");
Occurs = new Meteor.Collection("Occurrences");
Happenings = new Meteor.Collection("Events");
Categories = new Meteor.Collection("Categories");
Ads = new Meteor.Collection("Ads");
Users = new Meteor.Collection("Users");


if (Meteor.isClient) {
	Template.yukonevents.happenings = function () {
		return Occurs.find();
	};

	Template.eventsPanel.rendered = function(){
		$('#event-start').appendDtpicker();
		$('#event-end').appendDtpicker();
		var map = L.map('map', {
    	center: [60.7161, -135.0550],
    	zoom: 13,
		});
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

	};

	Template.happening.getDate = function (thisDate, options) {
		return new Date(parseInt(thisDate));
	};

	Template.eventsPanel.events({
		'click #submit-button': function () {
			category = $('#event-category').val();
			start = Date.parse($('#event-start').val());
			location_data = $('#event-location').val();
			name = $('#event-name').val();
			if (Meteor.user() != null) {
				uid = Meteor.userId();
				Occurs.insert({'name':name,'start':start, 'location':location_data, 'uid':uid});
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

