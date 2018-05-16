//This is backend stuff (node module and server.js is both backend)
//not to self: Remember that I need to somehow(!!!!) implement socket.io, which allows for real-time to happen

//NEW STUFF
// Load Express framework module
const express = require('express')

// Load express-session to support sessions
const session = require('express-session')

// Load bcrypt for password hashing
// Used to compare password with stored and encrypted password
const bcrypt = require('bcrypt')

// Load Joi module for validation
const Joi = require('joi')

// Load database config
const db = require('./database.js')

// Make an instance of Express
const app = express()

// Handle JSON requests
app.use(express.json()) //do not include

// Setup express-session
const expressSession = session({
  secret: 'examProject' //THIS I AM NOT CERTAIN OF!!!
})

// Use the settings above
app.use(expressSession)

// Load Socket.io to support real-time features
const server = require('http').Server(app)
const io = require('socket.io')(server)
// Share sessions between Express and Socket.io
const ioSession = require('express-socket.io-session')
// Setup session sharing between Express and Socket.io
io.use(ioSession(expressSession, {
  autoSave: true
}))


// Stuff to do when a user (socket) connects to the site
io.on('connection', socket => {
  // Take the user object from the session
  // It contains the user's ID and username
  let {
    user
  } = socket.handshake.session

  // When a user closes the site
  // and therefore disconnects
  socket.on('disconnect', () => {
    // Check if the user is logged in
    if (user) {
      // Remove the users from the onlineUsers array
      onlineUsers = onlineUsers.filter(u => u.id !== user.id)

      // Emit the new list of online users
      io.emit('online users', onlineUsers)
    }
  })


  // If the user is logged in
  if (user) {
    // Check if the user is already on the list
    // Could happen if the user uses multiple browsers
    if (!onlineUsers.some(u => u.id == user.id)) {
      // If user is not on the list, add the user
      onlineUsers.push(user)

      // Attach the user to the socket
      socket.user = user
    }
  }

  io.emit('online users', onlineUsers)

})

//lets me specify a folder out of which to serve files
app.use(express.static('public'));

// Authentication middleware
const requireAuthentication = (req, res, next) => {
  if (!req.session.user) {
    return res.json({
      status: 'ERROR',
      message: 'Authentication required!'
    })
  }
  next()
}


// Manually check if user is logged in
// If not, redirect to login.html
app.get('/', (req, res) => {
  // Render the main.html in the views folder
  // we can make an if statement to check if user is logged in
  if (!req.session.user) {
    return res.redirect('./public/login.html')
  }

  res.sendFile(__dirname + './public/home.html')
  res.render('home', { title: 'Home Page' })
})



// Endpoint to handle user authentication
app.post('/api/auth', (req, res) => {
  let {username, password} = req.body

  // Make sure username and password are present
  let schema = {
    username: Joi.string().alphanum().required(),
    password: Joi.string().required()
  }

  // Validate using Joi
  let result = Joi.validate(req.body, schema)

  // Return an error if validation failed
  if (result.error !== null) {
    return res.status(422).json({
      message: 'Invalid request'
    })
  }

  // Build query for looking up the user
  let query = {
    where: {
      username
    }
  }

  db.User.findOne(query)
    .then(user => {
      // Return an error if user was not found
      if (!user) {
        return res.status(422).json({
          status: 'ERROR',
          message: 'Invalid credentials'
        })
      }

      // Compare the found user's password with the submitted password
      // bcrypt encrypts the submitted and stores password
      bcrypt.compare(password, user.password)
        .then(result => {
          // If the comparison fails return an error
          if (!result) {
            return res.status(422).json({
              status: 'ERROR',
              message: 'Invalid credentials'
            })
          }

          // Otherwise set the session with the user's details
          req.session.user = {
            id: user.id,
            username: user.username
          }

          // Send a response
          res.json({
            status: 'OK',
            message: 'You have been authenticated!'
          })
        })
    })
})

