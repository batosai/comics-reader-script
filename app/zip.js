var fs       = require("fs");
var archiver = require('archiver'); // https: //www.npmjs.com/package/archiver
var Log      = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));

module.exports = function(source, dest) {
  'use strict';
  class Zip {
      constructor(path, name) {
          this.path    = path;
          this.name    = name;
          this.output  = fs.createWriteStream(this.name);
          this.archive = archiver('zip');
      }

      create(callback) {
        let self = this;
        this.output.on('close', () => {
          console.log(self.archive.pointer() + ' total bytes');
          // console.log('archiver has been finalized and the output file descriptor has closed.');
          log.info(self.archive.pointer() + ' total bytes');
          log.info('Archiver has been finalized and the output file descriptor has closed.');

          callback();
        });

        this.archive.on('error', (err) => {
          throw err;
        });

        this.archive.pipe(this.output);

        let files = fs.readdirSync(this.path);
        for (let file of files){
            let name = this.path + file;
            this.archive.append(fs.createReadStream(name), { name: file });
        }

        this.archive.finalize();
      }
  }

  return new Zip(source, dest);
};
