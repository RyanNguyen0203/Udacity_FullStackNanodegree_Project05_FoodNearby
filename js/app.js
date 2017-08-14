/* GRAB GLOBAL SCOPE */
var outer = this;


/* GLOBAL CONSTANT */
var ratingLimit = 4;
var map;
var markers = [];
var locations = [];


/* FIRST-LAYER FUNCTION */
/* A function of level n+1 will be called inside the definition of a function of level n */

// Google Maps API's Callback
// Read user's input of location query
function getLocationInput(){

	var locationInput = "";

	// Add event listener to handle form submission
	$("#locationKey").submit(function(e){
		e.preventDefault();
		locationInput = $("#locationKey input").val();

		if (locationInput != ""){
			// Refresh location data
			outer.markers = [];
			outer.locations = [];

			// Get coordinates from location input with Google Maps API
			geocoder = new google.maps.Geocoder();
			geocoder.geocode( { 'address': locationInput}, function(results, status){
				if (status == 'OK') {
					// If there is no error with AJAX call
					var locationObject = results[0].geometry.location;
					var lat = locationObject.lat();
					var lng = locationObject.lng();
					initMap(lat, lng); /* Create map */
	      		} else {
	      			// Notify user about the AJAX call error
	      			$("#map").html('Geocode was not successful for the following reason: ' + status);
	      		};
	      	});

		} else {
	      	$("#map").html('Please enter something!');
		};

	});
};


/* SECOND-LAYER FUNCTION */

// Load map & request for eateries
function initMap(lat, lng){

	// Initialize map
	var pyrmont = new google.maps.LatLng(lat, lng);

	map = new google.maps.Map(document.getElementById('map'), {
	  center: pyrmont,
	  zoom: 13
	});

	// Create request
	var request = {
	    location: pyrmont,
	    radius: '500',
	    type: ['restaurant']
  	};

  	// Create service object
	service = new google.maps.places.PlacesService(map);

	// Search for relevant eateries
	// Callback: populateLocations
	service.nearbySearch(request, populateLocations);
};


/* THIRD-LAYER FUNCTION */

// service.nearbySearch's callback
// Handle response
function populateLocations(results, status) {

  if (status == google.maps.places.PlacesServiceStatus.OK) {
  	var i = 0;

  	// Parse a returned data
  	// And put them into the predefined global array locations
  	results.forEach(function(locationItem){

  		var newItem = {
  			id: i,
  			title: locationItem.name,
  			rating: locationItem.rating,
  			location: {
  				lat: locationItem.geometry.location.lat(),
  				lng: locationItem.geometry.location.lng(),
  			}
  		};

  		locations.push(newItem);
  		i++;
  	});

  	// Create location markers
  	makeMarkers();

  };
};



/* FOURTH-LAYER FUNCTION */

// Add location markers to map
function makeMarkers(){
	var largeInfowindow = new google.maps.InfoWindow();
	var bounds = new google.maps.LatLngBounds();

	// The following group uses the location array to create an array of markers on initialize.
	for (var i = 0; i < locations.length; i++) {

	  // Get the position from the location array.
		var position = locations[i].location;
		var title = locations[i].title;

	  // Create a marker per location, and put into markers array.
	 	var marker = new google.maps.Marker({
	    	map: map,
		    position: position,
		    title: title,
		    animation: google.maps.Animation.DROP,
		    id: i,
	        icon: makeMarkerIcon(defaultMarkerColor)
	    });
	  // Push the marker to our array of markers.
	  	markers.push(marker);
	  // Create an onclick event to open an infowindow at each marker.
	  	marker.addListener('click', function() {
	    	populateInfoWindow(this, largeInfowindow);
	  	});

	  	bounds.extend(markers[i].position);
	}

	// Extend the boundaries of the map for each marker
	map.fitBounds(bounds);

	// Implement knockout.js
	console.log("knockout called");
	knockOut();
}


/* FIFTH-LAYER FUNCTIONS */

// Populate the location's infowindow when the location's marker is clicked
function populateInfoWindow(marker, infowindow) {

	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
		infowindow.marker = marker;
		infowindow.setContent('<div>' + marker.title + '</div>');
		infowindow.open(map, marker);
		// Make sure the marker property is cleared if the infowindow is closed.
		infowindow.addListener('closeclick',function(){
			infowindow.setMarker = null;
		});
	}
}

// Knockout.js Implementation
// Add front-end logic to area aside from the Google Map

