var createError = require('http-errors');
var express = require('express');

var fileUpload = require('express-fileupload')


var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db = require('./config/connection')   // database connection config
var exphbs = require("express-handlebars")
var moment = require('moment');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var userRouter = require('./routes/user');
var employerRouter = require('./routes/employer');
var adminRouter = require('./routes/admin');

var app = express();

// taking session
var session=require('express-session'); 
var hbs = require('hbs')

hbs.registerHelper('ifeq', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('if_eq', function () {
  const args = Array.prototype.slice.call(arguments, 0, -1);
  const options = arguments[arguments.length - 1];
  const allEqual = args.every(function (expression) {
    return args[0] === expression;
  });

  return allEqual ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('formatDate', function(dateString) {
  return new hbs.SafeString(
      moment(dateString).format("MMM D YYYY").toUpperCase()
  );
});

hbs.registerHelper('ifIn', async (elem, list, options) => {
  console.log(list)
 let status = await list.findIndex(elem)
 console.log(status)
  if(status > -1) 
    return options.fn(this);
  else
  return options.inverse(this);
  
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false,limit:"50mb"}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())

// app.use(moment())

 //data base connecting
db.connect((err)=>{
  if(err){
    console.log('connection error'+err);
  }else{
     console.log('database connected to port 27017');
  }
})

//connecting session
app.use(session({          
  secret:'itsmykey',
  cookie:{maxAge:3600000000000}
}))


// app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/',userRouter);
app.use('/employer',employerRouter);
app.use('/admin',adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
