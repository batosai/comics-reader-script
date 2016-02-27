var fs  = require("fs");
var Log = require('log'), log = new Log('debug', fs.createWriteStream('debug.log'));

module.exports = function(path){
  if(!fs.existsSync(path)){
     fs.mkdirSync(path, 0766, (err) => {
       if(err){
         log.error('Can\'t make the directory %s!', path);
       }
     });
  }
};
