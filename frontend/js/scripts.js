$(document).ready(function(){
  //auto refresh the page every 5 seconds, for incoming coordinates.
  setInterval(function() {
    $("#trackBusButton").trigger('click');
  }, 10000);

  var timeDatabase = new Array();

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

  //create the google map, with all its components
  function initMap(points, userPoint) {
    var uluru = points[(points.length)-1];  //the last point recorded
    var distanceToUser = google.maps.geometry.spherical.computeDistanceBetween(uluru, userPoint)

    map = new google.maps.Map(document.getElementById('map'), {
      scrollwheel: false,
      zoomControl: false,
      zoom: 15,
      center: uluru,
    });

    //bus icon marker
    var busMarker = new google.maps.Marker({
      position: uluru,
      map: map,
      icon: 'busIcon.png'
    });

    var personMarker = new google.maps.Marker({
      position: userPoint,
      map: map,
      icon: 'personIcon.png'
    })

    //path of the bus is traced by coordinates.
    var pathCoords = points
    var flightPath = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    ////////////////////////////////////////////////////////////////////
    // SEARCH BOX
    ////////////////////////////////////////////////////////////////////
    // var input = document.getElementById('pac-input');
    // var searchBox = new google.maps.places.SearchBox(input);
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    //
    // // Bias the SearchBox results towards current map's viewport.
    // map.addListener('bounds_changed', function() {
    //     searchBox.setBounds(map.getBounds());
    // });
    //
    // searchBox.addListener('places_changed', function() {
    //     var places = searchBox.getPlaces();
    //
    //     if (places.length == 0) {
    //       return;
    //     }
    //
    //       // Clear out the old markers.
    //     markers.forEach(function(marker) {
    //       marker.setMap(null);
    //     });
    //
    //     markers = [];
    //
    //       // For each place, get the icon, name and location.
    //     var bounds = new google.maps.LatLngBounds();
    //     places.forEach(function(place) {
    //
    //       if (!place.geometry) {
    //         console.log("Returned place contains no geometry");
    //         return;
    //       }
    //       var icon = {
    //         url: place.icon,
    //         size: new google.maps.Size(71, 71),
    //         origin: new google.maps.Point(0, 0),
    //         anchor: new google.maps.Point(17, 34),
    //         scaledSize: new google.maps.Size(25, 25)
    //       };
    //
    //         // Create a marker for each place.
    //       markers.push(new google.maps.Marker({
    //         map: map,
    //         icon: icon,
    //         title: place.name,
    //         position: place.geometry.location
    //       }));
    //
    //       if (place.geometry.viewport) {
    //         // Only geocodes have viewport.
    //         bounds.union(place.geometry.viewport);
    //       } else {
    //         bounds.extend(place.geometry.location);
    //       }
    //     });
    //     map.fitBounds(bounds);
    // });

    //////////////////////////////////////////////////////////////////////

    runSnapToRoad(flightPath.getPath());
    timeToUser(uluru, userPoint);

    if(userPoint == 0) {
      $("#distance").html("I can't get your position, but you can track the bus above")
    }
    else {
      $("#distance").html("The bus is " + timeToDest + " away")
    }
  }

  //this will snap the otherwise jagged polyline to the shape of the road.
  //makes path trace look more realistic.
  function runSnapToRoad(path) {
    var pathValues = [];
    console.log(path)
    var len = google.maps.geometry.spherical.computeLength(path)
    console.log(len)
    for (var i = 0; i < path.b.length; i++) {
      pathValues.push(path.getAt(i).toUrlValue());
    }
    console.log(pathValues)
    $.get('https://roads.googleapis.com/v1/snapToRoads', {
      interpolate: true,
      key: 'AIzaSyCgtJHLDHcpdKKN68yTKMZxiQczNeVhMxc',
      path: pathValues.join('|')
    }, function(data) {
      processSnapToRoadResponse(data);
      drawSnappedPolyline();
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

  function drawSnappedPolyline() {
    var snappedPolyline = new google.maps.Polyline({
      path: snappedCoordinates,
      strokeColor: 'red',
      strokeWeight: 3
    });
    snappedPolyline.setMap(map)
  }

  //calculate how far away the bus is from the user using distance matrix.
  function timeToUser(mostRecentPoint, destination) {
    var time;
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
    {
      origins: [mostRecentPoint],
      destinations: [destination],
      travelMode: 'DRIVING'
    }, function(data) {
        time = data.rows[0].elements[0].duration.text
        $("#distance").html("The bus is " + time + " away")
    });
  }

  //run this function when the button requesting the map is clicked.
  $("#trackBusButton").click(function(){
    //make an ajax GET request to the heroku server which will load from sql.
    console.log('im clicked!');
    $.ajax({
        url: "http://pure-hollows-72424.herokuapp.com",
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
              if(i >= timeDatabase.length) {
                  timeDatabase[i] = data[i].timeAdded
                  $('#fromTime').append($('<option>', {
                    value: timeDatabase[i],
                    text: timeDatabase[i]
                  }))
                  $('#toTime').append($('<option>', {
                    value: timeDatabase[i],
                    text: timeDatabase[i]
                  }))
              }
              points[i] = new google.maps.LatLng(parseFloat(data[i].latitude).toFixed(3), parseFloat(data[i].longitude).toFixed(3));
              markup = '<tr><td>' + data[i].timeAdded + '</td><td>' + data[i].latitude + '</td><td>' + data[i].longitude + '</td><td></tr>';
              // $('#busHistory tbody').append(markup);
            }
            //this block gets the position of the user from the browser. Hardcoded right now.
            initMap(points, new google.maps.LatLng(22.258, 114.192))
          }
        },
        //error handler for server connection
        error: function(data) {
          alert('it seems the server is unresponsive, please try again later');
        }
    });
  });

  $("#submitHistoryTracking").click(function(){
    console.log($())
  })

});
