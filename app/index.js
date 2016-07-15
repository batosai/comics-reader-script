var config   = require('./config.js');
var serie   = require('./serie.js');
var volume  = require('./volume.js');
var book     = require('./book.js');
var page     = require('./page.js');
var creatDir = require('./creatDir.js');
var Zip      = require('./zip.js');
var arg      = process.argv.slice(2);
var fs       = require("fs");
var Log      = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));
var cronJob  = require('cron').CronJob;

creatDir(config.path);

config.db.serialize(function() {
  config.db.run("CREATE TABLE IF NOT EXISTS series (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255), active INTEGER DEFAULT 1)");
  config.db.run("CREATE TABLE IF NOT EXISTS volumes (id INTEGER PRIMARY KEY AUTOINCREMENT, serie_id INTEGER, title VARCHAR(255), slug VARCHAR(255), path VARCHAR(255), link VARCHAR(255), pages INTEGER DEFAULT 0, finish INTEGER DEFAULT 0)");
  config.db.run("CREATE TABLE IF NOT EXISTS pages (id INTEGER PRIMARY KEY AUTOINCREMENT, volume_id INTEGER, name VARCHAR(255), path VARCHAR(255), link VARCHAR(255), finish INTEGER DEFAULT 0)");
});

var visited = [];
var getVolumes = function(){
  'use strict';

  // let where = 'WHERE id > 596';
  let where = '';
  if(visited.length) {
    // where = 'WHERE id > 596 AND id NOT IN(' + visited.join() + ')';
    where = 'WHERE id NOT IN(' + visited.join() + ')';
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

if(arg[0] == 'all') {
  // s m h d M DayWeek
  new cronJob('0 0 0 * * 0', function() {
    serie(config.site);
  }, null, true);

  new cronJob('0 0 6 * * 0', function() {
    getVolumes();
  }, null, true);

  new cronJob('0 0 0 * * 1', function() {
    getBooks();
  }, null, true);

  new cronJob('0 0 0 * * 2', function() {
    getPages("AND pages.id >= 300000");
  }, null, true);
}

if(arg[0] == 'zip') {

  config.db.serialize(() => {
    'use strict';

    config.db.each("SELECT volumes.*, series.path AS dir FROM volumes INNER JOIN series ON series.id=volumes.serie_id WHERE volumes.finish=0", (err, v) => {
      config.db.each("SELECT count(*) as count FROM pages WHERE volume_id=" + v.id, (err, row) => {
        if(row.count == v.pages) {
          creatDir(config.pathEbook + '/' + v.dir);

          let zip = new Zip(config.path + '/' + v.path + '/', config.pathEbook + '/' + v.dir + '/' + v.slug + '.cbz');
          zip.create(() => {

              config.db.serialize(() => {
                config.db.run("UPDATE volumes SET finish=1 WHERE id=" + v.id);
              });

          });
        }
      });
    });
  });

  // if nb pages == column pages in volume
  // zip
  // update volume finish=1
}
