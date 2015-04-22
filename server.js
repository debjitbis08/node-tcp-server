'use strict';

var http = require('http');
var mysql = require('mysql');
var net = require('net');

var nconf = require('nconf');

nconf.argv()
     .env()
     .file({ file: 'config.json' });

var PORT = nconf.get('port');

var connection = mysql.createConnection({
    host     : nconf.get('DB_HOST'),
    user     : nconf.get('DB_USER'),
    password : nconf.get('DB_PASSWORD'),
    database : nconf.get('DB_NAME')
});

var server = net.createServer(function(socket) {

    socket.on('data', function(data) {
        var response = data.toString().trim();
        
        console.log(response);
        saveToDB(data, function (id) {
            console.log('Saved ' + response + ' successfully, with id ' + id);
        }, function (err) {
            console.log('ERR: Failed to save data ' + response);
            console.error(err);
        });
    });

    socket.on('end', function() {
        console.log('client disconnected');
    });

    /*
    if (request.method === 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });
        request.on('end', function () {
            saveToDB(body, function (id) {
                sendRow(id, response);
            }, function (err) {
                response.writeHead(400);
                response.end('Failed to save data');
            });
        });
    } else {
        sendList(response);
    }
    */
});

function sendList(response) {
    getList(function (rows) {
        response.writeHead(200, { 
            'Content-Type': 'application/json' 
        }); 
        response.end(JSON.stringify(rows)); 
    });
}

function sendRow(id, response) {
    getItem(id, function (row) {
        response.writeHead(200, { 
            'Content-Type': 'application/json' 
        }); 
        response.end(JSON.stringify(row[0])); 
    });
}

function getList(success) {
    connection.query('SELECT * FROM data;', function (error, rows, fields) { 
        success(rows);
    }); 
}

function getItem(id, success) {
    connection.query('SELECT * FROM data WHERE ?;', {id: id}, function (error, rows, fields) { 
        success(rows);
    }); 
}

function saveToDB(data, success, fail) {
    connection.query('INSERT INTO data SET ?', {text: data}, function (err, result) {
        if (err) {
            if (typeof fail === 'function') { fail(err); } 
            else { throw err; }
        }

        if (typeof success === 'function') { success(result.insertId); } 
    });
}

server.listen(PORT, function() {
    console.log('Started server on port ', PORT);
});
