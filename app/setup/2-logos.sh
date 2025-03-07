#!/usr/bin/env bash
set -e

echo "Opening logo templates in browser..."

echo "App icon & splash:"
xdg-open "https://www.figma.com/@expo"

# echo "Play store icon:"
# xdg-open https://www.figma.com/file/kHZexuf2L9nVxDRO6EOv5i/playstore_icon_template

echo "Export the icon and adaptive-icon as PNGs (splash is no longer needed - it can be generated from the icon) and save them to the assets folder:"
echo " - assets/images/icon.png"
echo " - assets/images/adaptive-icon.png"
echo " - cp assets/images/icon.png assets/images/splash-ison.png"
