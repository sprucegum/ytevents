
// Load up the Data

Locations = new Meteor.Collection("Locations");
Events = new Meteor.Collection("Events");
Categories = new Meteor.Collection("Categories");
Ads = new Meteor.Collection("Ads");
Users = new Meteor.Collection("Users");

// Some helper functions
this.geo2lat = function (geoJSON) {
	var c = geoJSON.geometry.coordinates;
	return [c[1],c[0]]
};
this.randomColor = function (opacity) {
	// Generates a random color from the rainbow	
	color_string = 'rgba(';
	var ang = 2*Math.PI*Math.random();
	var offset = 2*Math.PI/3;
  for (var i = 0; i<3 ; i++){
    color_string += parseInt(255*Math.abs(Math.sin(ang+offset))) + ',';
		offset += 2*Math.PI/3;
  }
  return color_string + opacity + ')';
}
this.toggleCategory = function (catId) {
	unselectedCategories = Session.get('unselectedCategories');
	catPos = unselectedCategories.indexOf(catId);
	if (catPos >= 0) {
		$('#' + catId).removeClass('cat-button-faded');
		unselectedCategories.splice(catPos,1);
	} else {
		unselectedCategories.push(catId);
		$('#' + catId).addClass('cat-button-faded');
	}
	Session.set('unselectedCategories', unselectedCategories);
}

if (Meteor.isClient) {
	Session.setDefault('unselectedCategories', []);
	Template.eventCategories.categories = function () {
		return Categories.find().fetch();
	};
	Template.eventCategories.events({
		'click .catButton': function (e) {
			window.toggleCategory(e.target.id);
			Template.yukonevents.happenings();
		},
	});
	// Create the event objects that will be rendered in the browser
	Template.yukonevents.happenings = function () {
		var events = [];
		Events.find({ cid: {$not: {$in : Session.get('unselectedCategories')}}}).fetch().sort('').forEach(function(ev) {
			var loc = Locations.find({_id:ev.lid}).fetch()[0];
			ev.location = loc.name;
			ev.address = loc.address;
			var cat = Categories.find({_id:ev.cid}).fetch()[0];
			ev.category = cat.type;
			ev.color = cat.color;
			events.push(ev);
		});
		return events;
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
				locs.push({
					'value':ob.name,
					'geo':ob.geo,
					'_id':ob._id,
				});
			}
		);
    $('#event-location-name').typeahead([{
      name:'locations',
      local:locs,
    }]);
		// Add autocomplete event handling.
		map = null;
		locationMarker = null;
		selected_location = null;
		ta = $('.twitter-typeahead');
		ta.on('typeahead:selected',function(evt,data){
			if (data.geo) {
				var g = window.geo2lat(data.geo);
				locationMarker.setLatLng(g);
				map.panTo(g);
				selected_location = data._id;
			}
		});

		// Add date pickers
		$('#event-start').appendDtpicker();
		$('#event-end').appendDtpicker();
		map = L.map('map', {
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

	Template.happening.getDate = function (startDate, endDate, 
options) {
		dString = '';
		dString +=  moment(new Date(parseInt(startDate))).format('MMM Do h:mm a');
		dString += ' - ';
		dString += moment(new Date(parseInt(endDate))).format('h:mm a');
		return dString;
	};

	Template.eventsPanel.events({
		'click #submit-button': function () {
			category = $('#event-category').val();
			start = Date.parse($('#event-start').val());
			end = Date.parse($('#event-end').val());
			location_name = $('#event-location-name').val();
			location_address = $('#event-location-address').val();
			event_url = $('#event-url').val(); 
			name = $('#event-name').val();
			location_geo = locationMarker.toGeoJSON();
			// Let's validate the data
			if (
					(Meteor.user() != null) &&
					(start > new Date()) &&
					(end > start) && 
					(category.length > 1)) {
				uid = Meteor.userId();
				added = new Date();
				/* We need to check if the location has been
					selected or typed in manually.
					it's especially important to ensure that
					if a user autocompletes a location, but then
					changed a detail about it, that we either ask them
					to make a new category or allow them, if they have
					the rights, to modify an existing location/category.
				*/
				if (!selected_location) {
					loc = Locations.insert({
						'name':location_name,
						'address':location_address,
						'geo':location_geo,
						'uid':uid,
						'added':added,
					});	
				} else {
					loc = selected_location;
				}
				/* 
					Get category id, or add category and get id
				*/
        cat = Categories.find( { 'type':category} ).fetch();
        if (!cat.length) {
          cat = Categories.insert({
						'type':category,
						'uid':uid,
						'added':added,
						'color':window.randomColor(0.80),
					})
        } else {
					cat = cat[0]._id;
				};
				/* Create the event */
				Events.insert({
					'name':name,
					'start':start,
					'end':end, 
					'lid':loc,
					'cid':cat, 
					'uid':uid, 
					'url':event_url,
					'added':added,
				});
				/* 
					Add the user to the db if they don't already exist.
				*/
				user = Users.find( { _id:uid } ).fetch();
				if (!user.length) {
					Users.insert(Meteor.user());
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
			{'type':'Music', 'color':'rgba(254,119,135,0.8)'},
			{'type':'Art', 'color':'rgba(53,188,242,0.8)'},
			{'type':'Plays', 'color':'rgba(81,250,168,0.8)'}
		];
		cats.forEach(function (ev) {
			Categories.insert(ev);
		});
	}	
}

