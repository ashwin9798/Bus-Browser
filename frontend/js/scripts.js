// $(document).ready(function(){
//   //auto refresh the page every 5 seconds, for incoming coordinates.
//   setTimeout(function() {
//     $("#button").trigger('click');
//   }, 5000);
//
//   //run this function when the button is clicked.
//   $("button").click(function(){
//     //make an ajax GET request to the heroku server which will load from sql.
//     $.ajax({
//         url: "http://pure-hollows-72424.herokuapp.com",
//         type: 'GET',
//         success: function(data){
//           //store the gps coordinates from the object into an array.
//           var points = new Array();
//           //userPoint stores the position of the user (received from browser)
//           var userPoint;
//           //error message for when the database request is empty
//           if(data.length == 0){
//             $("#error").html("Oops, no data on the requested bus :(");
//           }
//           else {
//             //store in the points array as LatLng objects, which are required for API.
//             for(var i=0; i < data.length; i++) {
//               points[i] = new google.maps.LatLng(parseFloat(data[i].latitude).toFixed(3), parseFloat(data[i].longitude).toFixed(3))
//             }
//             //this block gets the position of the user from the browser.
//             if (navigator.geolocation) {
//               navigator.geolocation.getCurrentPosition(function(position) {
//                   console.log(position.coords.latitude)
//                   userPoint = new google.maps.LatLng(parseFloat(position.coords.latitude), parseFloat(position.coords.longitude))
//                   initMap(points, userPoint)
//               });
//             }
//           }
//         },
//         //error handler for server being
//         error: function(data) {
//           alert('it seems the server is unresponsive, please try again later');
//         }
//     });
//
//   });
// });
//
// function initMap(points, userPoint) {
//   var uluru = points[(points.length)-1];  //the last point recorded
//   var distanceToUser = google.maps.geometry.spherical.computeDistanceBetween(uluru, userPoint)
//   var map = new google.maps.Map(document.getElementById('map'), {
//     zoom: 6,
//     center: uluru,
//   });
//
//   var marker = new google.maps.Marker({
//     position: uluru,
//     map: map
//   });
//
//   var pathCoords = points
//   var flightPath = new google.maps.Polyline({
//       path: pathCoords,
//       geodesic: true,
//       strokeColor: '#FF0000',
//       strokeOpacity: 1.0,
//       strokeWeight: 2
//   });
//   runSnapToRoad(flightPath.getPath())
//   // flightPath.setMap(map);
//   if(userPoint == 0) {
//     $("#distance").html("I can't get your position, but you can track the bus above")
//   }
//   else {
//     $("#distance").html("The bus is " + distanceToUser + " meters away")
//   }
// }
//
// function runSnapToRoad(path) {
//   var pathValues = [];
//   console.log(path)
//   var len = google.maps.geometry.spherical.computeLength(path)
//   console.log(len)
//   for (var i = 0; i < path.b.length; i++) {
//     pathValues.push(path.getAt(i).toUrlValue());
//   }
//   $.get('https://roads.googleapis.com/v1/snapToRoads', {
//     interpolate: true,
//     key: 'AIzaSyCgtJHLDHcpdKKN68yTKMZxiQczNeVhMxc',
//     path: pathValues.join('|')
//   }, function(data) {
//     processSnapToRoadResponse(data);
//     drawSnappedPolyline();
//   });
// }
// function processSnapToRoadResponse(data) {
//   snappedCoordinates = [];
//   placeIdArray = [];
//   for (var i = 0; i < data.snappedPoints.length; i++) {
//     var latlng = new google.maps.LatLng(
//       data.snappedPoints[i].location.latitude,
//       data.snappedPoints[i].location.longitude);
//       snappedCoordinates.push(latlng);
//       placeIdArray.push(data.snappedPoints[i].placeId);
//     }
// }
//
// function drawSnappedPolyline() {
//   var snappedPolyline = new google.maps.Polyline({
//     path: snappedCoordinates,
//     strokeColor: 'black',
//     strokeWeight: 3
//   });
//   snappedPolyline.setMap(map);
//   polylines.push(snappedPolyline);
// }
