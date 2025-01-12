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
echo " - get the Postscript name of a font in Linux, use fc-scan [TTF-font] - https://stackoverflow.com/a/68036706/723506"
echo " - to handle variable fonts, see https://medium.com/timeless/adding-custom-variable-fonts-in-react-native-47e0d062bcfc and https://slice-gui.netlify.app/"