// Endpoint to destroy the session's data
app.get('/api/auth/logout', (req, res) => {
  req.session.destroy()

  res.redirect('/')
})

// Endpoint to register a new user
app.post('/api/users', (req, res) => {
  let {username, password } = req.body

  let schema = {
    username: Joi.string().alphanum().required(),
    password: Joi.string().required()
  }

  const result = Joi.validate(req.body, schema)

  if (result.error !== null) {
    return res.status(422).json({
      status: 'ERROR',
      message: 'Validation failed'
    })
  }

  // Create the new user
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
//NEW STUFF ENDS

//REVISED STUFF COMING UP

//how to access database from server
//letting the server tell which are the elements in the list. I do that by using an API call
//this is called a GET request
app.get('/api/myList', (req, res) => { //should it be /api? why??
  //include the user related to the list
  let options = {
    include: [{
      model: db.User,
      attributes: ['username'] // Only select the username column
    }]
  }

  db.List.findAll(options)
    .then(myList => {
      res.json(myList)
    })
});

//it can have the same name because it is doing something different (post instead of get)
//Endpoint to save new data
// Requires that the user is logged in
//HOW TO DO THIS??????????????????
app.post('/api/myList', requireAuthentication, (req, res) => {
  let { text } = req.body

  let schema = {
    text: Joi.string().required()
  }

  let result = Joi.validate(req.body, schema)

  if (result.error !== null) {
    return res.status(422).json({
      status: 'ERROR',
      message: 'Missing text!'
    })
  }

db.List.create({
  title: "My List"
  userID: req.session.user.id
}, {
  include:[{
    model: db.User,
    attributes: ['username']
  }]
})

.then(list => {
    // Select the message again with the associated user
    return list.reload()
})

.then(list => {
        // Emit the newly created quiz result to all sockets
        io.emit('new list', list)

        // Return a HTTP 201 response
        return res.status(201).json({
              status: 'OK',
              message: 'You have created a list!'
        })
    })

    .catch(error => {
        res.status(422).json({
            status: 'ERROR',
            message: 'An error accured'
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
        }, {
            // Sequelize needs the related model to insert
            // related models, like the messages above
            // Documentation: http://docs.sequelizejs.com/manual/tutorial/associations.html#creating-with-associations
            include: [ db.List ]
        })
        console.log('Database is ready and server is running..')
    })
})


app.get('/api/list/:id', userIsAuthenticated, (req, res) => {

// Include the List related to the items
  let options = {
      include: [{
          model: db.List,
          attributes: list.id // Only select list of the user
      }]
  }

  db.Item.findAll(options)
  .then(items => {
      res.json(items)
  })

})
//posting a new ingredient to the list
app.post('/api/list', userIsAuthenticated, (req, res) => {
let { ingredient } = req.body

let user_id = req.session.user.id

// seaching for user id in database
let query = {
 where: {
   userId: user_id
 }
}

//searching for list from user --> it works!
db.List.findOne(query)
.then(list => {
  //cheking if list is available --> it works and it is connected to user!!
  //console.log('list found', query)
  if (!list) {
      return res.status(422).json({
          status: 'ERROR',
          message: 'No list available'
      })
  }
  //adding item to list --> it works!!!
  db.Item.create({
    ingredient
  }).then(newItem => {
    list.addItem(newItem)
  })

})

//sending response
.then(item => {
    res.status(201).json({
        status: 'OK',
        message: 'You have added a new item'
    })
})
})



/*
app.delete('api/item/:item_id', (req, res) => {
db.Item.delete({
  where: {
    id: req.params.item_id
  }
})
})
*/


/*
/////////////////////////////////////////////////////////////
////////////////Has to do with the list/////////////////////
var myList = [
  'No Roots - Alice Merton',
  'Upside down - Paloma Faith',
  'Back From The Edge - James Arthur',
  'Survivor - Destiny´s Child'
];
/////////////////////////////////////////////////////////
*/
