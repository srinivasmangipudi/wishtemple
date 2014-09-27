// Wishes -- client

Meteor.subscribe("directory");
Meteor.subscribe("wishes");
Meteor.subscribe("images");

//Meteor.subscribe('freshWishes', Session.get('limit'));

// If no wish selected, or if the selected wish was deleted, select one.
Meteor.startup(function () {
  Deps.autorun(function () {

    if(!Session.get("wishliststate"))
      Session.set("wishliststate", "All Wishes");

    //show hide modals depending on state
    if(Session.get("showCreateDialog"))
    {
      $('#addwish').val("");
      $('#adddesc').val("");
      $('#addanonymous').val("");
      $('#addprivate').val("");

      $('#myModal').modal('show');
    }
    else
      { $('#myModal').modal('hide'); }

    if(Session.get("showInviteDialog"))
      { $('#inviteModal').modal('show'); }
    else
      { $('#inviteModal').modal('hide'); }

    if(Session.get("showFulfillDialog"))
      { $('#fulfillModal').modal('show'); }
    else
      { $('#fulfillModal').modal('hide'); }

    //select amount of fresh wishes to load
    Session.set('limit', 100);

    var selected = Session.get("selected");
    console.log("In Deps selected="+selected);

    if(typeof(selected) != 'undefined')
    {
      if (! selected || ! Wishes.findOne(selected))
      {
        var wish = Wishes.findOne();
        if (wish)
          Session.set("selected", wish._id);
        else
          Session.set("selected", null);

        console.log("randomly selecting one wish:"+wish._id);
      }
    }
    else
    {
      console.log("plotting first lot");

      addWishMarkersOnMap();
      Session.set("dirty", "false");
    }

    var wliststate = Session.get("wishliststate");
    //console.log("wliststate:"+wliststate);
    if(typeof(wliststate) == 'undefined')
    {
      //console.log("setting current wishes as default");
      Session.set("wishliststate", "currentwishes");
    }
    else
    {
      
    }

    var isDirty = Session.get("dirty");
    //console.log("dirty="+isDirty);

    if(typeof(isDirty) == 'undefined')
    {
      //console.log("setting dirty first time!");
      Session.set("dirty", "true");
      isDirty = Session.get("dirty");
    }

    //console.log("dirty="+isDirty);

    if(isDirty == 'true')
    {

      addWishMarkersOnMap();
      Session.set("dirty", "false");
    }
    else
    {
      //console.log("not dirty!"); 
    }
  });
});


///////////////////////////////////////////////////////////////////////////////
// Global Helper functions

UI.registerHelper('wlDisplayName', function(user_id) {
  //code -- call {{stub}} anywhere in template
  //console.log("in stub name:" + user_id);
  var user = Meteor.users.findOne(user_id);

  if (user._id === Meteor.userId())
    return "me";
  return displayName(user);
});

UI.registerHelper('wlDisplayPic', function(user_id) {
  //code -- call {{stub}} anywhere in template
  //console.log("in stub pic:" + user_id);
  var user = Meteor.users.findOne(user_id);

  return displayPic(user, "small");
});

UI.registerHelper('wlDisplayNameForWish', function(wish_id) {
  //code -- call {{stub}} anywhere in template
  //console.log("in stub name:" + wish_id);
  var wish = Wishes.findOne(wish_id);
  if(wish.hasOwnProperty("anonymous") && wish.anonymous === true)
    return "Anonymous";

  if(wish.public === false)
    return "Secret";

  var user = Meteor.users.findOne(wish.owner);
  if (user._id === Meteor.userId())
    return "me";
  return displayName(user);
});

UI.registerHelper('wlDisplayPicForWish', function(wish_id) {
  //code -- call {{stub}} anywhere in template
  //console.log("in stub pic:" + wish_id);
  var wish = Wishes.findOne(wish_id);
  if(wish.hasOwnProperty("anonymous") && wish.anonymous === true)
    return displayPic("anonymous", "small");

  if(wish.public === false)
    return displayPic("secret", "small");

  var user = Meteor.users.findOne(wish.owner);
  return displayPic(user, "small");
});

