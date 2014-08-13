// Wishes -- server

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
});

/*Meteor.publish("wishes", function () {
  return Wishes.find(
    {$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
});*/

/*Meteor.publish("wishes", function () {
  return Wishes.find(
    {$or: [{"public": true}]});
});*/

Meteor.publish("wishes", function publishFunction(limit)
{
  var dl = limit || 10;
  return Wishes.find({"public": true}, {sort: {date: -1}, limit: 10});
});

/*Meteor.publish("wishes", function (limit) {
  //default limit if none set
  var dl = limit || 10;

  return Wishes.find({$or: [{"public": true}]},[{limit:dl, sort:-1}]);
});*/
