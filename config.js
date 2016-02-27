var sqlite3  = require('sqlite3').verbose();

module.exports = {
  db: new sqlite3.Database('comics.sqlite'),
  path: 'download',
  site: 'http://fr.comics-reader.com/directory/'
};