UI.registerHelper('systemLatestWishTitle', function() {
  //code -- call {{stub}} anywhere in template
  console.log("in stub systemlatestwish:");
  var wish = Wishes.findOne({public: true}, {sort: {createdOn:-1}});
  console.log("latest:"+wish);

  if(wish)
    return wish.title;
  else
    return "";
});

UI.registerHelper('systemLatestWishId', function(checkid) {
  //code -- call {{stub}} anywhere in template
  console.log("in stub systemlatestwishId:");
  var wish = Wishes.findOne({public: true}, {sort: {createdOn:-1}});
  console.log("latest:"+wish);

  if(wish && wish._id == checkid)
    return getRandomColor();
  else
    return "";
});

UI.registerHelper('getRandomColor', function(checkid) {
  return getRandomColor();
});

///////////////////////////////////////////////////////////////////////////////
// Wish details sidebar

Template.details.profile = function() {
  var user = Session.get("profile");

  //console.log("profile:" + user);

  if(user)
  {
    return true;
  }
  else
  {
    return false;
  }
};


Template.details.wish = function () {
  return Wishes.findOne(Session.get("selected"));
};

Template.details.isAnonymous = function () {
  var wish = Wishes.findOne(Session.get("selected"));
  if(wish.hasOwnProperty("anonymous") && wish.anonymous === true)
    return true;
  else
    return false;
};

Template.details.isFulfilled = function () {
  var wish = Wishes.findOne(Session.get("selected"));
  if(wish.hasOwnProperty("isfulfilled") && wish.isfulfilled === true)
    return true;
  else
    return false;
};

Template.details.anyWishes = function () {
  return Wishes.find().count() > 0;
};

Template.details.creatorName = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner._id === Meteor.userId())
    return "me";
  return displayName(owner);
};

Template.details.whooseProfile = function () {
  var owner = Meteor.users.findOne(Session.get("profile"));
  if (owner._id === Meteor.userId())
    return "me";
  return profileName(owner);
};

Template.details.isMyProfile = function () {
  var owner = Meteor.users.findOne(Session.get("profile"));
  if (owner._id === Meteor.userId())
    return true;
  return false;
};

Template.details.profileName = function () {
  var owner = Meteor.users.findOne(Session.get("profile"));
  return profileName(owner);
};

Template.details.profileNameChanged = function() {
  var temp = Session.get("profileNameChanged");

  if(temp)
  {
    return "glyphicon-ok";
  }
  return "";
};

Template.details.creatorPic = function () {
  var user = Meteor.users.findOne(this.owner);
  return displayPic(user, "small");
};

Template.details.creatorLargePic = function () {
  var user = Meteor.users.findOne(Session.get("profile"));
  return displayPic(user, "large");
};

Template.details.canRemove = function () {
  return this.owner === Meteor.userId() && attending(this) === 0;
};

Template.details.maybeChosen = function (what) {
  var myRsvp = _.find(this.rsvps, function (r) {
    return r.user === Meteor.userId();
  }) || {};

  return what == myRsvp.rsvp ? "chosen btn-inverse" : "";
};

Template.details.error = function () {
  return Session.get("createError");
};

Template.details.events({
  'click .rsvp_yes': function () {
    Session.set("x_rsvp_answer", "yes");
    openFulfillDialog();
    //Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Session.set("x_rsvp_answer", "maybe");
    openFulfillDialog();
    //Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Session.set("x_rsvp_answer", "no");
    openFulfillDialog();
    //Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .invite': function () {
    openInviteDialog();
    return false;
  },
  'click .remove': function () {
    Wishes.remove(this._id);
    return false;
  },
  'click .profile': function () {
    Session.set("profile", this.owner);
  },
  'click .cancel-profile': function() {
    Session.set("profile", null);
  },
  'blur .profile-name': function(event, template) {
    var user = Session.get("profile");
    var input = template.find(".profile-name").value;
    //console.log(input);
    //console.log(user);

    Meteor.users.update({_id:user}, { $set: {"profile.name": input}});
    Session.set("profileNameChanged", true);
    return true;
  },
  'click .profile-name': function(event, template) {
    Session.set("profileNameChanged", "");
    return true;
  },
  'click .wish_fulfilled': function(event, template){
    //console.log("wish fulfilled clicked");
    Meteor.call("wish_fulfilled", Session.get("selected"), "yes");
  },
});

