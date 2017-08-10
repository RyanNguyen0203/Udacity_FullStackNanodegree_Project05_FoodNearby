// SIDEBAR RESPONSIVENESS

/*Menu-toggle*/
$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("active");
});

/*Scroll Spy*/
$('body').scrollspy({ target: '#spy', offset:80});

/*Smooth link animation*/
$('#toggle-link').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {

        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
        if (target.length) {
            $('html,body').animate({
                scrollTop: target.offset().top
            }, 1000);
            return false;
        }
    }
});


/*Google Maps API*/


// Create a new blank array for all the listing markers.

var map;

var markers = [];

// var locations = [
//   {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
//   {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
//   {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
//   {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
//   {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
//   {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
// ];

var locations = [];

var lat = 40.7413549;
var lng = -73.9980244;

function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	var pyrmont = new google.maps.LatLng(lat, lng);

	map = new google.maps.Map(document.getElementById('map'), {
	  center: pyrmont,
	  zoom: 13
	});

	var request = {
	    location: pyrmont,
	    radius: '500',
	    type: ['restaurant']
  	};

	service = new google.maps.places.PlacesService(map);
	service.nearbySearch(request, populateLocations);

	// Debug
	// console.log("End of callback: initMap!");
	// console.log("locations:");
	// console.log(locations);
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
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

function populateLocations(results, status) {
	// Get place objects to populate |locations|

  if (status == google.maps.places.PlacesServiceStatus.OK) {
  	results.forEach(function(locationItem){
  		// console.log(locationItem.geometry.location.lat());
  		// console.log(locationItem.geometry.location.lng());
  		// console.log(locationItem.name);

  		var newItem = {
  			title: locationItem.name,
  			location: {
  				lat: locationItem.geometry.location.lat(),
  				lng: locationItem.geometry.location.lng(),
  			}
  		};

  		locations.push(newItem);

  	});

  	// Debug
  	// console.log("callback: populateLocations called");
  	// console.log("locations:");
  	// console.log(locations);

  	makeMarkers();

  }
}

function makeMarkers(){
	// Add markers to map based on the places in |location|
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
		    id: i
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
}