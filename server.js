'use strict';
// Constantes de trabajo
const express = require('express')
const bodyParser = require('body-parser');
var url = require('url');
const querystring = require('querystring'); 
var MongoClient = require('mongodb').MongoClient;

//// ------------------------------------------------------------------------------------
var url = "mongodb://localhost:27017/";

//// --------------------------------------------------------------------------------------
var app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// GET (página principal)
app.get("/", function (req, res, error){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.collection("sensores").find({}).toArray(function(err, result) {
		  if (err) throw err;
		  dbo.collection("movimientos").find({}).toArray(function(err, resultados) {
			if (err) throw err;
			console.log(result)
			console.log(resultados)
			db.close();
		  });

		  db.close();
		});
	  });

})

// POST (para insertar sensores)
app.post("/sensores", function(req, res) {
	var s1 = req.body.s1;
	var s2 = req.body.s2;
	var s3 = req.body.s3;
	var s4 = req.body.s4;
	var s5 = req.body.s5;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		var myobj = { s1: s1, s1: s2, s1: s3, s1: s4, s1: s5 };
		dbo.collection("sensores").insertOne(myobj, function(err, res) {
		  if (err) throw err;
		  console.log("1 documento insertado");
		  db.close();
		});
	  });	
});

// POST (para insertar movimientos)
app.post("/movimiento", function(req, res) {
	var movimiento = req.body.mov;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		var myobj = { movimiento: mov };
		dbo.collection("movimientos").insertOne(myobj, function(err, res) {
		  if (err) throw err;
		  console.log("1 documento insertado");
		  db.close();
		});
	  });	
});

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	var dbo = db.db("piCar");
	dbo.createCollection("sensors", function(err, res) {
	  if (err) throw err;
	  console.log("¡Collección sensores creada exitosamente!");
	  db.close();
	});
	});
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.createCollection("movimientos", function(err, res) {
		if (err) throw err;
		console.log("¡Collección movimientos creada exitosamente!");
		db.close();
		});
	});
  // [END server]
}

module.exports = app;