///////////////////////////////////////////////////////////////////////////////
// WishList widget
Template.wishlist.wishlist = function()
{
  var limit = Session.get("limit");
  var wliststate = Session.get("wishliststate");
  var user = Session.get("profile");
  console.log("wishlist:" + user);
  //console.log("wishliststate:" + wliststate);

  /*if(user)
  {
    //console.log(user);
    return Wishes.find({"public": true, owner:user}, {sort: {createdOn: -1}, limit: limit});
  }
  else
  {
    if(wliststate == "mywishes")
    {
      return Wishes.find({"public": true, owner:Meteor.userId()}, {sort: {createdOn: -1}, limit: limit});
    }
    else
      return Wishes.find({"public": true}, {sort: {createdOn: -1}, limit: limit});
  }*/

  if(user)
  {
      return Wishes.find({"public": true, owner:user, anonymous:false, isfulfilled:false}, {sort: {createdOn: -1}, limit: limit});
  }
  else
  {
    if(wliststate == "My Wishes")
    {
      return Wishes.find(
              {$or: [{invited: Meteor.userId()}, {owner: Meteor.userId()}]}, {sort: {createdOn: 1}, limit: limit});
    }
    if(wliststate == "Anonymous Wishes")
    {
      return Wishes.find({"public": true, anonymous:true, isfulfilled:false}, {sort: {createdOn: -1}, limit: limit});
    }
    if(wliststate == "Fulfilled Wishes")
    {
      return Wishes.find({"public": true, isfulfilled:true}, {sort: {createdOn: -1}, limit: limit});
    }
    else
    {
      // All Wishes
      return Wishes.find({"public": true, isfulfilled:false}, {sort: {createdOn: -1}, limit: limit});
    }
    
  }
};

Template.wishlist.templatename = function()
{
  return Session.get("wishliststate");
};

Template.wishlist.events({
  'click .tr_wish': function () {
    //console.log(this._id);
    Session.set("selected", this._id);
    var currWish = Wishes.findOne(this._id);
    mapa.panTo([currWish.x, currWish.y]);

    /*var mlayers = mapa._layers;
    //console.log(mlayers);

    var panes = mapa.getPanes();
    //console.log(panes);

    var mpane = mapa.getPanes().markerPane;
    //console.log(mpane);

    for(var k=0; k<mpane.childNodes.length; k++)
    {
      //console.log(mpane.childNodes[k]);
      //mpane.childNodes[k].openPopup();
    }*/
  },

  'click .mywishes':function(){
    Session.set("wishliststate", "My Wishes");
    //Session.set("dirty", "true");

    //var limit = Session.get("limit");
    //return Wishes.find({"public": true, owner:Meteor.userId()}, {sort: {createdOn: -1}, limit: limit});
  },

  'click .currentwishes':function(){
    //console.log('dropdown current');
    Session.set("wishliststate", "All Wishes");
    //Session.set("dirty", "true");

    //var limit = Session.get("limit");
    //return Wishes.find({"public": true}, {sort: {createdOn: -1}, limit: limit});
  },

  'click .anonymouswishes':function(){
    //console.log('dropdown current');
    Session.set("wishliststate", "Anonymous Wishes");
    //Session.set("dirty", "true");

    //var limit = Session.get("limit");
    //return Wishes.find({"public": true}, {sort: {createdOn: -1}, limit: limit});
  },

  'click .fulfilledwishes':function(){
    //console.log('dropdown current');
    Session.set("wishliststate", "Fulfilled Wishes");
    //Session.set("dirty", "true");

    //var limit = Session.get("limit");
    //return Wishes.find({"public": true}, {sort: {createdOn: -1}, limit: limit});
  },

});

///////////////////////////////////////////////////////////////////////////////
// Wish attendance widget

Template.attendance.rsvpName = function () {
  var user = Meteor.users.findOne(this.user);
  return displayName(user);
};

