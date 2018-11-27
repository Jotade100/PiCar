'use strict';
// Constantes de trabajo
const express = require('express')
const bodyParser = require('body-parser');
const querystring = require('querystring'); 
var MongoClient = require('mongodb').MongoClient;
var exec = require('child_process').exec;
var path = require('path');
var hbs = require('express-handlebars');
//// ------------------------------------------------------------------------------------
var url = "mongodb://localhost:27017/";

//// --------------------------------------------------------------------------------------
var app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
/// ---------------------------------------------------------------------------------------
// definiendo render engine. 
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

/// ---------------------------------------------------------------------------------------

app.get("/start", function(req,res){
	res.render('index');
});

// GET (página principal)
app.get("/", function (req, res, error){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.collection("sensores").find({}).toArray(function(err, result) {
		  if (err) throw err;
		  dbo.collection("movimientos").find({}).toArray(function(err, resultados) {
			if (err) throw err;
			dbo.collection("estado").find({}).toArray(function(err, resultado) {
				if (err) throw err;
				dbo.collection("encendido").find({}).toArray(function(err, results) {
					if (err) throw err;
					// sensores
					console.log("Result: " + JSON.stringify(result[result.length-1].sensores));
					// movimientos
					console.log("Resultados: " + JSON.stringify(resultados[resultados.length-1]))
					// estado (corriendo o estacionado; velocidad)
					console.log("Resultado: " + JSON.stringify(resultado[resultado.length-1]))
					// encendido (si el carro está encendido)
					console.log("Results: " + JSON.stringify(results[results.length-1]))
					res.render('index',{r1:JSON.stringify(result[result.length-1].sensores[1]),
						 r2:JSON.stringify(result[result.length-1].sensores[2])
						, r3:JSON.stringify(result[result.length-1].sensores[3])
						, r4:JSON.stringify(result[result.length-1].sensores[4])
						, r5:JSON.stringify(result[result.length-1].sensores[5])
						, results: JSON.stringify(results)
						, estado: JSON.stringify(resultado[resultado.length-1].estado)
						//mov: JSON.stringify(resultados[resultados.length-1])
					});
					//res.send(result);
					db.close();
				});
			});
		  });
		});
		});
		
})

// GET (métodos para el carro)
app.get("/estado", function (req, res, error){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.collection("estado").find({}).toArray(function(err, result) {
		  if (err) throw err;
		  console.log(result)
		  db.close();
		});
	  });

})

app.get("/encendido", function (req, res, error){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.collection("encendido").find({}).toArray(function(err, result) {
		  if (err) throw err;
		  console.log(result)
		  if(result[result.lenght()-1].boton) {
			child = exec("python line_follower.py", function (error, stdout, stderr) {
				if (error !== null) {
					console.log('exec error: ' + error);
				}
			});
		  } else {
			child = exec("^C", function (error, stdout, stderr) {
				if (error !== null) {
					console.log('exec error: ' + error);
				}
			});

		  }
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
	var sensores = req.body.status;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		var myobj = { s1: s1, s1: s2, s1: s3, s1: s4, s1: s5, sensores: sensores };
		dbo.collection("sensores").insertOne(myobj, function(err, res) {
		  if (err) throw err;
			console.log("1 documento insertado");
			db.close();
		});
		});
		res.send('HOLA');
});

// POST (para insertar movimientos)
app.post("/movimiento", function(req, res) {
	var movimiento = req.body.mov;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		var myobj = { movimiento: movimiento };
		dbo.collection("movimientos").insertOne(myobj, function(err, res) {
		  if (err) throw err;
		  console.log("1 documento insertado");
		  db.close();
		});
	  });	
});

// POST (para comunicar el estado del carro desde la página)
app.post("/estado", function(req, res) {
	var movimiento = req.body.mov;
	var velocidad = req.body.vel;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		var myobj = { estado: movimiento, velocidad: velocidad };
		dbo.collection("estado").insertOne(myobj, function(err, res) {
		  if (err) throw err;
		  console.log("1 documento insertado");
		  db.close();
		});
		});	
		res.send("np");
});

app.post("/encendido", function(req, res) {
	var variable = req.body.boton;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		var myobj = { boton: variable };
		dbo.collection("encendido").insertOne(myobj, function(err, res) {
		  if (err) throw err;
		  console.log("1 documento insertado");
		  db.close();
		});
		});
		res.send('HOLA');	
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
	dbo.dropDatabase();
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
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.createCollection("estado", function(err, res) {
		  if (err) throw err;
		  console.log("¡Collección estado creada exitosamente!");
		  db.close();
	});
  });
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.createCollection("encendido", function(err, res) {
		  if (err) throw err;
		  console.log("¡Collección encendido creada exitosamente!");
		  db.close();
	});
  });
  // [END server]
}

module.exports = app;





