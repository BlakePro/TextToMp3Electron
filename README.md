# TextToFileSound
This is an electron app (Mac) for convert text to audio file mp3


To make .app (before run npm install electron-packager)
electron-packager . --overwrite  --icon=assets/icon.icns


To make .dmg (before run npm install electron-installer-dmg)
electron-installer-dmg "Text Converter.app" "Text Converter" -overwrite --icon="256.png" --icon-size=256