Template.attendance.outstandingInvitations = function () {
  var wish = Wishes.findOne(this._id);
  return Meteor.users.find({$and: [
    {_id: {$in: wish.invited}}, // they're invited
    {_id: {$nin: _.pluck(wish.rsvps, 'user')}} // but haven't RSVP'd
  ]});
};

Template.attendance.rsvpTitle = function () {
  var wish = Wishes.findOne(Session.get("selected"));
  //var rsvp = Wishes.find({_id:this._id}, {rsvps: {$elemMatch: {'user': this.user}}});
  //console.log(wish);
  if(wish.rsvps[0])
    return wish.rsvps[0].title;
  else
    return "";
};

Template.attendance.rsvpMessage = function () {
  var wish = Wishes.findOne(Session.get("selected"));
  //var rsvp = Wishes.find({_id:this._id}, {rsvps: {$elemMatch: {'user': this.user}}});
  //console.log(wish.rsvps[0].message);
  if(wish.rsvps[0])
    return wish.rsvps[0].message;
  else
    return "";
};

Template.attendance.rsvpIndex = function () {
  var wish = Wishes.findOne(Session.get("selected"));
  var rsvpIndex = _.indexOf(_.pluck(wish.rsvps, 'user'), this.user);
  //console.log(rsvpIndex);
  return rsvpIndex;
};

Template.attendance.invitationName = function () {
  return displayName(this);
};

Template.attendance.rsvpIs = function (what) {
  return this.rsvp === what;
};

Template.attendance.nobody = function () {
  return ! this.public && (this.rsvps.length + this.invited.length === 0);
};

Template.attendance.canInvite = function () {
  return ! this.public && this.owner === Meteor.userId();
};


///////////////////////////////////////////////////////////////////////////////
// Create Wish dialog

var openCreateDialog = function (x, y) {
  Session.set("createCoords", {x: x, y: y});
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
  //console.log("x:" + x +" y:" + y);
};

Template.page.showCreateDialog = function () {
  return Session.get("showCreateDialog");
};

Template.createDialog.rendered = function () {
  console.log("Template rendered - Settings");

  $('#addwish').maxlength({
          alwaysShow: true,
          threshold: 10,
          warningClass: "label label-success",
          limitReachedClass: "label label-danger",
          separator: ' of ',
          preText: 'You have ',
          postText: ' chars remaining.',
          validate: true,
          placement: 'bottom'
        });

  $('#adddesc').maxlength({
          alwaysShow: true,
          threshold: 10,
          warningClass: "label label-success",
          limitReachedClass: "label label-danger",
          separator: ' of ',
          preText: 'You have ',
          postText: ' chars remaining.',
          validate: true,
          placement: 'bottom'
        });

};

Template.createDialog.events({
  'click .save': function (event, template) {
    var title = template.find(".title").value;
    var description = template.find(".description").value;
    var public = ! template.find(".private").checked;
    var anonymous = template.find(".anonymous").checked;
    var coords = Session.get("createCoords");

    if (title.length && description.length) {
      var id = createWish({
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: public,
        anonymous: anonymous
      });

      //inserting files
      var files = template.find(".exampleInputFile").files;
      console.log(files);

      if(files.length > 0)
      {
        var fsFile = new FS.File(files[0]);
        fsFile.metadata = {owner: Meteor.userId()};
        Images.insert(fsFile, function (err, fileObj) {
          //Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
          if(err)
              console.log(err);
          else
            console.log("should have uploaded");
        });
      }

      console.log("after file insert");

      var myIcon = L.icon({
        iconUrl: "/images/user.png",
        iconSize: [25, 25]
      });

      //-- adding marker here for now. but should find a better solution or a common function 
      //addWishMarkersOnMap();
      var marker = L.marker([coords.x,coords.y], {icon: myIcon, title: title, riseOnHover: true }).bindPopup(title).addTo(mapa);
      marker.openPopup();
      marker._leaflet_id = id;
      //console.log("setting marker_id:" + marker._leaflet_id);

      Session.set("toInvite", id);

      if(! public && Meteor.users.find().count() > 1)
      {
        openInviteDialog();
      }
      Session.set("showCreateDialog", false);
      Session.set("dirty", "true");
    } else {
      Session.set("createError",
                  "It needs a title and a description, or why bother?");
    }
  },
  'click .cancel': function () {
    Session.set("showCreateDialog", false);
  },

  'keyup': function(e) {
    //console.log('keypress');
    if(e.which == 27)
    {
      Session.set("showCreateDialog", false);
      //console.log('set false');
    }
  },

});

