//This is backend stuff (node module and server.js is both backend)
//not to self: Remember that I need to somehow(!!!!) implement socket.io, which allows for real-time to happen


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
  secret: 'examProject'
})

// Use the settings above
app.use(expressSession)

///////////////////////////////////////////////////
//lets me specify a folder out of which to serve files
/////////////////////////////////////////////////////
app.use(express.static('public'));

///////////////////////////////////////////////////////
// Authentication middleware --> check if user is logged inspect
//used in methods where the user needs to be looged in to post, put and delete data.
const userIsAuthenticated = (req, res, next) => {
  console.log(req.session)
  if (!req.session.user) {
    return res.json({
      status: 'ERROR',
      message: 'Authentication required! - Login to add songs to your list'
    })
  }
  next()
}


/////////////REAL TIME FEATURE NEEDS TO BE IMPLEMENTED/////////////////
// Load Socket.io to support real-time features
const server = require('http').Server(app)
const io = require('socket.io')(server)
// Share sessions between Express and Socket.io

const ioSession = require('express-socket.io-session')
// Setup session sharing between Express and Socket.io
io.use(ioSession(expressSession, {
  autoSave: true
}))

/*
// Stuff to do when a user (socket) connects to the site
io.on('connection', socket => {
  console.log('Socket connected', socket.id)
  socket.emit('debug message', 'Socket connected to server!')

})
*/





////////////////////////////////////////////////////////


///////////////////////////////////////////////////
///// Manually check if user is logged in////////
///// If not, redirect to login.html////////////
/////////////////////////////////////////////////
app.get('/', function(req, res) {
  // Render the main.html in the views folder
  // we can make an if statement to check if user is logged in

  //if (!req.session.user) {
  //  return res.redirect('./public/login.html')
  //}

  res.sendFile(__dirname + './home.html');

  //res.render('home', {
  //  title: 'Home Page'
//  })
})

io.on('connection', function(socket){
  console.log('a user is connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

//io.emit('some event', {for:'everyone'});


//don't know what this does???
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login'
  })
})

app.get('/signup', (req, res) => {
  res.render('signup', {
    title: 'Signup'
  })
})

app.get('/home', userIsAuthenticated, (req, res) => {
  res.render('home', {
  title: 'Home Page'
  })
})

app.get('/index', userIsAuthenticated, (req, res) => {
  res.render('index', {
    title: 'My List'
  })
})

app.get('/logout', userIsAuthenticated, (req, res) => {
  res.render('logout', {
    title: 'Logout'
  })
})

app.get('/api/allusers', (req, res) => {
  db.User.findAll().then(users => {
    res.json(users)
  })
})


//////////////////////////////////////////////////
// Endpoint to register a new user
//////////////////////////////////////////////////
app.post('/api/users', (req, res) => {
  let {
    username,
    password
  } = req.body

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

  ////////////////////////////////////////////////////
  ///////// Creating new user into database///////////
  db.User.create({
      username,
      password
    })
    .then(user => {
      /*
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
*/
      ///////////////////////////////////////////
      //db.List.create////////////

      db.List.create({
        title: "My List",
        userId: user.id
      }).then(list => {
        // Return a HTTP 201 response
        return res.status(201).json({
          status: 'OK',
          message: 'You have created a list!'
        })
      }).catch(error => {
        //item was not created
        res.status(422).json({
          status: 'ERROR',
          message: 'An error occured creating list'
        })
      }) //husk at sidste parantes ikke skal med hvis nedstående skal inkluderes
      /*, {
        include: [{
          model: db.User,
          attributes: ['username']
        }] */
    }).catch(error => {
      //item was not created
      res.status(422).json({
        status: 'ERROR',
        message: 'An error occured creating user'
      })
    })
})

///////////////////////////////////////////////////////
// Endpoint to handle user authentication
///////////////////////////////////////////////////////
app.post('/api/auth', (req, res) => {
  let {
    username,
    password
  } = req.body

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
          message: 'Invalid credentials, user not found'
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

          console.log(req.session)

          // Send a response
          res.json({
            status: 'OK',
            message: 'You have been authenticated!'
          })
        })
    })
})

///////////////////////////////////////////////////////


/////////////////////////////////////////////////
// Endpoint to destroy the session's data
/////////////////////////////////////////////////
app.get('/api/auth/logout', (req, res) => {
  req.session.destroy()

  res.redirect('/logout.html')
})


//Return list items
  app.get('/api/allitems', (req, res) => {
    db.Item.findAll().then(items => {
      res.json(items)
    })
  })

  app.get('/api/alllists', (req, res) => {
    db.List.findAll().then(lists => {
      res.json(lists)
    })
  })


/////////////////////////////////////////////////////////
///MAKE LIST AND ADD ITEMS
//////////////////////////////////////////////////////
app.get('/api/list', userIsAuthenticated, (req, res) => {
  let query = {
    where: {
      id: req.session.user.id
    },
    include: [
      db.Item
    ]
  }


  db.List.findOne(query).then(list => {
    res.json(list)
    // list.items => array of objects
  })

  /*
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
  */
})

//posting a new song to the list
app.post('/api/list', userIsAuthenticated, (req, res) => {
  let {
    titleArtist
  } = req.body

  let user_id = req.session.user.id

  // seaching for user id in database
  let query = {
    where: {
      userId: user_id
    }
  }

  //searching for list from user
  db.List.findOne(query)
    .then(list => {
      //cheking if list is available
      console.log('list found', query)
      if (!list) {
        return res.status(422).json({
          status: 'ERROR',
          message: 'No list available'
        })
      }
      //adding item to list
    /*list.createItem({

        titleArtist
      })*/
      db.Item.create({
        titleArtist
      }).then(newItem => {
        list.addItem(newItem)
      }).catch(error => {
        //item was not created
        res.status(422).json({
          status: 'ERROR',
          message: 'An error occured creating item'
        })
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

/////////////////////////////////////////////////////////




// Sync models to the database
// Note: You want to set force to false so that data is not destroyed on server restart
db.sequelize.sync({
  force: false
}).then(() => {
  server.listen(3000, () => {
      // Sequelize needs the related model to insert
      // Documentation: http://docs.sequelizejs.com/manual/tutorial/associations.html#creating-with-associations
    console.log('Database is ready and server is running..')
  })
})



app.delete('api/item/:item_id', (req, res) => {
db.Item.delete({
  where: {
    id: req.params.item_id
  }
})
})
