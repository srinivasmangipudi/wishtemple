// Wishes -- client

Meteor.subscribe("directory");
Meteor.subscribe("wishes");

// If no wish selected, or if the selected wish was deleted, select one.
Meteor.startup(function () {
  Deps.autorun(function () {
    var selected = Session.get("selected");
    if (! selected || ! Wishes.findOne(selected)) {
      var wish = Wishes.findOne();
      if (wish)
        Session.set("selected", wish._id);
      else
        Session.set("selected", null);
    }
  });
});

///////////////////////////////////////////////////////////////////////////////
// Wish details sidebar

Template.details.wish = function () {
  return Wishes.findOne(Session.get("selected"));
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

Template.details.canRemove = function () {
  return this.owner === Meteor.userId() && attending(this) === 0;
};

Template.details.maybeChosen = function (what) {
  var myRsvp = _.find(this.rsvps, function (r) {
    return r.user === Meteor.userId();
  }) || {};

  return what == myRsvp.rsvp ? "chosen btn-inverse" : "";
};

Template.details.events({
  'click .rsvp_yes': function () {
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .invite': function () {
    openInviteDialog();
    return false;
  },
  'click .remove': function () {
    Wishes.remove(this._id);
    return false;
  }
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

///////////////////////////////////////////////////////////////////////////////
// Create Wish dialog

var openCreateDialog = function (x, y) {
  Session.set("createCoords", {x: x, y: y});
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
};

Template.page.showCreateDialog = function () {
  return Session.get("showCreateDialog");
};

Template.createDialog.events({
  'click .save': function (event, template) {
    var title = template.find(".title").value;
    var description = template.find(".description").value;
    var public = ! template.find(".private").checked;
    var coords = Session.get("createCoords");

    //console.log(coords.x, coords.y);

    if (title.length && description.length) {
      var id = createWish({
        title: title,
        description: description,
        x: coords.x,
        y: coords.y,
        public: public
      });

      var myIcon = L.icon({
        iconUrl: "/images/user.png",
        iconSize: [25, 25]
      });

      var marker = L.marker([coords.x,coords.y], {icon: myIcon, title: Meteor.userId(), riseOnHover: true }).bindPopup(title).addTo(mapa);
      marker.openPopup();

      Session.set("selected", id);
      if (! public && Meteor.users.find().count() > 1)
        openInviteDialog();
      Session.set("showCreateDialog", false);
    } else {
      Session.set("createError",
                  "It needs a title and a description, or why bother?");
    }
  },

  'click .cancel': function () {
    Session.set("showCreateDialog", false);
  }
});

Template.createDialog.error = function () {
  return Session.get("createError");
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
    Meteor.call('invite', Session.get("selected"), this._id);
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
// Wishmap functions

  var mapa;

  Template.myWishmap.created = function(){
  Template.myWishmap.rendered = _.once(function(){

  var tile = L.tileLayer('http://{s}.tile.cloudmade.com/28cc49f16f1747ebae3100fb3d32f05a/997/256/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 18
  });

  mapa = new L.Map("wishmap", {
    center: new L.LatLng(51.505, -0.09), // filled according to the culture above
    maxZoom: 18,
    minZoom: 2,
    worldCopyJump: true,
    zoom: 2,
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

var currentPopup;

    //var mapa = L.map('wishmap').setView([51.505, -0.09], 13);

    /*L.tileLayer('http://{s}.tile.cloudmade.com/28cc49f16f1747ebae3100fb3d32f05a/997/256/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }).addTo(mapa);

  mapa.on('click', function(e) {
      alert("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
  });*/

  mapa.on('popupopen', function(e) {
    currentPopup = e;
  });

  function addWishOnMap(e) {
      //$('#status_messages').html(__(''));
      //plotVenues(e.latlng.lat, e.latlng.lng);
      //alert("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng);
      //console.log("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng);
      console.log(getMyWishes(Meteor.userId()));


      if (!Meteor.userId()) // must be logged in to create events
      {
        console.log("show message to create account");
        return;
      }

      openCreateDialog(e.latlng.lat, e.latlng.lng);
  }

  function centerMap(e) {
      mapa.panTo(e.latlng);
  }

  function zoomIn(e) {
      mapa.zoomIn();
  }

  function zoomOut(e) {
      mapa.zoomOut();
  }

  });

}