Template.createDialog.error = function () {
  return Session.get("createError");
};

///////////////////////////////////////////////////////////////////////////////
// Fulfill dialog

var openFulfillDialog = function () {
  Session.set("showFulfillDialog", true);
};

/*Template.page.showFulfillDialog = function () {
  console.log("setting true");
  return Session.get("showFulfillDialog");
};*/

Template.fulfillDialog.events({
  'click .save': function (event, template) {
    var title = template.find(".title").value;
    var description = template.find(".description").value;

    if (title.length && description.length) {
      //get the button state & call the rsvp with message and description.
      
      Meteor.call("rsvp", Session.get("selected"), Session.get("x_rsvp_answer"), title, description);

    } else {
      Session.set("createError",
                  "It needs a title and a description, or why bother?");
    }
    Session.set("showFulfillDialog", false);
    return false;
  },
  'click .cancel': function () {
    Meteor.call("rsvp", Session.get("selected"), Session.get("x_rsvp_answer"), "", "");
    Session.set("showFulfillDialog", false);
    return false;
  },

  'keyup': function(e) {
    //console.log('keypress');
    if(e.which == 27)
    {
      Session.set("showFulfillDialog", false);
      //console.log('set false');
    }
  },

});

Template.fulfillDialog.error = function () {
  return Session.get("fulfillError");
};
///////////////////////////////////////////////////////////////////////////////
// Invite dialog

var openInviteDialog = function () {
  Session.set("showInviteDialog", true);
};

Template.page.showInviteDialog = function () {
  return Session.get("showInviteDialog");
};

Template.inviteDialog.events({
  'click .invite': function (event, template) {
    //console.log("selected:" + Session.get("toInvite"));
    //console.log("this_id:" + this._id);
    
    Meteor.call('invite', Session.get("toInvite"), this._id);
  },
  'click .done': function (event, template) {
    Session.set("showInviteDialog", false);
    return false;
  }
});

Template.inviteDialog.uninvited = function () {
  var wish = Wishes.findOne(Session.get("selected"));
  if (! wish)
    return []; // wish hasn't loaded yet
  return Meteor.users.find({$nor: [{_id: {$in: wish.invited}},
                                   {_id: wish.owner}]});
};

Template.inviteDialog.displayName = function () {
  return displayName(this);
};

////////////////////////////////////////////////////////////////////////////////
// Images functions
/*
Template.myForm.events({
  'change .myFileInput': function(event, template) {
    FS.Utility.eachFile(event, function(file) {
      Images.insert(file, function (err, fileObj) {
        //Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
      });
    });
  }
});*/

////////////////////////////////////////////////////////////////////////////////
// Wishmap functions

Template.myWishmap.events({
  'click .getLoc': function(){
  
  //console.log("inLoc-> ");
  navigator.geolocation.getCurrentPosition(function GetLocation(location) {
    //console.log(location.coords.latitude);
    //console.log(location.coords.longitude);
    //console.log(location.coords.accuracy);
    console.log(location);
    openCreateDialog(location.coords.latitude, location.coords.longitude);
    });
  }
});

var mapa;
var currentPopup;
var wishCulsterGroup;
var wishFeatureGroup;

function centerMap(e) {
    mapa.panTo(e.latlng);
}

function zoomIn(e) {
    mapa.zoomIn();
}

function zoomOut(e) {
    mapa.zoomOut();
}

function onClick(e) {
  //console.log("wish clicked");
  //console.log(e.target._leaflet_id);
  Session.set("selected", e.target._leaflet_id);
}

function addWishOnMap(e)
{
  if (!Meteor.userId()) // must be logged in to create events
  {
    console.log("show message to create account");
    return;
  }

  //console.log("calling create dialog");
  openCreateDialog(e.latlng.lat, e.latlng.lng);
}

