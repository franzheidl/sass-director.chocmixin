var win;


function run() {
  var fs = require('fs');
  var path = require('path');
  
  var settings = getSettings();
  var excludes = settings.excludes;
  
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


function getSettings() {
  var s = Storage.persistent().get('SASS_DIRECTOR_SETTINGS');
  if (s === null) {
    return {};
  }
  else {
    return s;
  }
}


function getUserSettings() {
  win.applyFunction(function() {
    var excludesEl = document.getElementById('excludes');
    var excludes = excludesEl.value.split('\n');
    // remove whitespace-only and empty items
    for(i = excludes.length - 1; i >= 0; i--) {
      excludes[i] = excludes[i].replace(/\s/g,"");
      if (excludes[i] === "") {
        excludes.splice(i,1);
      }
    }
    var settings = {excludes: excludes}
    chocolat.sendMessage('save', settings);
  }, []);
}


function updateWin() {
  var settings = getSettings();
  win.applyFunction(function(settings) {
    var excludesEl = document.getElementById('excludes');
    settingsStr = settings.excludes.join('\n');
    excludesEl.value = settingsStr;
  }, [settings]);
}

function saveSettings(s) {
  Storage.persistent().set('SASS_DIRECTOR_SETTINGS', s);
}



function settings() {
  if (!win || win === undefined) {
    win = new Window();
    win.htmlPath = './settings.html';
    win.title = 'Sass Director Settings';
    win.buttons = ['Save', 'Cancel'];
    
    win.onLoad = function() {
      updateWin();
    }
    
    win.onUnload = function() {
      win = undefined;
    };
    
    win.onMessage = function(message) {
      var arg;
      if (arguments) {
        arg = arguments['1'];
      }
      if (message === 'save') {
        saveSettings(arg);
        win.close();
      }
    }
    
    win.onButtonClick = function(button) {
      if (button === 'Save') {
        getUserSettings();
      }
      else if (button === 'Cancel') {
        win.close();
      }
    }
    
    win.run();
  }
  else {
    win.show();
  }
}



Hooks.addMenuItem('Actions/Sass Director/Create', '', function() {
  run();
});

Hooks.addMenuItem('Actions/Sass Director/Settings…', '', function() {
  settings();
});

// Hooks.addMenuItem('Actions/Sass Director/Debug Settings', '', function() {
//   Alert.show(JSON.stringify(getSettings()));
// });
