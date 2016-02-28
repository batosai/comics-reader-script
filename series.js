var jsdom    = require("jsdom");
var slug     = require('slug');
var creatDir = require('./creatDir.js');
var volumes  = require('./volumes.js');
var config   = require('./config.js');

var series = (url) => {
  'use strict';
  jsdom.env({
    url: url,
    done: (errors, window) => {
      let groups = window.document.querySelectorAll('.group');

      config.db.serialize(function() {
        let save = (title, link) => {
          let slugTitle = slug(title);
          config.db.each("SELECT count(*) as count FROM series WHERE slug='" + slugTitle + "'", (err, row) => {
            if(!row.count) {
              creatDir(config.path + '/' + slugTitle);

              let stmt = config.db.prepare("INSERT INTO series VALUES (?, ?, ?, ?)");
              stmt.run(title, slugTitle, slugTitle, link);
              stmt.finalize();
              // console.log(title, link);
            }

            config.db.each("SELECT rowid AS id, * FROM series WHERE slug='" + slugTitle + "'", (err, row) => {
              volumes(row);
              console.log(row.id, title, link);
            });

          });
        };

        for (let i in groups)
        {
          let group = groups[i];
          let a = group.querySelectorAll('.title a');
          let title = a[0].innerHTML;
          title = title.replace(' [FR]', '');
          let link  = a[0].href;

          save(title, link);

          if((parseInt(i) + 1) === groups.length) {
            let next = window.document.querySelectorAll('.prevnext .next a');
            if(next.length) {
              series(next[1].href);
            }
          }
        }


      });
    }
  });
};

module.exports = series;
