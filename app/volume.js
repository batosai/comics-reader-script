var jsdom    = require("jsdom");
var slug     = require('slug');
var creatDir = require('./creatDir.js');
var config   = require('./config.js');

module.exports = (serie, callback) => {
  'use strict';
  jsdom.env({
    url: serie.link,
    done: (errors, window) => {
      (function(){
        try {
          let groups = window.document.querySelectorAll('.group');

          config.db.serialize(function() {
            let save = (title, link) => {
              config.db.each("SELECT count(*) as count FROM volumes WHERE serie_id='" + serie.id + "'", (err, row) => {
                if(!row.count) {
                  creatDir(config.path + '/' + serie.path + '/' + slug(title));

                  let stmt = config.db.prepare("INSERT INTO volumes (serie_id, title, slug, path, link) VALUES (?, ?, ?, ?, ?)");
                  stmt.run(serie.id, title, slug(title), serie.path + '/' + slug(title), link);
                  stmt.finalize();
                  // console.log(title, link);
                }
              });
            };

            for (let group of groups)
            {
              let a = group.querySelectorAll('.title a');
              for (let g of a) {
                save(g.title, g.href);
              }
            }

            callback();
          });
        } catch (e) {
          callback();
        }
      })();
    }
  });
};
