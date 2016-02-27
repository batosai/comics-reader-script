var Zip      = require('./zip.js'), zip = new Zip();
var config   = require('./config.js');
var series   = require('./series.js');
var book     = require('./book.js');
var creatDir = require('./creatDir.js');

config.db.serialize(function() {
  config.db.run("CREATE TABLE IF NOT EXISTS series (title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255))");
  config.db.run("CREATE TABLE IF NOT EXISTS volumes (serie_id int, title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255), finish int)");
});

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



creatDir(config.path);
series(config.site);

// zip.create();
// book('http://fr.comics-reader.com/read/spiderwoman__marvel_now_fr/fr/0/3/page/1');
