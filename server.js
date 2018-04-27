//This is backend stuff (node module and server.js is both backend)
//not to self: Remember that I need to somehow(!!!!) implement socket.io, which allows for real-time to happen

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
//const db = require('./config/database.js') //Has to do with the database


app.use(bodyParser.json());

//lets me specify a folder out of which to serve files
app.use(express.static('public'));


////////////////Has to do with the list/////////////////////
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
//To remove an item from the list - does not work
app.put('/myList/remove', function(req, res, next) {
  myList.push(req.body.newItem);
  res.send();

});
//3000 is a port number
//listen is a function, the first arguement is 3000, the second arguement is the function
// once the portal is done starting up it will call the function
app.listen(3000, function () {
  console.log('Example app lisening on port 3000!');
});

/*
////////////////////////////////////////////////////////
//////////Has to to with login and users///////////////////

//Create the new user
    db.User.create({
        username,
        password
    })
    .then(user => {
        // HTTP 201 = Created
        res.status(201).json({
            status: 'OK',
            message: 'User created!'
        })
    })
    .catch(error => {
        res.status(422).json({
            status: 'ERROR',
            message: 'Error creating user!'
        })
    })
})

//!!!!!!!!Rewrite this to fit my code!!!!

    // Create the message and take the userId from the session
        // Adding the userId associates the message to the user
        db.Message.create({
            text,
            userId: req.session.user.id
        }, {
            include: [{
                model: db.User,
                attributes: ['username']
            }]
        })
        .then(message => {
            // Select the message again with the associated user
            return message.reload()
        })
        .then(message => {
            // Emit the newly created message to all sockets
            io.emit('new message', message)

            // Return a HTTP 201 response
            return res.status(201).json({
                status: 'OK',
                message: 'Message created!'
            })
        })
        .catch(error => {
            res.status(422).json({
                status: 'ERROR',
                message: 'An error accured when creating message'
            })
        })
    })

    // Sync models to the database
    // Note: You may want to set force to false so that
    // data is not destroyed on server restart
    db.sequelize.sync({ force: true }).then(() => {
        server.listen(3000, () => {
            db.User.create({
                username: 'bot',
                password: 'secret',
                messages: [
                    { text: 'Hello World!'},
                    { text: 'Hello World, once again!'},
                    { text: 'Hello?' }
                ]
            }, {
                // Sequelize needs the related model to insert
                // related models, like the messages above
                // Documentation: http://docs.sequelizejs.com/manual/tutorial/associations.html#creating-with-associations
                include: [ db.Message ]
            })
            console.log('Database is ready and server is running..')
        })
    })

*/
