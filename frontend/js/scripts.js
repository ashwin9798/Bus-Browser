$(document).ready(function(){

  ////////////////////////////////////////
  // GLOBALS!!!!
  /////////////////////////////////////////////
  var pointsDatabase = new Array();
  var flightPath = new Array();
  var snappedPolyline;
  var busMarker;
  var personMarker;
  var isTrackingRealTime = true;
  var lastPoint;
  var userPoint;
  //also includes:

  //snappedCoordinates

  //////////////////////////////////////////////////

  //auto refresh the page every 8 seconds, for incoming coordinates.
  setInterval(function() {
    console.log("hi")
    if(isTrackingRealTime) {
      $("#trackBusButton").trigger('click');
    }
  }, 8000);

  setTimeout(function() {
    initMap();
  }, 10)

  //get user position from browser
  function getPos() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
          console.log(position.coords.latitude)
          return new google.maps.LatLng(parseFloat(position.coords.latitude), parseFloat(position.coords.longitude))
      });
    }
  }

  var map;

  $("#busHistory").hide()

  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      scrollwheel: false,
      zoomControl: true,
      minZoom: 8,
      maxZoom: 16,
      zoom: 15,
      center: new google.maps.LatLng(0,0)
    });

    ////////////////////////////////////////////////////////////////////
    // SEARCH BOX
    ////////////////////////////////////////////////////////////////////
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    var markers = [];

    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
          return;
        }

          // Clear out the old markers.
        markers.forEach(function(marker) {
          marker.setMap(null);
        });

        markers = [];

          // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {

          if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
          }
          // var icon = {
          //   url: place.icon,
          //   size: new google.maps.Size(71, 71),
          //   origin: new google.maps.Point(0, 0),
          //   anchor: new google.maps.Point(17, 34),
          //   scaledSize: new google.maps.Size(25, 25)
          // };

            // Create a marker for each place.
          markers.push(new google.maps.Marker({
            map: map,
            title: place.name,
            position: place.geometry.location
          }));

          timeToUser(lastPoint, new google.maps.LatLng(markers[0].position.lat(), markers[0].position.lng()), markers[0].title)

          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        map.fitBounds(bounds);
    });
  }

  //create the google map, with all its components
  function updateMap(points, userPoint) {
    lastPoint = points[(points.length)-1];  //the last point recorded

    map.setCenter(lastPoint)

    //bus icon marker

    if(busMarker != null) {
      busMarker.setMap(null);
      busMarker = null;
    }

    busMarker = new google.maps.Marker({
      position: lastPoint,
      map: map,
      icon: 'frontend/busIcon.png'
    });

    if(personMarker != null) {
      personMarker.setMap(null);
      personMarker = null;
    }

    personMarker = new google.maps.Marker({
      position: userPoint,
      map: map,
      icon: 'frontend/personIcon.png'
    })

    //path of the bus is traced by coordinates.
    var pathCoords = points
    flightPath[0] = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    //////////////////////////////////////////////////////////////////////

    runSnapToRoad(flightPath[0].getPath(), true);
    timeToUser(lastPoint, userPoint, "");

    if(userPoint == 0) {
      $("#distance").html("I can't get your position, but you can track the bus above")
    }
  }

  //this will snap the otherwise jagged polyline to the shape of the road.
  //makes path trace look more realistic.
  function runSnapToRoad(path, isRealTime) {
    var pathValues = [];
    var len = google.maps.geometry.spherical.computeLength(path)
    for (var i = 0; i < path.b.length; i++) {
      pathValues.push(path.getAt(i).toUrlValue());
    }
    $.get('https://roads.googleapis.com/v1/snapToRoads', {
      interpolate: true,
      key: 'AIzaSyCgtJHLDHcpdKKN68yTKMZxiQczNeVhMxc',
      path: pathValues.join('|')
    }, function(data) {
      processSnapToRoadResponse(data);
      var polylineColor = 'red';
      if(!isRealTime) {
        polylineColor = 'grey'
      }
      drawSnappedPolyline(polylineColor);
    });
  }

  //helper functions for snapping the road.
  function processSnapToRoadResponse(data) {
    snappedCoordinates = [];
    placeIdArray = [];
    for (var i = 0; i < data.snappedPoints.length; i++) {
      var latlng = new google.maps.LatLng(
        data.snappedPoints[i].location.latitude,
        data.snappedPoints[i].location.longitude);
        snappedCoordinates.push(latlng);
        placeIdArray.push(data.snappedPoints[i].placeId);
      }
  }

  function drawSnappedPolyline(color) {
    snappedPolyline = new google.maps.Polyline({
      path: snappedCoordinates,
      strokeColor: color,
      strokeWeight: 3
    });
    snappedPolyline.setMap(map)
  }

  //calculate how far away the bus is from the user using distance matrix.
  function timeToUser(mostRecentPoint, destination, destinationString) {
    var time;
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
    {
      origins: [mostRecentPoint],
      destinations: [destination],
      travelMode: 'DRIVING'
    }, function(data) {
        time = data.rows[0].elements[0].duration.text
        if(destinationString == "")
          $("#distance").html("The bus is " + time + " away from you")
        else
          $("#distance").html("The bus is " + time + " away from " + destinationString)
    });
  }

  //run this function when the button requesting the map is clicked.
  $("#trackBusButton").click(function(){
    //make an ajax GET request to the heroku server which will load from sql.
    isTrackingRealTime = true;
    $.ajax({
        url: "https://pure-hollows-72424.herokuapp.com/data",
        type: 'GET',
        success: function(data){
          //store the gps coordinates from the object into an array.
          var points = new Array();
          //userPoint stores the position of the user (received from browser)
          var userPoint;
          //error message for when the database request is empty
          if(data.length == 0){
            $("#error").html("Oops, no data on the requested bus :(");
          }
          else {
            var markup;
            $('#busHistory tr:not(#header)').remove()
            //store in the points array as LatLng objects, which are required for API.
            for(var i=0; i < data.length; i++) {
              if(i >= pointsDatabase.length) {
                  pointsDatabase[i] = data[i]
                  $('#startTime').append($('<option>', {
                    value: i,
                    text: pointsDatabase[i].timeAdded
                  }))
                  $('#endTime').append($('<option>', {
                    value: i,
                    text: pointsDatabase[i].timeAdded
                  }))
              }
              points[i] = new google.maps.LatLng(parseFloat(data[i].latitude).toFixed(3), parseFloat(data[i].longitude).toFixed(3));
              markup = '<tr><td>' + data[i].timeAdded + '</td><td>' + data[i].latitude + '</td><td>' + data[i].longitude + '</td><td></tr>';
              // $('#busHistory tbody').append(markup);
            }
            //this block gets the position of the user from the browser. Hardcoded right now.
            updateMap(points, new google.maps.LatLng(22.258, 114.192))
          }
        },
        //error handler for server connection
        error: function(data) {
          alert('it seems the server is unresponsive, please try again later');
        }
    });
  });

  $("#submitHistoryTracking").click(function(){
    var startTime = $('#startTime :selected')
    var endTime = $('#endTime :selected')

    //autorefresh should not happen now
    isTrackingRealTime = false;

    if(startTime.val() >= endTime.val()) {
      alert("invalid time interval")
    }
    else {
      $("#map").css({'border': '1px solid black', 'outline-color': 'red'});
      var slicedPath = new Array();
      for(var i=startTime.val(); i<=endTime.val(); i++) {
        slicedPath[i-startTime.val()] = new google.maps.LatLng(pointsDatabase[i].latitude, pointsDatabase[i].longitude)
      }

      if(busMarker != null) {
        busMarker.setMap(null);
        busMarker = null;
      }

      busMarker = new google.maps.Marker({
        position: slicedPath[slicedPath.length-1],
        map: map,
        icon: 'frontend/busIcon.png'
      });

      flightPath[0] = new google.maps.Polyline({
          path: slicedPath,
          geodesic: true,
          strokeColor: 'grey',
          strokeOpacity: 1.0,
          strokeWeight: 2
      });

      snappedPolyline.setMap(null);
      runSnapToRoad(flightPath[0].getPath(), false);
    }
  });
})
