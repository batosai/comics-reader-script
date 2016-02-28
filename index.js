var config   = require('./config.js');
var series   = require('./series.js');
var book     = require('./book.js');
var creatDir = require('./creatDir.js');
var arg      = process.argv.slice(2);

creatDir(config.path);

config.db.serialize(function() {
  config.db.run("CREATE TABLE IF NOT EXISTS series (title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255))");
  config.db.run("CREATE TABLE IF NOT EXISTS volumes (serie_id int, title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255), finish int)");
});

var get = function(){
  'use strict';

  config.db.serialize(function() {
    config.db.each("SELECT rowid AS id, * FROM volumes WHERE finish=0 LIMIT 1", (err, book) => {
        book(book, () => {
          get();
        });
    });
  });
};

if(arg[0] == 'series') {
  series(config.site);
}

if(arg[0] == 'get') {
  get();
}




// Problème avec certain comics
// var jsdom = require("jsdom");
// jsdom.env({
//   url: 'http://fr.comics-reader.com/series/batman__new_52_fr/',
//   done: (errors, window) => {
//     // console.log(window.document.querySelectorAll('.group').length);
//     console.log(errors);
//   }
// });
// var volumes  = require('./volumes.js');
// volumes('Batman-New-52', 'http://fr.comics-reader.com/series/batman__new_52_fr/', 98);
