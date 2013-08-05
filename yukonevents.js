
// Load up the Data

Locations = new Meteor.Collection("Locations");
Events = new Meteor.Collection("Events");
Categories = new Meteor.Collection("Categories");
Ads = new Meteor.Collection("Ads");
Users = new Meteor.Collection("Users");


if (Meteor.isClient) {
	Template.yukonevents.happenings = function () {
		return Events.find();
	};

	Template.yukonevents.rendered = function() {
		event_map = L.map('event-map', {
      center: [60.7161, -135.0550],
      zoom: 13,
    });
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(event_map);
    eventIcon = L.icon({
      iconUrl:'marker.png',
      iconSize: [64,64],
      iconAnchor: [33,64],
    });
    eventMarker = L.marker([60.7161, -135.0550],{draggable:true, icon:eventIcon}).addTo(event_map);
	};

	Template.eventsPanel.rendered = function(){
		// Add autocomplete to categories
		var cats = [];
		Categories.find().fetch().forEach(
			function (ob) {
				cats.push(ob.type);
			}
		);
		$('#event-category').typeahead([{
			name:'categories',
			local:cats,
		}]);
		// Add autocomplete to locations
		var locs = [];
		Locations.find().fetch().forEach(
			function (ob) {
				locs.push(ob.name);
			}
		);
    $('#event-location-name').typeahead([{
      name:'locations',
      local:locs,
    }]);

		// Add date pickers
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
			end = Date.parse($('#event-end').val());
			location_name = $('#event-location-name').val();
			event_url = $('#event-url').val(); 
			name = $('#event-name').val();
			location_geo = locationMarker.toGeoJSON();
			// Let's validate the data
			if (
					(Meteor.user() != null) &&
					(start > new Date()) &&
					(end > start) && 
					(category.length > 1)) {
				console.log("Adding Event");
				uid = Meteor.userId();
				added = new Date();
				Events.insert({
					'name':name,
					'start':start,
					'end':end, 
					'location':location_name, 
					'uid':uid, 
					'url':event_url,
					'added':added
				});
				Locations.insert({'name':location_name, 'geo':location_geo, 'uid':uid, 'added':added});				
				user = Users.find( { _id:uid } ).fetch();
				if (!user.length) {
					Users.insert(Meteor.user());
				};
        cat = Categories.find( { 'type':category} ).fetch();
        if (!cat.length) {
          Categories.insert({'type':category, 'uid':uid, 'added':added});
        };

				$('#event-feedback').text("Post Successful!");
			} else {
			// We should give more detailed feedback.
				$('#event-feedback').text("Please ensure all fields are filled out properly");
			};
		}
	});
	
}

if (Meteor.isServer) {
	if (Categories.find().count() == 0){
		cats = [
			{'type':'Music'},
			{'type':'Art'},
			{'type':'Plays'}
		];
		cats.forEach(function (ev) {
			Categories.insert(ev);
		});
	}	
}

