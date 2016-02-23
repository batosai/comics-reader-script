var fs          = require("fs");
var http        = require("http");
var jsdom       = require("jsdom");
var archiver    = require('archiver'); // https://www.npmjs.com/package/archiver
var slug        = require('slug');
var sqlite3     = require('sqlite3').verbose();
var Log         = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));

var db = new sqlite3.Database('comics.sqlite');
var path = 'books';
var site = 'http://fr.comics-reader.com/directory/';

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS series (title VARCHAR(255), slug VARCHAR(255), link VARCHAR(255))");
  db.run("CREATE TABLE IF NOT EXISTS volumes (serie_id int, title VARCHAR(255), slug VARCHAR(255), link VARCHAR(255), finish int)");

  // db.run("CREATE TABLE lorem (info TEXT)");
  // var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
  // for (var i = 0; i < 10; i++) {
  //     stmt.run("Ipsum " + i);
  // }
  // stmt.finalize();
  //
  // db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
  //     console.log(row.id + ": " + row.info);
  // });
});

// db.close();

var creatDir = function(path){
  if(!fs.existsSync(path)){
     fs.mkdirSync(path, 0766, (err) => {
       if(err){
         log.error('Can\'t make the directory %s!', path);
       }
     });
  }
};

creatDir(path);

/*
var pages = [];
var it    = 0;

jsdom.env({
  url: 'http://fr.comics-reader.com/read/spidergwen__allnew_alldifferent_fr/fr/0/1/page/1',
  done: (errors, window) => {
    'use strict';
    let links = window.document.querySelectorAll('.topbar_right ul.dropdown li a');

    for (let index in links) {
      var href = links[index].href;

      if(href) {
        pages.push(href);
        if((parseInt(index) + 1) === links.length) {
          download();
        }
      }
    }
  }
});

var download = () => {
  jsdom.env({
    url: pages[it],
    done: (errors, window) => {
        'use strict';
        let file  = fs.createWriteStream("books/page"+ it +".jpg");
        let image = window.document.querySelectorAll('#page img.open')[0].src;

        http.get(image, (res) => {
          res.pipe(file);
          res.on('end', () => {
            it++;
            if(it < pages.length){
              download();
            }

          });
          res.resume();

        }).on('error', (e) => {
          // console.log(`Got error: ${e.message}`);
          log.error('Got error: %s', e.message);
        });

    }
  });
};
*/

var series = function(url) {
  jsdom.env({
    url: url,
    done: (errors, window) => {
      'use strict';
      let groups = window.document.querySelectorAll('.group');

      db.serialize(function() {
        var stmt = db.prepare("INSERT INTO series VALUES (?, ?, ?)");

        for (let i in groups)
        {
          let group = groups[i];
          let a = group.querySelectorAll('.title a');
          let title = a[0].innerHTML;
          title = title.replace(' [FR]', '');
          let link  = a[0].href;

          creatDir(path + '/' + slug(title));
          // TODO run if no present in db
          stmt.run(title, slug(title), link);
          console.log(title, link);

          if((parseInt(i) + 1) === groups.length) {
            let next = window.document.querySelectorAll('.prevnext .next a');
            if(next.length) {
              series(next[1].href);
            }
          }
        }
        stmt.finalize();
      });
    }
  });
};
series(site);


var volumes = function(url) {
  jsdom.env({
    url: url,
    done: (errors, window) => {
      'use strict';
      let groups = window.document.querySelectorAll('.group');

      db.serialize(function() {
        var stmt = db.prepare("INSERT INTO volumes VALUES (?, ?, ?, ?, ?)");
        for (let group of groups)
        {
          let a = group.querySelectorAll('.title a')[0];
          let title = a.title;
          let link  = a.href;

          console.log(title, link);
          // TODO run if no present in db
          stmt.run(1, title, slug(title), link, 0);
        }
        stmt.finalize();
      });
    }
  });
};
// volumes('http://fr.comics-reader.com/series/xmen_select_fr/');

(function(){
  'use strict';
  class Zip {
      constructor(path, name) {
          this.path    = path;
          this.name    = name;
          this.output  = fs.createWriteStream(this.name);
          this.archive = archiver('zip');
      }

      create() {
        let self = this;
        this.output.on('close', () => {
          console.log(self.archive.pointer() + ' total bytes');
          // console.log('archiver has been finalized and the output file descriptor has closed.');
          log.info(self.archive.pointer() + ' total bytes');
          log.info('Archiver has been finalized and the output file descriptor has closed.');
        });

        this.archive.on('error', (err) => {
          throw err;
        });

        this.archive.pipe(this.output);

        let files = fs.readdirSync(this.path);
        for (let file of files){
            let name = this.path + file;
            this.archive.append(fs.createReadStream(name), { name: file });
        }

        this.archive.finalize();
      }
  }

  // var z = new Zip('books/', __dirname + '/book.cbz');
  // z.create();
})();
