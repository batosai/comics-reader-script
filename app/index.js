var config   = require('./config.js');
var serie   = require('./serie.js');
var volume  = require('./volume.js');
var book     = require('./book.js');
var page     = require('./page.js');
var creatDir = require('./creatDir.js');
var arg      = process.argv.slice(2);
var fs       = require("fs");
var Log      = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));

creatDir(config.path);

config.db.serialize(function() {
  config.db.run("CREATE TABLE IF NOT EXISTS series (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255), active INTEGER DEFAULT 1)");
  config.db.run("CREATE TABLE IF NOT EXISTS volumes (id INTEGER PRIMARY KEY AUTOINCREMENT, serie_id INTEGER, title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255), pages INTEGER DEFAULT 0, finish INTEGER DEFAULT 0)");
  config.db.run("CREATE TABLE IF NOT EXISTS pages (id INTEGER PRIMARY KEY AUTOINCREMENT, volume_id INTEGER, name VARCHAR(255), path VARCHAR(255), link VARCHAR(255), finish INTEGER DEFAULT 0)");
});

var visited = [];
var getVolumes = function(){
  'use strict';

  let where = 'WHERE id > 596';
  if(visited.length) {
    where = 'WHERE id > 596 AND id NOT IN(' + visited.join() + ')';
  }

  config.db.serialize(function() {
    config.db.each("SELECT * FROM series " + where + " LIMIT 1", (err, s) => {
        visited.push(s.id);
        console.log(s.id, s.title);
        log.info(s.id + ' ' + s.title);
        volume(s, () => {
          getVolumes();
        });
    });
  });
};

var getBooks = function(){
  'use strict';

  config.db.serialize(function() {
    config.db.each("SELECT * FROM volumes WHERE pages=0 LIMIT 1", (err, b) => {
        console.log(b.id, b.title);
        log.info(b.id + ' ' + b.title);
        book(b, () => {
          getBooks();
        });
    });
  });
};

var getPages = function($options){
  'use strict';

  config.db.serialize(function() {
    config.db.each("SELECT pages.* FROM pages INNER JOIN volumes ON volumes.id=pages.volume_id INNER JOIN series ON series.id=volumes.serie_id WHERE pages.finish=0 AND series.active=1 "+ $options +" LIMIT 1", (err, p) => {
        console.log(p.id, p.path + '/' + p.name);
        log.info(p.id + ' ' + p.path + '/' + p.name);
        page(p, () => {
          getPages($options);
        });
    });
  });
};

if(arg[0] == 'series') {
  serie(config.site);
}

if(arg[0] == 'volumes') {
  getVolumes();
}

if(arg[0] == 'books') {
  getBooks();
}

if(arg[0] == 'pages') {
  getPages("AND pages.id < 100000");
  getPages("AND pages.id >= 100000 AND pages.id < 200000");
  getPages("AND pages.id >= 200000 AND pages.id < 300000");
  getPages("AND pages.id >= 300000");
}

if(arg[0] == 'zip') {
  // if nb pages == column pages in books
  // zip
  // remove dir
  // update book finish=1
}
