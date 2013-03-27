#!/bin/sh

if [ -z "$1" ]; then
    echo "Usage: $0 your-style-name"
    exit
fi


NAME="$1.AdiumMessageStyle"
SYSTEM=/Applications/Adium.app/Contents/Resources/Message\ Styles
USER=~/Library/Application\ Support/Adium\ 2.0/Message\ Styles


# find directory with message style
if [ -d "$SYSTEM/$NAME" ]; then
    PATH="$SYSTEM/$NAME"
elif [ -d "$USER/$NAME" ]; then
    PATH="$USER/$NAME"
else
    echo "Cannot find directory with $NAME!"
    exit 1
fi

PATH="$PATH/Contents/Resources"


# put inline-images.js in place
cp "$(dirname $0)/inline-images.js" "$PATH/"


# write source to footer
FOOTER="$PATH/Footer.html"

if [ ! -f "$FOOTER" ]; then
    touch $FOOTER
fi

# how do I do NOT here?
if /usr/bin/grep inline-images.js "$FOOTER" > /dev/null; then
    true
else
    echo '<script type="text/javascript" src="inline-images.js"></script>' >> "$FOOTER"
fi