function initMap()
{
  var tile = new L.StamenTileLayer("watercolor");
  var m_wishes = L.featureGroup();
  wishCulsterGroup = new L.MarkerClusterGroup();
  wishFeatureGroup = L.featureGroup();

  mapa = new L.Map("wishmap", {
    center: new L.LatLng(51.505, -0.09),
    maxZoom: 18,
    minZoom: 3,
    worldCopyJump: true,
    scrollWheelZoom: false,
    trackResize: true,
    fullscreenControl: true,
    zoom: 3,
    layers: [tile],
    contextmenu: true,
    contextmenuWidth: 140,
    contextmenuItems: [{
        text: 'Add Wish Here',
        callback: addWishOnMap
    }, {
        text: 'Center map here',
        callback: centerMap
    }, '-', {
        text: 'Zoom in',
        icon: '/images/zoom-in.png',
        callback: zoomIn
    }, {
        text: 'Zoom out',
        icon: '/images/zoom-out.png',
        callback: zoomOut
    }]
  });

  //geocode-locate control
  var geoCoderOptions = {
    collapsed: true, /* Whether its collapsed or not */
    position: 'topright', /* The position of the control */
    text: 'Locate', /* The text of the submit button */
    bounds: null, /* a L.LatLngBounds object to limit the results to */
    email: null, /* an email string with a contact to provide to Nominatim. Useful if you are doing lots of queries */
    callback: function (results) {
            var bbox = results[0].boundingbox,
                first = new L.LatLng(bbox[0], bbox[2]),
                second = new L.LatLng(bbox[1], bbox[3]),
                bounds = new L.LatLngBounds([first, second]);
            this._map.fitBounds(bounds);
    }
  };
  var osmGeocoder = new L.Control.OSMGeocoder(geoCoderOptions);
  mapa.addControl(osmGeocoder);

  //locate current location
  L.control.locate({
      position: 'topleft',  // set the location of the control
      drawCircle: true,  // controls whether a circle is drawn that shows the uncertainty about the location
      follow: false,  // follow the user's location
      setView: true, // automatically sets the map view to the user's location, enabled if `follow` is true
      keepCurrentZoomLevel: false, // keep the current map zoom level when displaying the user's location. (if `false`, use maxZoom)
      stopFollowingOnDrag: false, // stop following when the map is dragged if `follow` is true (deprecated, see below)
      remainActive: false, // if true locate control remains active on click even if the user's location is in view.
      markerClass: L.circleMarker, // L.circleMarker or L.marker
      circleStyle: {},  // change the style of the circle around the user's location
      markerStyle: {},
      followCircleStyle: {},  // set difference for the style of the circle around the user's location while following
      followMarkerStyle: {},
      icon: 'icon-location',  // `icon-location` or `icon-direction`
      iconLoading: 'icon-spinner  animate-spin',  // class for loading icon
      circlePadding: [0, 0], // padding around accuracy circle, value is passed to setBounds
      metric: true,  // use metric or imperial units
      onLocationError: function(err) {alert(err.message);},  // define an error callback function
      onLocationOutsideMapBounds:  function(context) { // called when outside map boundaries
              alert(context.options.strings.outsideMapBoundsMsg);
      },
      showPopup: true, // display a popup when the user click on the inner marker
      strings: {
          title: "Show me where I am",  // title of the locate control
          popup: "You are within {distance} {unit} from this point",  // text to appear if user clicks on circle
          outsideMapBoundsMsg: "You seem located outside the boundaries of the map" // default message for onLocationOutsideMapBounds
      },
      locateOptions: {}  // define location options e.g enableHighAccuracy: true or maxZoom: 10
  }).addTo(mapa);
}

