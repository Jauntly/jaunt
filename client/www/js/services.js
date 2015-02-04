angular.module('starter.services')

/**
 * A simple example service that returns some data.
 */
.service('Jaunts', function($http, $q) {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var geoCoder = new google.maps.Geocoder();


  return {

    selectJaunts: function(queryObj){
      return $http.get('/api/jaunts', { 
        params: queryObj,
        headers: {
            'Content-Type': 'application/json'
        }
      });
    },
    geoCode: function(loc){
      var deferred = $q.defer();
      geoCoder.geocode({address: loc}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        //map.setCenter(results[0].geometry.location);
        console.log(results[0].geometry.location);
        var lat = results[0].geometry.location.lat();
        var lng = results[0].geometry.location.lng();
        deferred.resolve([lng, lat]);
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
      })
      return deferred.promise;
    },
    // returns all jaunt data.  to be removed
    allJaunts: function() {
      return jaunts = jauntFakers;
    },
    // returns selected Jaunt data
    getJaunt: function(jaunts, jauntId) {
      for (var i = 0; i < jaunts.length; i++) {
        if (jaunts[i]._id === jauntId) {
          return jaunts[i];
        }
      }
      return null;
    },
    // returns selected stop data
    getStop: function(jaunts, jauntId, stopId) {
      var stops = this.getJaunt(jaunts, jauntId).stops;

      for (var i = 0; i < stops.length; i++) {
        if (stops[i]._id === stopId) {
          return stops[i];
        }
      }
      return null;
    },
    getAllPolys : function(jaunts){
      var colors = ['red', 'blue', 'green', 'orange', 'purple']; 
      var polys = [];


      for(var i = 0; i< jaunts.length; i++){
        var linePoints = [];
        for(var j = 0; j < jaunts[i].steps.length; j++){
          var startPoint = new google.maps.LatLng(jaunts[i].steps[j].start_location.coordinates[1], jaunts[i].steps[j].start_location.coordinates[0]);
          var endPoint = new google.maps.LatLng(jaunts[i].steps[j].end_location.coordinates[1], jaunts[i].steps[j].end_location.coordinates[0]);
          linePoints.push(startPoint);
          linePoints.push(endPoint);

        }
        var poly = new google.maps.Polyline({strokeColor: colors[i%(colors.length)]});
        poly.setPath(linePoints);
        poly.jauntID = jaunts[i]._id;
        polys.push(poly);
      }
      return polys;  
    }
  }
});
