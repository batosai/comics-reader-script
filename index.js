var config   = require('./config.js');
var series   = require('./series.js');
var volumes  = require('./volumes.js');
var book     = require('./book.js');
var creatDir = require('./creatDir.js');
var arg      = process.argv.slice(2);

creatDir(config.path);

config.db.serialize(function() {
  config.db.run("CREATE TABLE IF NOT EXISTS series (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255))");
  config.db.run("CREATE TABLE IF NOT EXISTS volumes (id INTEGER PRIMARY KEY AUTOINCREMENT, serie_id INTEGER, title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255), pages INTEGER DEFAULT 0, finish INTEGER DEFAULT 0)");
  config.db.run("CREATE TABLE IF NOT EXISTS pages (id INTEGER PRIMARY KEY AUTOINCREMENT, volumes_id INTEGER, name VARCHAR(255), link VARCHAR(255), finish INTEGER DEFAULT 0)");
});

var getPages = function(){
  'use strict';

  config.db.serialize(function() {
    config.db.each("SELECT * FROM volumes WHERE pages=0 LIMIT 1", (err, b) => {
        console.log(b.id, b.title);
        book(b, () => {
          getPages();
        });
    });
  });
};

var visited = [];
var getVolumes = function(){
  'use strict';

  let where = '';
  if(visited.length) {
    where = 'WHERE id NOT IN(' + visited.join() + ')';
  }

  config.db.serialize(function() {
    config.db.each("SELECT * FROM series " + where + " LIMIT 1", (err, s) => {
        visited.push(s.id);
        console.log(s.id, s.title);
        volumes(s, () => {
          getVolumes();
        });
    });
  });
};

if(arg[0] == 'series') {
  series(config.site);
}

if(arg[0] == 'volumes') {
  getVolumes();
}

if(arg[0] == 'pages') {
  getPages();
}

// separer series et volumes pour les rendre indépendant.
// Il faut que tous soit indépendant. Le zip, le dl des books, series voir volumes.
// Tout doit aussi pouvoir ce lancer par ligne de commande genre npm start book http://...
// npm start zip /dir
