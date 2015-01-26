function run() {
  var fs = require('fs');
  var path = require('path');
  
  var excludes = ['compass'];
  
  function mkdir(path) {
    function create(path) {
      if (path) {
        if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
          try {
            fs.mkdirSync(path);
          }
          catch (error) {
            return false;
          }
        }
      }
      return true;
    }
    path.replace(/^\/+/, '').split(/\/+/).reduce(function (previousValue, currentValue) {
      create('/' + previousValue);
    return previousValue + '/' + currentValue;
    });
    return create(path);
  }
      
  if (Document.current()) {
    var doc = Document.current();
    
    if ((doc.rootScope()) === 'css.source') {
      
      var manifestText = doc.text;      
      var basePath = doc.path();
      var baseDirectory = path.dirname(basePath);
      var importStatements = manifestText.match(/^[ \t]*@import[ \t]+(['"])(.+?)\1/mg);
      var importDirectories = [];
      var importBasenames = [];
            
      if (importStatements) {
        importStatements.forEach(function(importStatement) {
          var importPath = importStatement.match(/^[ \t]*@import[ \t]+(['"])(.+?)\1/)[2];
          
          if (excludes.indexOf(importPath) === -1) {
            
            
            importPath = importPath.match(/\.scss$/) ? importPath : importPath + '.scss';
                    
            var importDirectory = baseDirectory + '/' + path.dirname(importPath);
            var importBasename = importDirectory + '/_' + path.basename(importPath);
            
            
            if (!fs.existsSync(importDirectory) && importDirectories.indexOf(importDirectory) === -1) {
              importDirectories.push(importDirectory);
            }
            
            if (!fs.existsSync(importBasename) && importDirectories.indexOf(importBasename) === -1) {
              importBasenames.push(importBasename);
            }
            
            
          }
          
        });
      }
      
      importDirectories.forEach(function(importDirectory) {
        if (!mkdir(importDirectory)) {
          Alert.show('Sass Director Error', 'Could not create "' + importDirectory + '" directory.');
        }
      
      });
      
      importBasenames.forEach(function(importBasename) {
        try {
          fs.closeSync(fs.openSync(importBasename, 'w'));
        } catch (error) {
          Alert.show('Sass Director Error', 'Could not create "' + importBasename + '" file.');
        }
      });
      
      
    }
    else {
      Alert.show('Sass Director Error', 'Document does not appear to be a valid scss file.');
    }
  }
}



Hooks.addMenuItem('Actions/Sass Director/Create', '', function() {
  run();
});



