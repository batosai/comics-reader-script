var mongoose = require('mongoose');
var sqlite3  = require('sqlite3').verbose();

mongoose.connect('mongodb://localhost/comics', function(err) {
  if (err) { throw err; }
});

var pageSchema = new mongoose.Schema({
  name : String,
  path : String,
  link : String,
  finish : {type : Number, default : 0},
  created_at : { type : Date, default : Date.now }
});

var volumeSchema = new mongoose.Schema({
  title : String,
  path : String,
  link : String,
  pages : [pageSchema],
  created_at : { type : Date, default : Date.now }
});

var serieSchema = new mongoose.Schema({
  title : String,
  path : String,
  link : String,
  volumes : [volumeSchema],
  created_at : { type : Date, default : Date.now }
});

var Serie  = mongoose.model('series', serieSchema);
var Volume = mongoose.model('volumes', volumeSchema);
var Page   = mongoose.model('pages', pageSchema);

var db = new sqlite3.Database('comics.sqlite');

db.serialize(function() {
  db.each("SELECT * FROM series", (err, row) => {
    var serie = new Serie({
      'title': row.title,
      'path': row.path,
      'link': row.link,
      'volumes': []
    });


    db.each("SELECT count(*) AS count FROM volumes WHERE serie_id = " + row.id, (err, r0) => {

      db.each("SELECT * FROM volumes WHERE serie_id = " + row.id, (err, row2) => {
        var volume = new Volume({
          'title': row2.title,
          'path': row2.path,
          'link': row2.link,
          'pages': []
        });



          db.each("SELECT * FROM pages WHERE volume_id = " + row2.id, (err, row3) => {
            var page = new Page({
              'name': row3.name,
              'path': row3.path,
              'link': row3.link,
              'finish': row3.finish,
            });

            volume.pages.push(page);
            console.log('add page');

          }, () => {
            serie.volumes.push(volume);
            console.log('add volume');

            if(r0.count == serie.volumes.length) {
              serie.save();
              console.log('serie save');
            }
          });


      });
    });

  });
});
