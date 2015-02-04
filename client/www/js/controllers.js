'use strict';

angular.module('starter.controllers', [])

.controller('MapCtrl', function($scope, $ionicLoading, $ionicActionSheet, $timeout, $ionicModal, Jaunts, $q, $rootScope) {

  $scope.initialize = function () {

    var mapOptions = {
      center: new google.maps.LatLng(37.7833, -122.4167),
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      draggableCursor:'crosshair',
      mapTypeControl: false,
      panControl: false,
      zoomControl: false,
      streetViewControl: false,
      styles: [{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"color":"#f7f1df"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":"#d0e3b4"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"geometry","stylers":[{"color":"#fbd3da"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#bde6ab"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffe15f"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#efd151"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"black"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#cfb2db"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#a2daf2"}]}]
    };

    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

    $scope.userLoc = {};
    $scope.userMarker = {};
    $scope.watchId = null;
    $scope.polys = [];
    $scope.markers = [];
    $scope.stopovers = [];
    $scope.infowindows = [];
    $scope.index = 0;
    $scope.query = {};  //user queries
    $scope.queryObj = {}; //sent to the db


    $scope.centerOnMe()
    .then(function (pos) {
      // $scope.pos = pos;
      $scope.center = $scope.map.getCenter();
      $scope.show(0);
      // call moveUser every 10seconds
      // setTimeout(function() {setInterval( $scope.moveUser(), 10000)} ,  );
      
    });
    $scope.placeUser();
  };

  $scope.findUser = function(callback) {
    navigator.geolocation.getCurrentPosition(function(position) {
      $scope.userLoc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      callback(position);
    });
  };



  $scope.placeUser = function(callback) {
    navigator.geolocation.getCurrentPosition(function(position) {
      $scope.userLoc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      $scope.userMarker = new google.maps.Marker({
        position: $scope.userLoc,
        map: $scope.map,
        title: 'You are here',
        icon: '/img/jaunty_tiny.png',
      });
      // $scope.markers.push(userMarker);
      setInterval( $scope.moveUser, 5000 );
      // $scope.watchId = navigator.geolocation.watchPosition($scope.moveUser); 
    });
  };

  $scope.moveUser = function() {
    navigator.geolocation.getCurrentPosition(function (pos) {
      $scope.userLoc = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      $scope.userMarker.setPosition($scope.userLoc); 
      console.log($scope.userMarker);
    });
  };


  $scope.clickCrosshairs = function (){
    $scope.center = $scope.map.getCenter();
    $scope.show(  $scope.index);
  };

  $scope.centerOnMe = function () {
    return $q(function(resolve, reject) {
      if (!$scope.map) {
        reject('No map loaded');
      }

      $ionicLoading.show({
        template: '<i class="ion-loading-c"></i><div>Getting Location</div>',
        animation: 'fade-in',
        showBackdrop: false,
        maxWidth: 200
      });

      navigator.geolocation.getCurrentPosition(function (pos) {
        console.log('Got pos', pos);
        $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        $ionicLoading.hide();
        resolve(pos);
      }, function (error) {
        reject('Unable to get location: ' + error.message);
      });
    });
  };

  /*// adjust from global scope? Popover for new users?
  $scope.search = 'jaunts near me!';

  // adds Action Sheet for simple search
  $scope.showSearch = function() {

    // Show action sheet
    var hideSearch = $ionicActionSheet.show({
      buttons: [
        {text: 'jaunts near me!'},
        {text: 'jaunts to a location!'},
        {text: 'option 3!'}
      ],
      titleText: "<b>What do you fancy?<b>",
      buttonClicked: function(index, choice) {
        $scope.search = choice.text;
        $scope.index = index;
        $scope.show($scope.index);
        return true;
      }
    });

    // Hide sheet after three seconds
    $timeout(function() {
      hideSearch();
    }, 3000);
  };*/


  //calls Jaunts.getAllPolys to receive an array of polylines; loops through to attach to map
  $scope.show = function(index){

    var query = {};
    var coordinates = [$scope.center.lng(), $scope.center.lat()];
    removeFromMap($scope.polys);
    removeFromMap($scope.markers);

    //if statement sets up the query.
    if(index === 0){
      query.start_location = {
        coordinates: coordinates,
        range: 1000
      };
    } else if(index === 1){
      query.end_location = {
        coordinates : coordinates,
        range: 1000
      };
    } else if(index === 2){
      console.log('do some stuff for choice 3');
    }

    for(var key in $scope.queryObj){
      query[key] = $scope.queryObj[key];
    }

    //the db call

    $ionicLoading.show({
      template: '<i class="ion-loading-c"></i><div>Finding Jaunts</div>',
      animation: 'fade-in',
      showBackdrop: false,
      maxWidth: 200,
    });

    hideMarkers();

    Jaunts.selectJaunts(query).then(function(data) {
      setTimeout( $ionicLoading.hide, 500);

      $scope.jaunts = data.data;
      //places on rootscope to persist across controllers
      $rootScope.jaunts = data.data;
      $scope.polys = Jaunts.getAllPolys($scope.jaunts);

      addToMap($scope.polys);

      showMarkers();

    });

    // Remove the location listener calling moveUser()
    // navigator.geolocation.clearWatch($scope.watchId);
  };

  var findUser = function(callback) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var userLoc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        callback(position);
      });
    };



  var hideMarkers = function(){
    for(var i = 0; i < $scope.infowindows.length; i++){
      $scope.infowindows[i].close();
      $scope.markers[i].setMap(null);
    }
    $scope.markers.length = 0;
    $scope.infowindows.length = 0;
  }

  var markerMaker = function(lat, lng, title, icon, stops, jaunt){
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat,lng),
      map: $scope.map,
      title: title,
      icon: icon,
      animation: google.maps.Animation.DROP,
      stops: stops,
      jaunt: jaunt
    })
    return marker;
  };


  var startContentString = function(id, title, rating, votes) {
    var contentString = '<div class="infoW">'+
            '<a href="/#/tab/jaunts/' +
            id +
            '">' +
            '<h5 class="title">' +
            title +
            '</h5>' +
            '<img src="/img/' + 
            rating + 
            '.png" class="rating"' + 
            '>' +
            '<small> via ' +
            votes +
            ' votes</small>' +
            '</a>' +
            '</div>' /* closes infoW container*/;
    return contentString
  }
  var stopoverContentString = function(jauntID, id, title) {
    var contentString = '<div class="infoW">'+
            '<a href="/#/tab/jaunts/' +
            jauntID + '/' + id +
            '">' +
            '<h5 class="title">' +
            title +
            '</h5>' +
            '</a>' +
            '</div>' /* closes infoW container*/;
    return contentString
  }

  var getJauntInfoForWindow = function(jaunt) {
    return [jaunt._id, jaunt.meta.title, Math.round(jaunt.meta.rating), jaunt.meta.votes];
  };

  var createInfoWindow = function(jaunt){
    var infowindow = new google.maps.InfoWindow({
        content: startContentString.apply(null, getJauntInfoForWindow(jaunt)),
        pixelOffset: new google.maps.Size(0, -60)
    });
    return infowindow
  }


  var createStartMarker = function(jaunt) {
    var greenBoneIcon = '/img/green-dog-bone-hi-35.png';
    var lat = jaunt.start_location.coordinates[1];
    var lng = jaunt.start_location.coordinates[0];
    var title = jaunt.meta.title;
    var stops = jaunt.stops;
    var jaunt = jaunt;
    return markerMaker(lat, lng, title, null, stops, jaunt);
  };

  var stopMarkerMaker = function(lat, lng, title, icon, id, jauntID){
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat,lng),
      map: $scope.map,
      title: title,
      icon: icon,
      animation: google.maps.Animation.DROP,
      id: id,
      jauntID: jauntID
    })
    return marker;
  };

  var createStopsMarker = function(stop) {
    var whiteBoneIcon = '/img/white-bone-25.png';
    var coordinates = stop.location.coordinates;
    var lat = coordinates[1];
    var lng = coordinates[0];
    var title = stop.name;
    var id = stop._id
    var jauntID = stop.jauntID
    return stopMarkerMaker(lat, lng, title, whiteBoneIcon, id, jauntID);
  };


  var showMarkers = function(){

    var connectWindowAndMarker = function(marker, infowindow) {
      google.maps.event.addListener(marker, 'click', function(event) {
        $scope.markers.forEach(function(otherMarker) {
          if (otherMarker !== marker) {
            otherMarker.setAnimation(null);
            otherMarker.setMap(null);
          }
        });

        removeFromMap($scope.stopovers);
        $scope.infowindows.forEach(function(InfoWindow) {
          InfoWindow.close();
        })
        if (marker.jaunt) {
          $scope.polys.forEach(function(poly) {
            var jaunt = marker.jaunt;
            var jauntID = jaunt._id;
            if (poly.jauntID !== jauntID) {
              removeFromMap([poly])
            }
          });
        }

        var stops = marker.stops;
        if (stops) {        
          for (var j = 0; j < stops.length; j++) {
            var stop = stops[j];
            if (stop) {
              stop.jauntID = marker.jaunt._id
              var stopover = createStopsMarker(stop);
              $scope.stopovers.push(stopover)

              var infowindow2 = new google.maps.InfoWindow({
                  content: stopoverContentString(stopover.jauntID, stopover.id, stopover.title),
                  pixelOffset: new google.maps.Size(0, -60)
              });

              $scope.infowindows.push(infowindow2);
              // connectWindowAndMarker(stopover, infowindow2)
              var connect = function (infowindow2){
                google.maps.event.addListener(stopover, 'click', function(event) {
                  removeFromMap($scope.infowindows);
                  infowindow2.setPosition(event.latLng);
                  infowindow2.open($scope.map);
                })
              }(infowindow2);
            }
          }
        }

        marker.setAnimation(google.maps.Animation.BOUNCE);
        infowindow.setPosition(event.latLng);
        infowindow.open($scope.map);
      })

      google.maps.event.addListener(infowindow, 'closeclick', function(event) {
          marker.setAnimation(null);
          removeFromMap($scope.polys);
          removeFromMap($scope.markers);
          removeFromMap($scope.stopovers);
          removeFromMap($scope.infowindows);
          addToMap($scope.polys);
          addToMap($scope.markers);
      });

      google.maps.event.addListener($scope.map, 'click', function(event) {
          marker.setAnimation(null);
          infowindow.close();
          removeFromMap($scope.polys);
          removeFromMap($scope.markers);
          removeFromMap($scope.stopovers);
          removeFromMap($scope.infowindows);
          addToMap($scope.polys);
          addToMap($scope.markers);
      });

    };

    for(var i = 0; i < $scope.jaunts.length; i++){
      var jaunt = $scope.jaunts[i];
      var infowindow = createInfoWindow(jaunt);
      var marker = createStartMarker(jaunt);

      $scope.markers.push(marker);
      $scope.infowindows.push(infowindow);


      connectWindowAndMarker(marker, infowindow);

    }
  };

  var addToMap = function(items){
    for(var i = 0; i < items.length; i++){
      items[i].setMap($scope.map);
    }
  };

  var removeFromMap = function(items){
    for(var i = 0; i < items.length; i++){
      items[i].setMap(null);
    }
  };

  // add modal for filtering
  $ionicModal.fromTemplateUrl('templates/filter.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $scope.openModal = function() {
      $scope.modal.show();
    };
    $scope.closeModal = function() {
      $scope.modal.hide();
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
      // Execute action
    });


    if (!$scope.map) {
      $scope.initialize();
    }

  $scope.buildQuery = function(){
    $scope.queryObj = {};

    $scope.modal.hide();
    if($scope.query.tags){
      var mytags = $scope.query.tags.split(',');
      for(var i = 0; i < mytags.length; i++){
        mytags[i] = mytags[i].toLowerCase();
      }
      $scope.queryObj.tags =  mytags;

    }
    if($scope.query.duration){
      var duration = {max: $scope.query.duration};
      $scope.queryObj.duration = duration;
    }
    if($scope.query.food || $scope.query.drinks || $scope.query.activities || $scope.query.sights){
      $scope.queryObj.categories = [];

      if($scope.query.food){
        $scope.queryObj.categories.push('food');
      }
      if($scope.query.drinks){
        $scope.queryObj.categories.push('drinks');
      }
      if($scope.query.activities){
        $scope.queryObj.categories.push('activities');
      }
      if($scope.query.sights){
        $scope.queryObj.categories.push('sights');
      }
    }

    console.log($scope.queryObj);
    $scope.show($scope.index);

  };

  $scope.clearFilter = function(){
    $scope.queryObj = {};
    $scope.modal.hide();
    $scope.query = {};
    $scope.show($scope.index);

  };

})

