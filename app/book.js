var fs       = require("fs");
var jsdom    = require("jsdom");
var Log      = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));
var config   = require('./config.js');

module.exports = (book, callback) => {
  'use strict';
  let pages = [];
  let it    = 0;

  jsdom.env({
    url: book.link,
    done: (errors, window) => {
      (function(){
        try {
          let links  = window.document.querySelectorAll('.topbar_right ul.dropdown li a');
          let length = links.length;
          let id     = book.id;

          config.db.serialize(() => {
            config.db.run("UPDATE volumes SET pages=" + length + " WHERE id=" + id);

            for (let index in links) {
              let href = links[index].href;
              let stmt = config.db.prepare("INSERT INTO pages (volumes_id, name, path, link) VALUES (?, ?, ?, ?)");
              stmt.run(id, 'page' + index + '.jpg', book.path, href);
              stmt.finalize();

              if(parseInt(index)+1 == length) {
                callback();
              }
            }
          });
        } catch (e) {
          log.error('Get book error: %s', e.message);
          callback();
        }
      })();
    }
  });
};
