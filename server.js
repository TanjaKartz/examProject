//This is backend stuff (node module and server.js is both backend)
//not to self: Remember that I need to somehow(!!!!) implement socket.io, which allows for real-time to happen

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

//lets me specify a folder out of which to serve files
app.use(express.static('public'));

var myList = [
  'No Roots - Alice Merton',
  'Upside down - Paloma Faith',
  'Back From The Edge - James Arthur',
  'Survivor - Destiny´s Child'
];

//how to access database from server
//letting the server tell which are the elements in the list. I do that by using an API call
//this is called a GET request
app.get('/myList', function(req, res, next) {
  res.send(myList);
});

//it can have the same name because it is doing something different (post instead of get)
//req= request object (the data that I am sending), res= (I can send data back) , next= you call next if there is an error (like a database error)
app.post('/myList', function(req, res, next) {
  myList.push(req.body.newItem);
  res.send();

});

//3000 is a port number
//listen is a function, the first arguement is 3000, the second arguement is the function
// once the portal is done starting up it will call the function
app.listen(3000, function () {
  console.log('Example app lisening on port 3000!');
});
