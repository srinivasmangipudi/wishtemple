// Wish Temple -- data model
// Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Wishes

/*
  Each Wish is represented by a document in the Wishes collection:
    owner: user id
    x, y: Number (screen coordinates in the interval [0, 1])
    title, description: String
    public: Boolean
    invited: Array of user id's that are invited (only if !public)
    rsvps: Array of objects like {user: userId, rsvp: "yes"} (or "no"/"maybe")
*/
Wishes = new Meteor.Collection("wishes");

Wishes.allow({
  insert: function (userId, wish) {
    return false; // no cowboy inserts -- use createWish method
  },
  update: function (userId, wish, fields, modifier) {
    if (userId !== wish.owner)
      return false; // not the owner

    var allowed = ["title", "description", "x", "y"];
    if (_.difference(fields, allowed).length)
      return false; // tried to write to forbidden field

    // A good improvement would be to validate the type of the new
    // value of the field (and if a string, the length.) In the
    // future Meteor will have a schema system to makes that easier.
    return true;
  },
  remove: function (userId, wish) {
    // You can only remove wishes that you created and nobody is going to.
    return wish.owner === userId && attending(wish) === 0;
  }
});

attending = function (wish) {
  return (_.groupBy(wish.rsvps, 'rsvp').yes || []).length;
};

var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length !== 0;
});

var Coordinate = Match.Where(function (x) {
  check(x, Number);
  //return x >= 0 && x <= 1;
  return x;
});

createWish = function (options) {
  var id = Random.id();
  Meteor.call('createWish', _.extend({ _id: id }, options));
  return id;
};

getMyWishes = function(userId){
  return Wishes.find().fetch();
};

Meteor.methods({
  // options should include: title, description, x, y, public
  createWish: function (options) {
    check(options, {
      title: NonEmptyString,
      description: NonEmptyString,
      x: Coordinate,
      y: Coordinate,
      public: Match.Optional(Boolean),
      _id: Match.Optional(NonEmptyString)
    });

    if (options.title.length > 100)
      throw new Meteor.Error(413, "Title too long");
    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Description too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    var id = options._id || Random.id();
    Wishes.insert({
      _id: id,
      owner: this.userId,
      x: options.x,
      y: options.y,
      title: options.title,
      description: options.description,
      public: !! options.public,
      invited: [],
      rsvps: []
    });
    return id;
  },

  invite: function (wishId, userId) {
    check(wishId, String);
    check(userId, String);
    var wish = Wishes.findOne(wishId);
    if (! wish || wish.owner !== this.userId)
      throw new Meteor.Error(404, "No such wish");
    if (wish.public)
      throw new Meteor.Error(400,
                             "That wish is public. No need to invite people.");
    if (userId !== wish.owner && ! _.contains(wish.invited, userId)) {
      Wishes.update(wishId, { $addToSet: { invited: userId } });

      var from = contactEmail(Meteor.users.findOne(this.userId));
      var to = contactEmail(Meteor.users.findOne(userId));
      if (Meteor.isServer && to) {
        // This code only runs on the server. If you didn't want clients
        // to be able to see it, you could move it to a separate file.
        Email.send({
          from: "noreply@example.com",
          to: to,
          replyTo: from || undefined,
          subject: "WISH: " + wish.title,
          text:
"Hey, I just invited you to '" + wish.title + "' on All Tomorrow's Wishes." +
"\n\nCome check it out: " + Meteor.absoluteUrl() + "\n"
        });
      }
    }
  },

  rsvp: function (wishId, rsvp) {
    check(wishId, String);
    check(rsvp, String);
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in to RSVP");
    if (! _.contains(['yes', 'no', 'maybe'], rsvp))
      throw new Meteor.Error(400, "Invalid RSVP");
    var wish = Wishes.findOne(wishId);
    if (! wish)
      throw new Meteor.Error(404, "No such wish");
    if (! wish.public && wish.owner !== this.userId &&
        !_.contains(wish.invited, this.userId))
      // private, but let's not tell this to the user
      throw new Meteor.Error(403, "No such wish");

    var rsvpIndex = _.indexOf(_.pluck(wish.rsvps, 'user'), this.userId);
    if (rsvpIndex !== -1) {
      // update existing rsvp entry

      if (Meteor.isServer) {
        // update the appropriate rsvp entry with $
        Wishes.update(
          {_id: wishId, "rsvps.user": this.userId},
          {$set: {"rsvps.$.rsvp": rsvp}});
      } else {
        // minimongo doesn't yet support $ in modifier. as a temporary
        // workaround, make a modifier that uses an index. this is
        // safe on the client since there's only one thread.
        var modifier = {$set: {}};
        modifier.$set["rsvps." + rsvpIndex + ".rsvp"] = rsvp;
        Wishes.update(wishId, modifier);
      }

      // Possible improvement: send email to the other people that are
      // coming to the wish.
    } else {
      // add new rsvp entry
      Wishes.update(wishId,
                     {$push: {rsvps: {user: this.userId, rsvp: rsvp}}});
    }
  }/*,

  getMyWishes: function(userId){
    return Wishes.find().fetch();
  }*/
});

///////////////////////////////////////////////////////////////////////////////
// Users

displayName = function (user) {
  if (user.profile && user.profile.name)
    return user.profile.name;
  return user.emails[0].address;
};

var contactEmail = function (user) {
  if (user.emails && user.emails.length)
    return user.emails[0].address;
  if (user.services && user.services.facebook && user.services.facebook.email)
    return user.services.facebook.email;
  return null;
};
