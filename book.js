var http     = require("http");
var fs       = require("fs");
var jsdom    = require("jsdom");
var Log      = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));
var Zip      = require('./zip.js');
var config   = require('./config.js');

module.exports = (book, callback) => {
  'use strict';
  let pages = [];
  let it    = 0;

  jsdom.env({
    url: book.link,
    done: (errors, window) => {
      (function(){
        let links  = window.document.querySelectorAll('.topbar_right ul.dropdown li a');
        let length = links.length;
        let id     = book.id;

        config.db.serialize(() => {
          config.db.run("UPDATE volumes SET pages=" + length + " WHERE rowid=" + id);

          for (let index in links) {
            let href = links[index].href;
            let stmt = config.db.prepare("INSERT INTO pages (volumes_id, name, link) VALUES (?, ?, ?, ?)");
            stmt.run(id, 'page' + index + '.jpg',href);
            stmt.finalize();

            if(parseInt(index)+1 == length) {
              callback();
            }
          }
        });

        // for (let index in links) {
        //   let href = links[index].href;
        //
        //   if(href) {
        //     pages.push(href);
        //     if((parseInt(index) + 1) === links.length) {
        //       download();
        //     }
        //   }
        // }
      })();
    }
  });

  let download = () => {
    jsdom.env({
      url: pages[it],
      done: (errors, window) => {
        (function(){
          let file  = fs.createWriteStream(config.path + '/' + book.path + "/page"+ it +".jpg");
          let image = window.document.querySelectorAll('#page img.open')[0].src;

          http.get(image, (res) => {
            res.pipe(file);
            res.on('end', () => {
              console.log(config.path + '/' + book.path + "/page"+ it +".jpg : done");
              it++;
              if(it < pages.length){
                download();
              }
              else {
                // update

                // let zip = new Zip(config.path + '/' + book.path + '/');
                // zip.create(() => {
                //   fs.rmdir(config.path + '/' + book.path, () => {
                    config.db.serialize(() => {
                      config.db.run("UPDATE volumes SET finish=1 WHERE rowid=" + book.id);
                    });
                //   });
                // });

                callback();
              }

            });
            res.resume();

          }).on('error', (e) => {
            // console.log(`Got error: ${e.message}`);
            log.error('Got error: %s', e.message);
          });
        })();
      }
    });
  };
};
