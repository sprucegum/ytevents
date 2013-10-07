//Declare the collections
Locations = new Meteor.Collection("ytLocations");
Events = new Meteor.Collection("ytEvents");
Categories = new Meteor.Collection("ytCategories");
Ads = new Meteor.Collection("ytAds");
Users = new Meteor.Collection("ytUsers");

// Some helper functions
// these get attached to window, ie window.geo2lat
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

this.setAlpha = function(alpha, cstring){
  var re = /[0-1]\.[0-9]*\)/;
  return cstring.replace(re, alpha + ")");
};

this.revealPanel = function(){
  $(".event-add").removeClass("hidden-panel");
  $(".event-add").addClass("revealed-panel");
}
this.hidePanel = function(){
  $(".event-add").addClass("hidden-panel");
  $(".event-add").removeClass("revealed-panel");
}

if (Meteor.isClient) {
  Meteor.subscribe("Locations");
  Meteor.subscribe("Events");
  Meteor.subscribe("Categories");
  Meteor.subscribe("Ads");
  
  // A little bit of code to track which events we're looking at (for transitions)
  window.visEvents = [];
  window.visEventsNext = [];
  

	Session.setDefault('unselectedCategories', []);
	Template.eventCategories.categories = function () {
    var validCats = [];
		Categories.find().fetch().forEach(function(catOb){
      var count = countEvents(catOb._id);
      if (count) {
        catOb.type = catOb.type + ' (' + count + ')';
        validCats.push(catOb);
      }
    });
    return validCats;
	};
	Template.eventCategories.events({
		'click .catButton': function (e) {
			window.toggleCategory(e.target.id);
			Template.yukonevents.happenings();
		},
	});
	// Load up the event objects that will be rendered in the browser
  function prepareEvent(ev){
      console.log("what are we preparing?",ev);
      var loc = Locations.find({_id:ev.lid}).fetch()[0];
      ev.location = loc.name;
      ev.address = loc.address;
      var cat = Categories.find({_id:ev.cid}).fetch()[0];
      if (!cat){
        return null;
      }
      console.log("checking out the category",cat);
      ev.category = cat.type;
      ev.color = window.setAlpha(0.45,cat.color);
      return ev;
  };

  function countEvents(catId){
    return Events.find({cid:catId, end:{$gt:new Date().getTime()}}).count();
  }
  // Dirty little hack from here https://github.com/meteor/meteor/issues/281
  Handlebars.registerHelper('labelBranch', function (label, options) {
    var data = this;
    console.log("what's going on here?",this);
    return Spark.labelBranch(Spark.UNIQUE_LABEL, function () {
      return options.fn(data);
    });
  });

	Template.yukonevents.happenings = function () {
		var events = [];
    var eventIds = [];
    console.log("visibleEvents:",window.visEvents);
		Events.find({end: {$gt:new Date().getTime()} ,
                 cid: {$not: {$in : Session.get('unselectedCategories')}}}
    ).fetch().sort().forEach(function(ev) {
      // Check to see if the event is already visible,
      // if not, then apply the new-event class to it, which
      // will give it an intro transition.
      eventIds.push(ev._id);
		});
    /* To track which events have been removed, we need to 
      iterate over the new list comparing each element to the 
      list of old events. When we find an event in the old
      list which isn't in the new list, we must lookup the data for the old event,
      then give it a css property signifying its removal.      
    */
    if (window.visEvents.length > eventIds.length){
      window.visEvents.forEach(function(evId){
        ev = Events.find({_id:evId}).fetch();
        ev = prepareEvent(ev[0]);
        if (eventIds.indexOf(evId) == -1){
          //the event should be made invisible
          ev.classes = "old-event";
        } else {
          //the event should be made invisible
          ev.classes = "";
        }
        events.push(ev);
      })
    } else {
      eventIds.forEach(function(evId){
        ev = Events.find({_id:evId}).fetch();
        ev = prepareEvent(ev[0]);
        if (!ev){
          return null;
        }
        console.log("Searching visevents for :",ev._id);
        if (window.visEvents.indexOf(ev._id) == -1){
          ev.classes = "new-event";
        } else {
          ev.classes = "";
        }
  
			  events.push(ev);
      })
    }
    /*This is a gross little workaround.
    // For some reason this computation gets called twice
    // so i had to add a second list to keep track
    // of visibility.
    */
    window.visEvents = window.visEventsNext;
    window.visEventsNext = eventIds;
		return events.sort(function(a,b){
      return (a.start - b.start)
    });
	};

	Template.addHappening.rendered = function(){
    // Display the event submission dialog when the user is logged in.
    Deps.autorun(function(){
      if (!Meteor.userId()){
        $('.event-add').hide();  
        return;
      } else {
        $('.event-add').show();
      }
    });
    Deps.autorun(function(){
		  // Add autocomplete to categories
		  var cats = [];
      console.log("Creating category typeahead");
		  Categories.find().fetch().forEach(
			  function (ob) {
				  cats.push(ob.type);
          console.log(ob);
          console.log("Adding category to typeahead");
			  }
		  );
      if (cats.length > 0){
        Session.set('cats', cats);
        console.log(cats);
      }
    });
    Deps.autorun(function(){
      console.log("populating category autocomplete");
      if (Session.get('cats')){
        $('#event-category').typeahead('destroy');
		    $('#event-category').typeahead([{
			    name:'categories',
			    local:Session.get('cats'),
		    }]);
      }
    });  

    Deps.autorun(function(){
		  // Add autocomplete to locations
		  var locs = [];
		  
      console.log("Creating location typeahead");
      console.log(Locations.find().fetch());
  
      Locations.find().fetch().forEach(
			  function (ob) {
				  locs.push({
					  'value':ob.name,
					  'geo':ob.geo,
            'address':ob.address,
					  '_id':ob._id,
				  });
			  }
		  );
      if (locs.length > 0){
        Session.set('locs',locs);
      }
   
    });

    Deps.autorun(function(){
      if (Session.get('locs')) {
        $('#event-location-name').typeahead([{
          name:'locations',
          local:Session.get('locs'),
        }])
      }
    });

    ta = $('.twitter-typeahead');
		ta.on('typeahead:selected',function(evt,data){
      if (data.address){
        $('#event-location-address').val(data.address)
      }
      
			if (data.geo) {
				var g = window.geo2lat(data.geo);
				locationMarker.setLatLng(g);
				map.panTo(g);
				window.selected_location = data._id;
			}
      
      return true;
		});
    
		// Add date pickers
    //checking datetime input
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
  Template.addHappening.preserve('.event-add');
	Template.addHappening.events({
		'click #submit-button': function () {
			category = $('#event-category').val();
			start = Date.parse($('#event-start').val());
			end = Date.parse($('#event-end').val());
			location_name = $('#event-location-name').val();
			location_address = $('#event-location-address').val();
			event_url = $('#event-url').val();
			event_desc = $('#event-desc').val(); 
			event_price = $('#event-price').val(); 
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
				if (Locations.find({'name':location_name}).fetch().length == 0) {
					loc = Locations.insert({
						'name':location_name,
						'address':location_address,
						'geo':location_geo,
						'uid':uid,
						'added':added,
					});	
				} else {
					loc = Locations.find({'name':location_name}).fetch().pop()._id;
          console.log(loc);
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

        //Let's add an http:// to the url if it isn't there already.
        var url_reg = /^http:\/\//;
        if (!url_reg.exec(event_url)){
          if (event_url.length > 0){
            event_url = "http://" + event_url;
          };
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
          'desc':event_desc,
          'price':event_price,
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
        
        // Reset the event add dialog.
        $('.event-add').remove();
        $('.events').prepend(Template.addHappening());
        
        
        
			} else {
			// Feedback for rejected submissions.
        var feedback = "Please fill out the following fields: ";
        if (!(start > new Date())){
          feedback += "Start Date, ";
        }
        if (!(end > start)) {
          feedback += "End Date, ";
        }
        if (!(category.length > 1)) {
          feedback += "Category";
        }
				$('#event-feedback').text(feedback);
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
	};
  Meteor.publish("Locations", function () {
    return Locations.find(); // everything
  });
  Meteor.publish("Events", function () {
    return Events.find(); // everything
  });
  Meteor.publish("Categories", function () {
    return Categories.find(); // everything
  });
  Meteor.publish("Users", function () {
    return Users.find(); // everything
  });

	
}

