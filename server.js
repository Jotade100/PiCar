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
function color(elemento) {
	if (elemento == JSON.stringify("0")){
		return '<span class="badge badge-danger">&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp <p> &nbsp </span>';
	} else {
		return '<span class="badge badge-dark">&nbsp &nbsp &nbsp &nbsp  &nbsp &nbsp<p> &nbsp</span>';
	}
}

function colorTrace(elemento) {
	if (elemento == JSON.stringify("0")){
		return '<span class="badge badge-pill badge-danger m-2">&nbsp</span>';
	} else {
		return '<span class="badge badge-pill badge-dark m-2">&nbsp</span>';
	}
}

function definirEstado(elemento) {
	if (elemento == JSON.stringify("running")){
		return '<span class="badge badge-pill badge-success m-2"> Running </span>';
	} else if (elemento == JSON.stringify("stop"))  {
		return '<span class="badge badge-pill badge-danger m-2"> Stop </span>';
	} else {
		return '<span class="badge badge-pill badge-warning m-2"> ' + elemento + ' </span>';
	}
}

function stringABoolean(elemento) {
	if (elemento == JSON.stringify("true")){
		return true;
	} else {
		return false;
	}
}

function convertiraEntero(elemento) {
	//console.log(elemento);
	if(!isNaN(parseInt(elemento))) {
		return parseInt(elemento);
	} else {
		return 0;
	}
}


function ultimos5(array) {
	var resultado = []
	for (var i = 0; i < 5; i++) {
		var espacio = []
		array[i].sensores.forEach(element => {
			espacio.push(colorTrace(JSON.stringify(element)))
		});
		resultado.push(espacio);
	}
	return resultado;
}


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
			dbo.collection("estado").find({}).toArray(function(err, resultado) {
				if (err) throw err;
				dbo.collection("encendido").find({}).toArray(function(err, results) {
					if (err) throw err;
					// sensores
					console.log("Result: " + JSON.stringify(result[result.length-1].sensores));
					// movimientos
					var movimiento = "La Tierra no se mueve pero se mueve";
					if(JSON.stringify(result[result.length-1].sensores) == JSON.stringify(["0","1","1","0","0"]) || JSON.stringify(result[result.length-1].sensores) == JSON.stringify(["0","1","0","0","0"]) || JSON.stringify(result[result.length-1].sensores) == JSON.stringify(["1","0","0","0","0"])) {
						console.log("RIGHT");
						movimiento = '<div class="alert alert-primary" role="alert"> Derecha </div>';
					} else if(JSON.stringify(result[result.length-1].sensores) == JSON.stringify(["0","0","1","1","0"]) || JSON.stringify(result[result.length-1].sensores) == JSON.stringify(["0","0","0","1","0"]) || JSON.stringify(result[result.length-1].sensores) == JSON.stringify(["0","0","0","0","1"])  || JSON.stringify(result[result.length-1].sensores) == JSON.stringify(["0","0","0","1","1"])) {
						console.log("LEFT");
						movimiento = '<div class="alert alert-success" role="alert"> Izquierda </div>';
					} else {
						console.log("CAMINANDO");
						movimiento = '<div class="alert alert-dark" role="alert"> Andando </div>';
					}
					// estado (corriendo o estacionado; velocidad)
					console.log("Resultado: " + JSON.stringify(resultado[resultado.length-1]))
					// encendido (si el carro está encendido)
					console.log("Results: " + JSON.stringify(results[results.length-1]))
					res.render('index',{r1: color(JSON.stringify(result[result.length-1].sensores[0])),
						 r2: color(JSON.stringify(result[result.length-1].sensores[1]))
						, r3: color(JSON.stringify(result[result.length-1].sensores[2]))
						, r4: color(JSON.stringify(result[result.length-1].sensores[3]))
						, r5: color(JSON.stringify(result[result.length-1].sensores[4]))
						, trace: ultimos5(result.slice(result.length-5, result.length))
						, encendido: stringABoolean(JSON.stringify(results[results.length-1].boton))
						, estado: definirEstado(JSON.stringify(resultado[resultado.length-1].estado)),
						movim: movimiento
						, velocidad: convertiraEntero(JSON.stringify(resultado[resultado.length-1].velocidad))
						, velocidadImagen: convertiraEntero(JSON.stringify(resultado[resultado.length-1].velocidad)) +10	

						//mov: JSON.stringify(resultados[resultados.length-1])
					});
					console.log(stringABoolean(JSON.stringify(results[results.length-1].boton)));
					console.log(convertiraEntero(JSON.stringify(resultado[resultado.length-1].velocidad)))
					//res.send(result);
					db.close();
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

// GET Y ENCENDIDO
// var ssh = new SSH({
//     host: '192.168.43.59',
//     user: 'pi',
//     pass: 'raspberry'
// });



app.get("/encendido", function (req, res, error){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.collection("encendido").find({}).toArray(function(err, result) {
		  if (err) throw err;
		  console.log(result);
		  //res.send(result[result.length-1]);
		  if(result[result.length-1].boton == "true") {
			// ssh.exec('', {
			// 	out: function(stdout) {
			// 		console.log(stdout);
			// 	}
			// }).start();
			res.send(true);
		   //process.exit();
		  } else {
			// ssh.exec('', {
			// 	out: function(stdout) {
			// 		console.log(stdout);
			// 	}
			// }).start();
			console.log("ME LLEVA LA GRAN %&$@")
			res.send(false);

		  }
		  db.close();
		});
	  });

})


// POST (para insertar sensores)
app.post("/sensores", function(req, res) {
	var sensores = req.body.status;
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		var myobj = {sensores: sensores };
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
	console.log("Base de datos reiniciada")
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var dbo = db.db("piCar");
		dbo.createCollection("sensores", function(err, res) {
		  if (err) throw err;
		  console.log("¡Collección sensores creada exitosamente!");
		  db.close();
		  MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("piCar");
			var myobj = [{ sensores: [1,2,3,4,5]}, { sensores: [1,2,3,4,5]}, { sensores: [1,2,3,4,5]}, { sensores: [1,2,3,4,5]}, { sensores: [1,2,3,4,5]}];
			dbo.collection("sensores").insertMany(myobj, function(err, res) {
			  if (err) throw err;
			  console.log("1 documento insertado");
			  db.close();
			});
		  });
		});
	  });
	  
		
	  
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("piCar");
			dbo.createCollection("estado", function(err, res) {
			  if (err) throw err;
			  console.log("¡Collección estado creada exitosamente!");
			  db.close();
			  MongoClient.connect(url, function(err, db) {
				if (err) throw err;
				var dbo = db.db("piCar");
				var myobj = { estado: "Como la democracia", velocidad: 0};
				dbo.collection("estado").insertOne(myobj, function(err, res) {
				  if (err) throw err;
				  console.log("1 documento insertado");
				  db.close();
				});
			  });
		});
	  });
	  
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("piCar");
			dbo.createCollection("encendido", function(err, res) {
			  if (err) throw err;
			  console.log("¡Collección encendido creada exitosamente!");
			  db.close();
			  MongoClient.connect(url, function(err, db) {
				if (err) throw err;
				var dbo = db.db("piCar");
				var myobj = { boton: true};
				dbo.collection("encendido").insertOne(myobj, function(err, res) {
				  if (err) throw err;
				  console.log("1 documento insertado");
				  db.close();
				});
			  });
		});
	  });
	  
  });
  
  // [END server]
}

module.exports = app;





