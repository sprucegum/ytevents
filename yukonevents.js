
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
		locationIcon = L.icon({
			iconUrl:'marker.png',
			iconSize: [64,64],
			iconAnchor: [33,64],
		});
		locationMarker = L.marker([60.7161, -135.0550],{draggable:true, icon:locationIcon}).addTo(map);
		map.on('click', function(e) {
			locationMarker.setLatLng(e.latlng);
		});
	};

	Template.happening.getDate = function (thisDate, options) {
		return new Date(parseInt(thisDate));
	};

	Template.eventsPanel.events({
		'click #submit-button': function () {
			category = $('#event-category').val();
			start = Date.parse($('#event-start').val());
			
			location_name = $('#event-location-name').val();
			event_url = $('#event-url').val(); 
			name = $('#event-name').val();
			
			if ((Meteor.user() != null) && (start > new Date())) {
				console.log("Adding Event");
				uid = Meteor.userId();
				Occurs.insert({'name':name,'start':start, 'location':location_name, 'uid':uid, 'url':event_url});
				user = Users.find( { _id:uid } ).fetch();
				if (!user.length) {
					Users.insert(Meteor.user());
				};
				$('#event-feedback').text("Post Successful!");
			} else {
				$('#event-feedback').text("Please ensure all fields are filled out properly");
			};
		}
	});
	
}

if (Meteor.isServer) {
	
}

