var jsdom    = require("jsdom");
var slug     = require('slug');
var creatDir = require('./creatDir.js');
var config   = require('./config.js');

module.exports = (slugTitle, url, id) => {
  'use strict';
  jsdom.env({
    url: url,
    done: (errors, window) => {
      let groups = window.document.querySelectorAll('.group');

      config.db.serialize(function() {
        let save = (title, link) => {
          config.db.each("SELECT count(*) as count FROM volumes WHERE serie_id='" + id + "'", (err, row) => {
            if(!row.count) {
              creatDir(config.path + '/' + slugTitle + '/' + slug(title));

              let stmt = config.db.prepare("INSERT INTO volumes VALUES (?, ?, ?, ?, ?, ?)");
              stmt.run(id, title, slug(title), slugTitle + '/' + slug(title), link, 0);
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
      });
    }
  });
};