.controller('JauntsCtrl', function($scope, Jaunts, $ionicModal, $rootScope) {


  $ionicModal.fromTemplateUrl('templates/filter.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $scope.openModal = function() {
      $scope.modal.show();
    };
    $scope.closeModal = function() {
      $scope.modal.hide();
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
      // Execute action
    });
})

.controller('JauntDetailCtrl', function($scope, $stateParams, Jaunts, $rootScope) {

  $scope.jaunt = Jaunts.getJaunt($rootScope.jaunts, $stateParams.jauntId);
})

.controller('PlaceDetailCtrl', function($scope, $stateParams, Jaunts, $rootScope) {

  $scope.stop = Jaunts.getStop($rootScope.jaunts, $stateParams.jauntId, $stateParams.placeId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})

.controller('HomeCtrl', function($scope, $rootScope, $state, Jaunts) {
  $scope.settings = {
    enableFriends: true
  };

  //get initial position
  navigator.geolocation.getCurrentPosition(function (pos) {
    console.log(pos);
    var query = {
      'start_location' : {
        'coordinates' : [
          pos.coords.longitude,
          pos.coords.latitude
        ],
        'range': 1000
      }
    };

    //set position coordinates in rootScope
    $rootScope.pos = pos;

    angular.element( document.querySelector( 'div.home' ) ).addClass('fade');

    Jaunts.selectJaunts(query).then(function(data){
      $scope.jaunts = data.data;

      //places on rootscope to persist across controllers
      $rootScope.jaunts = data.data;

      angular.element( document.querySelector( '.background' ) ).addClass('fade');

      setTimeout(function(){$state.go('tab.jaunts');}, 400);
    });
  }, function (error) {
    console.log('Unable to get location: ' + error.message);
  });
});
