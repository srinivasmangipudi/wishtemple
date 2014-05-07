// Wishes -- server

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
});

/*Meteor.publish("wishes", function () {
  return Wishes.find(
    {$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
});*/

Meteor.publish("wishes", function () {
  return Wishes.find(
    {$or: [{"public": true}]});
});

/*Meteor.publish("freshWishes", function (limit) {
  //default limit if none set
  var dl = limit || 10;

  return Wishes.find({},[{limit:dl, sort:-1}]);
});*/
