const http = require('http');
const port = process.env.PORT || 3001;
const app = require('./app');
const server = http.createServer(app);
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// const app = express();
const mysql = require('mysql');
const q = require('./queries');
const geodist = require('geodist');
const crypto = require('crypto');

server.listen(port, ()=>console.log(`Listening on port: `, port))