function knockOut() {

	var Rating = function(x) {
		self = this;
		self.rating = ko.observable(x);
		self.stars = ko.computed(function(){
			var part = "<span class='glyphicon glyphicon-star-empty' aria-hidden='true'></span>";
			var whole="";

			for(var i=0; i<self.rating(); i++){
				whole = whole + part;
			};

			return whole;
		});

	};

	var Location = function(data) {
		this.id = ko.observable(data.id);
		this.title = ko.observable(data.title);
		this.rating = ko.observable(data.rating);
		this.lat = ko.observable(data.location.lat);
		this.lng = ko.observable(data.location.lng);
		this.visible = ko.observable(true);
	};


	var ViewModel = function() {

		var self = this;

		// Create observable array of rating objects

		self.ratingList = ko.observableArray([]);

		for (var i=1; i<=ratingLimit; i++) {
			self.ratingList.push(new Rating(ratingLimit-i+1));
		};


		// Create observable array of location objects

		self.locationList = ko.observableArray([]);

		locations.forEach(function(dataItem){
			self.locationList.push(new Location(dataItem));
		});


		// "Clear Filtering" button
		// When there is no filtering, do not show "Clear Filtering" button
		self.shouldShowButton = ko.observable(false);

		self.clearFiltering = function(){
			// Reset all location.visible to true, display all locations
			for (i=0; i<self.locationList().length; i++){
				self.location = self.locationList()[i];
				self.location.visible(true);
			};

			// Once again, hide "Clear Filtering" button
			self.shouldShowButton(false);
		};

		// Filtering Buttons
		self.filterByRating = function(ratingItem){
			// Get the rating (no of stars) from ratingItem
			rating = ratingItem.rating();

			for (i=0; i<self.locationList().length; i++){

				self.location = self.locationList()[i];

				// Get the rating of location object
				var rate = self.location.rating();

				if ((rate<rating)||(rate>=rating+1)){
					self.location.visible(false);
				} else {
					self.location.visible(true);
				};
			};

			// Display "Clear Filtering" button
			self.shouldShowButton(true);

		};

		// Location list: when a location name is clicked on in the location list panel,
		// the corresponding marker will ... in the map
		self.activeMarkerID = ko.observable(-1);

		self.getMarker = function(locationItem){
			// reset the list item that was previously clicked on to default color
			id = self.activeMarkerID();
			if(id != -1){
				markerToDisable = markers[id];
				markerToDisable.icon = makeMarkerIcon(defaultMarkerColor);
				markerToDisable.setAnimation(null);
			};

			// Get the corresponding marker
			var marker = markers.filter(function(marker){
				return (marker.title == locationItem.title());
			})[0];

			// Store the id of activated marker
			self.activeMarkerID(marker.id);

			// Set bouncing animation
	        marker.setAnimation(google.maps.Animation.BOUNCE);
	        // Change marker's color:
	        marker.icon = makeMarkerIcon(highlightMarkerColor);

	        // Stop bouncing after 1 second
			setTimeout(function(){
				marker.setAnimation(null);
			}, 1000);

		};

		// Add event-listener to marker so that
		// clicking on the marker produces the same
		// effect as clicking on the location list item

		markers.forEach(function(marker){
			marker.addListener('click', function(){
				self.getMarker(self.locationList()[marker.id]);
			});
		});

	};


	// var locationListTemplate = $("<ul id='locationList' data-bind = 'foreach: locationList'><div data-bind='if: visible'><li data-bind='click: $parent.getMarker, css: {highlight: $parent.activeMarkerID() == id()}'><a><span class='fa fa-anchor solo' data-bind = 'text: title'></span></a></li></div></ul>");
	var locationListTemplate = $("#locationListTemplate").html();
	$("#locationListWrapper").empty();
	$("#locationListWrapper").append($(locationListTemplate));

	var ratingListTemplate = $("#ratingListTemplate").html();
	$("#ratingListWrapper").empty();
	$("#ratingListWrapper").append($(ratingListTemplate));

	// Apply binding again
	var obj = new ViewModel();
	ko.applyBindings(obj, document.getElementById("locationList"));
	ko.applyBindings(obj, document.getElementById("ratingList"));
	ko.applyBindings(obj, document.getElementById("clearFilterButton"));

	// Debug
	console.log("apply new binding");

};


/* HELPER FUNCTION */

function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage(
  	'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
  	'|40|_|%E2%80%A2',
  	new google.maps.Size(21, 34),
  	new google.maps.Point(0, 0),
  	new google.maps.Point(10, 34),
  	new google.maps.Size(21,34));
	console.log("color is changing");
	return markerImage;
};

var defaultMarkerColor = "D91E18";
var highlightMarkerColor = "2ECC71";




