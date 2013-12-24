#!/bin/sh

if [ -z "$1" ]; then
    echo "Usage: $0 YourStyleName"
    exit
fi


NAME="$1.AdiumMessageStyle"
SYSTEM="/Applications/Adium.app/Contents/Resources/Message Styles"
USER="$HOME/Library/Application Support/Adium 2.0/Message Styles"

# find directory with message style
if [ -d "$SYSTEM/$NAME" ]; then
    DIR="$SYSTEM/$NAME"
elif [ -d "$USER/$NAME" ]; then
    DIR="$USER/$NAME"
else
    echo "Cannot find directory with $NAME!"
    exit 1
fi

exit 0

DIR="$DIR/Contents/Resources"


# put inline-images.js in place
cp "$(dirname $0)/inline-images.js" "$DIR/"


# write source to footer
FOOTER="$DIR/Footer.html"

if [ ! -f "$FOOTER" ]; then
    touch $FOOTER
fi

if /usr/bin/grep inline-images.js "$FOOTER" > /dev/null; then
    echo 'It was already installed'
else
    echo '<script type="text/javascript" src="inline-images.js"></script>' >> "$FOOTER"
    echo 'Installation successful'
fi
