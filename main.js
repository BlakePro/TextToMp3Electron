const {app, Menu, BrowserWindow, ipcMain, remote, shell, dialog} = require('electron')
const fs = require('fs')
const say = require('say')
const fixPath = require('fix-path')
var path = require('path')
const { exec } = require('child_process');
var commandExists = require('command-exists');


/*
electron-packager . --overwrite  --icon=assets/icon.icns

electron-installer-dmg "Text Converter.app" "Text Converter" -overwrite --icon="256.png" --icon-size=256
*/


// Mantén una referencia global del objeto window, si no lo haces, la ventana
// se cerrará automáticamente cuando el objeto JavaScript sea eliminado por el recolector de basura.
let win

function createWindow () {
  // Crea la ventana del navegador.
  win = new BrowserWindow({
    title: 'Text Converter',
    backgroundColor: '#FFF',
    width: 580,
    height: 735,
    resizable: false,
    frame: false,
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, 'assets/512.png')
   })
   fixPath();

   const template = [ {
     role: 'about',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          selector: 'undo:'
        }, {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          selector: 'redo:'
        }, {
          type: 'separator'
        }, {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          selector: 'cut:'
        }, {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          selector: 'copy:'
        }, {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          selector: 'paste:'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:'
        },
        {type: 'separator'},
        {
          label: 'About',
          click () { require('electron').shell.openExternal('https://cristianyosafat.xyz') }
        },
        {
          label: 'Quit',
          accelerator: 'Cmd+Q',
          click () { app.quit() }
        }]
    }];
   const menu = Menu.buildFromTemplate(template)
   Menu.setApplicationMenu(menu)
/*
   const ses = win.webContents.session;
  ses.clearCache(() => {
    console.log("Cache cleared!");
  });
*/
  // y carga el archivo index.html de la aplicación.
  win.loadFile('index.html')

  // Abre las herramientas de desarrollo (DevTools).
  //win.webContents.openDevTools()

  // Emitido cuando la ventana es cerrada.
  win.on('closed', () => {
    // Elimina la referencia al objeto window, normalmente  guardarías las ventanas
    // en un vector si tu aplicación soporta múltiples ventanas, este es el momento
    // en el que deberías borrar el elemento correspondiente.
    win = null
  })
}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
// Algunas APIs pueden usarse sólo después de que este evento ocurra.
app.on('ready', createWindow)


// Sal cuando todas las ventanas hayan sido cerradas.
app.on('window-all-closed', () => {
  // En macOS es común para las aplicaciones y sus barras de menú
  // que estén activas hasta que el usuario salga explicitamente con Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // En macOS es común volver a crear una ventana en la aplicación cuando el
  // icono del dock es clicado y no hay otras ventanas abiertas.
  if (win === null) {
      createWindow()

  }
})

// En este archivo puedes incluir el resto del código del proceso principal de
// tu aplicación. También puedes ponerlos en archivos separados y requerirlos aquí.
ipcMain.on('play', (event, arg) => {
  let post = arg
  console.log(post)
  if(post.voice != '' && post.texto != ''){
    const dir = app.getAppPath('userData')//'/Users/blake/Downloads/'
    const wave_file =  dir + 'temp.wav';
    const voice = post.voice
    const text = post.texto
    const speed = 1;//parseFloat(post.speed)

    fs.unlink(wave_file,function(err){});

     say.export(text, voice, speed, wave_file, (err) => {
       if (err) {
         dialog.showErrorBox('Audio', 'Not found' + err)
         return false
       }else{
        event.sender.send('sound', wave_file);
       }
     })
  }
});

ipcMain.on('convert', (event, arg) => {

  let post = arg
  try{
    const defaultDataPathDia = dialog.showOpenDialog({properties: ['openDirectory']})
    const defaultDataPath = defaultDataPathDia[0]
    const voice = post.voice
    const text = post.texto
    const speed = 1//parseFloat(post.speed)

    if(voice != '' && text != '' && defaultDataPath != ''){
      const pname = post.name;
      const filen = defaultDataPath+ '/' + pname;
      const wave_file = filen + '.wav';
      const mp3_file = filen + '.mp3';

      fs.unlink(wave_file,function(err){});

      say.export(text, voice, speed, wave_file, (err) => {
        if (err) {
          dialog.showErrorBox('Audio error', 'Please select another directory')
          return false
        }

        commandExists('lame', function(err, commandExists) {
          if(commandExists) {
            fs.unlink(mp3_file,function(err){});

            const Lame = require("node-lame").Lame;
            const encoder = new Lame({
                "output": mp3_file,
                "bitrate": 192
            }).setFile(wave_file);

            encoder.encode().then(() => {
              fs.unlink(wave_file,function(err){});
            }).catch((error) => {});

            shell.openItem(defaultDataPath)

          }else{
            shell.openItem(defaultDataPath)

            exec('brew install lame', (err, stdout, stderr) => {
              if (err) {
                dialog.showErrorBox('Text converter ' + error, '  cannot convert to mp3 (run in terminal brew install lame)')
                return false
              }
            })
          }
        });
      })
    }
  }catch(err) {

  }
})