function addWishMarkersOnMap()
{
  if(!mapa)
  {
    initMap();
  }
  var myIcon = L.icon({
    iconUrl: "/images/user.png",
    iconSize: [25, 25]
  });

  //mapa.spin(true);
  var wws = Wishes.find().fetch();
  console.log("ädding wish markers on map");
  //console.log(wws);
  var lastId;
  var currWish;
  wishCulsterGroup.clearLayers();
  for(var k=0; k<wws.length; k++)
  {
    //var marker = L.marker([wws[k].x,wws[k].y], {icon: myIcon, title: Meteor.userId(), riseOnHover: true }).bindPopup(wws[k].title).addTo(mapa);
    var marker = L.marker([wws[k].x,wws[k].y], {icon: myIcon, title: wws[k].title, riseOnHover: true }).bindPopup('<a href="#gotowish">' + wws[k].title + '</a>');
    marker._leaflet_id = wws[k]._id;
    lastId = wws[k]._id;
    //console.log(marker._leaflet_id);
    marker.on('click', onClick);
    marker.openPopup();
    currWish = wws[k];
    wishCulsterGroup.addLayer(marker);
  }
  wishFeatureGroup.addLayer(wishCulsterGroup);
  mapa.addLayer(wishFeatureGroup);
  Session.set("selected", lastId);
  Session.set("dirty", "false");

  //mapa.panTo([currWish.x, currWish.y]);
}


///////////////////////////////////////////////////////////////////////////////
// Utility functions

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


/* 

-- updating mongo db
db.wishes.update({},{$set: {anonymous:false}},false, true);

*/





///////////////////////////////////////////////////////////////////////////////
// Map display

// Use jquery to get the position clicked relative to the map element.
/*
var coordsRelativeToElement = function (element, event) {
  var offset = $(element).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  return { x: x, y: y };
};

Template.map.events({
  'mousedown circle, mousedown text': function (event, template) {
    Session.set("selected", event.currentTarget.id);
  },
  'dblclick .map': function (event, template) {
    if (! Meteor.userId()) // must be logged in to create events
      return;
    var coords = coordsRelativeToElement(event.currentTarget, event);
    openCreateDialog(coords.x / 500, coords.y / 500);
  }
});

Template.map.rendered = function () {
  var self = this;
  self.node = self.find("svg");

  if (! self.handle) {
    self.handle = Deps.autorun(function () {
      var selected = Session.get('selected');
      var selectedWish = selected && Wishes.findOne(selected);
      var radius = function (wish) {
        return 10 + Math.sqrt(attending(wish)) * 10;
      };

      // Draw a circle for each wish
      var updateCircles = function (group) {
        group.attr("id", function (wish) { return wish._id; })
        .attr("cx", function (wish) { return wish.x * 500; })
        .attr("cy", function (wish) { return wish.y * 500; })
        .attr("r", radius)
        .attr("class", function (wish) {
          return wish.public ? "public" : "private";
        })
        .style('opacity', function (wish) {
          return selected === wish._id ? 1 : 0.6;
        });
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Wishes.find().fetch(), function (wish) { return wish._id; });

      updateCircles(circles.enter().append("circle"));
      updateCircles(circles.transition().duration(250).ease("cubic-out"));
      circles.exit().transition().duration(250).attr("r", 0).remove();

      // Label each with the current attendance count
      var updateLabels = function (group) {
        group.attr("id", function (wish) { return wish._id; })
        .text(function (wish) {return attending(wish) || '';})
        .attr("x", function (wish) { return wish.x * 500; })
        .attr("y", function (wish) { return wish.y * 500 + radius(wish)/2 })
        .style('font-size', function (wish) {
          return radius(wish) * 1.25 + "px";
        });
      };

      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Wishes.find().fetch(), function (wish) { return wish._id; });

      updateLabels(labels.enter().append("text"));
      updateLabels(labels.transition().duration(250).ease("cubic-out"));
      labels.exit().remove();

      // Draw a dashed circle around the currently selected wish, if any
      var callout = d3.select(self.node).select("circle.callout")
        .transition().duration(250).ease("cubic-out");
      if (selectedWish)
        callout.attr("cx", selectedWish.x * 500)
        .attr("cy", selectedWish.y * 500)
        .attr("r", radius(selectedWish) + 10)
        .attr("class", "callout")
        .attr("display", '');
      else
        callout.attr("display", 'none');
    });
  }
};

Template.map.destroyed = function () {
  this.handle && this.handle.stop();
};*/
