// Wishes -- server

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1, "services.facebook.id": 1}});
});

Meteor.publish("wishes", function (limit) {
  var dl = limit || 100;
  return Wishes.find(
    {$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]}, {sort: {createdOn: 1}, limit: dl});
});


/*Meteor.publish("images", function() {
    return Images.find();
});*/


/*Meteor.publish("wishes", function () {
  return Wishes.find(
    {$or: [{"public": true}]});
});*/

/*Meteor.publish("wishes", function publishFunction(limit)
{
  var dl = limit || 100;
  return Wishes.find({"public": true}, {sort: {createdOn: 1}, limit: dl});
});*/

/*Meteor.publish("wishes", function (limit) {
  //default limit if none set
  var dl = limit || 10;

  return Wishes.find({$or: [{"public": true}]},[{limit:dl, sort:-1}]);
});*/
