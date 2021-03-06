var http     = require("http");
var fs       = require("fs");
var jsdom    = require("jsdom");
var Log      = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));
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

            config.db.serialize(() => {
              config.db.run("UPDATE pages SET finish=1 WHERE id=" + page.id);
            });

              callback();

            });
            res.resume();

          }).on('error', (e) => {
            // console.log(`Got error: ${e.message}`);
            log.error('Get page error: %s', e.message);
            callback();
          });
        } catch (e) {
          log.error('Get page error try: %s', e.message);
          callback();
        }
      })();
    }
  });
};
