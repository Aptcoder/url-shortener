"use strict";

var express = require("express");
var mongo = require("mongodb");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var multer = require("multer");
var dns = require("dns");
var cors = require("cors");

var app = express();

var upload = multer();
// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.DB_URI);
mongoose
  .connect(process.env.DB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .catch(cause => {
    console.log(cause);
  });

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.json());
app.use(upload.array());
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/form", (req, res) => {
  res.sendFile(process.cwd() + "/formpge.html");
});

mongoose.Promise = global.Promise;
// url schema
var urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
    // unique: true
  },
  short_url: {
    type: Number,
    default: 0
  }
});

//pre save url function
//

// urlSchema.path('original_url').validate(validator)

urlSchema.pre("save", function(next) {
  var url = this;
  console.log("i got here");
  Counter.findOneAndUpdate(
    { entity_id: "my counter" },
    { $inc: { seq: 1 } },
    { new: true },
    (err, counter) => {
      if (err) return next(err);
      console.log(counter.seq);
      url.short_url = counter.seq;
      next();
    }
  );
});

//counter schema
var counterSchema = new mongoose.Schema({
  seq: {
    type: Number,
    required: true,
    default: 0
  },
  entity_id: {
    type: String,
    required: true
  }
});

var Url = mongoose.model("Url", urlSchema);

//counter model
var Counter = mongoose.model("Counter", counterSchema);
var myCounter = new Counter({
  seq: 0,
  entity_id: "my counter"
});

myCounter.save((err, data) => {
  if (err) return console.log(err);
  console.log(data);
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

// app.post('/api/shorturl',(req,res)=>{
//   console.log(req.body.original_url)
//   res.send();
// })

//validator
var bool;
var boolup = function(tred){
  console.log("bool called :" + tred)
  bool = tred;
}
var validator = function(value) {
    var pro = new Promise((resolve,reject) => {
      dns.lookup(value, err => {
    if (err) {
      console.log(err);
      reject(false)
    }else{
      resolve(true);
    }
  });
    })
    pro.then((value) => {
      console.log("complete" + value )
    }).catch((val) => console.log("shii"))
  return pro
};

app.post("/api/shorturl/new", (req, res) => {
  var original = req.body.original_url;
  var newUrl = new Url({
    original_url: original
  });
  var bool = validator(original);
  bool.then(()=>{
    newUrl.save((err, url) => {
      console.log(err);
      if (err) {
        res.send({
          error: "invalid URL"
        });
        console.log("I got the Error" + err);
      }
      res.send({
        original_url: url.original_url,
        short_url: url.short_url
      });
    });
  }).catch(() => {
    res.send({
      error: "invalid URL"
    });
  })
//   if (bool == true) {
//     // newUrl.save((err, url) => {
//     //   // console.log(err);
//     //   if (err) {
//     //     res.send({
//     //       error: "invalid URL"
//     //     });
//     //     console.log("I got the Error" + err);
//     //   }
//     //   res.send({
//     //     original_url: url.original_url,
//     //     short_url: url.short_url
//     //   });
//     // });
//   } else {
//     res.send({
//       error: "invalid URL"
//     });
//   }
});

app.get("/api/shorturl/:num", (req, res) => {
  var num = Number(req.params.num);
  console.log(typeof num)
  Url.findOne({short_url:num}, (err, url) => {
    if(err){
      return console.log("num" + err)
    }
    console.log(url)
    res.status(301).redirect('http://'+url.original_url);
  });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
