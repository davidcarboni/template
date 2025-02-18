#!/usr/bin/env bash
set -e

echo "Installing expo font support..."

cd ..
npx expo install expo-font expo-splash-screen

echo "For documentation see:"
echo " - use a font in Expo Go (useFonts hook): https://docs.expo.dev/develop/user-interface/fonts/#with-usefonts-hook"
echo " - use Google fonts: https://docs.expo.dev/develop/user-interface/fonts/#use-google-fonts"
echo " - bundle a font in a development build: https://docs.expo.dev/develop/user-interface/fonts/#use-a-local-font-file"
echo "To check if a font is loaded, e.g. after bundling, use isLoaded('<Postscript name>');"
echo " - get the Postscript name of a font in Linux, use 'fc-scan [TTF-font] | grep postscriptname' - see: https://stackoverflow.com/a/68036706/723506"
echo " - to handle variable fonts, see https://medium.com/timeless/adding-custom-variable-fonts-in-react-native-47e0d062bcfc and https://slice-gui.netlify.app/"
echo " - If using slice, set font weight in the top section and the postscript name in the bottom section, plus update a couple of other values where it may still say 'regular' when you're creating a bold slice. Not sure what the bold bit flags do."

# Optionally set up Slice for variable-width fonts

read -p "Do you want to use Slice to handle a variable-width font? (Y/n) " yn
case $yn in
	n ) echo Finished;
		exit 0;;
	* ) echo Opening slice...;;
esac

# Basded on: https://slice-gui.netlify.app/docs/install/
cd setup
git clone https://github.com/source-foundry/Slice.git
cd Slice

python3 -m venv .venv
source .venv/bin/activate

#Seems to fail with an error on PyQt5:
# pip install -r requirements.txt
# make run

# use PyPi package as a workaround
pip install PyQt5
pip install slicegui

slicegui &

echo Finished
