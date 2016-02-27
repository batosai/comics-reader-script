var http     = require("http");
var fs       = require("fs");
var jsdom    = require("jsdom");
var Log      = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));
var config   = require('./config.js');

module.exports = (url) => {
  'use strict';
  let pages = [];
  let it    = 0;

  jsdom.env({
    url: url,
    done: (errors, window) => {
      let links = window.document.querySelectorAll('.topbar_right ul.dropdown li a');

      for (let index in links) {
        let href = links[index].href;

        if(href) {
          pages.push(href);
          if((parseInt(index) + 1) === links.length) {
            download();
          }
        }
      }
    }
  });

  let download = () => {
    jsdom.env({
      url: pages[it],
      done: (errors, window) => {
          let file  = fs.createWriteStream(config.path + "/page"+ it +".jpg");
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
};
