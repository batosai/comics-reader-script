var http     = require("http");
var fs       = require("fs");
var jsdom    = require("jsdom");
var Log      = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));
var Zip      = require('./zip.js');
var config   = require('./config.js');

module.exports = (page, callback) => {
  'use strict';

  jsdom.env({
    url: page.link,
    done: (errors, window) => {
      (function(){
        try {
          let file  = fs.createWriteStream(config.path + '/' + page.path + "/" + page.name);
          let image = window.document.querySelectorAll('#page img.open')[0].src;

          http.get(image, (res) => {
            res.pipe(file);
            res.on('end', () => {

              // let zip = new Zip(config.path + '/' + book.path + '/');
              // zip.create(() => {
              //   fs.rmdir(config.path + '/' + book.path, () => {
                  config.db.serialize(() => {
                    config.db.run("UPDATE pages SET finish=1 WHERE id=" + page.id);
                  });
              //   });
              // });

              callback();

            });
            res.resume();

          }).on('error', (e) => {
            // console.log(`Got error: ${e.message}`);
            log.error('Got error: %s', e.message);
          });
        } catch (e) {
          callback();
        }
      })();
    }
  });
};
