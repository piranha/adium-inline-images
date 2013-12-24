Adium Image Inliner
===================

This is a small script, which allows you to view images right in Adium, without
involving the browser. It just checks link you're clicking on and if it looks
like an image to a script, it will display it inline. Click on it and you'll see
original link.

You can always override that and open link in browser by holding any modifier
key (Control, Command, Alt, Shift).

Supported services
------------------

- Direct links to images
- imgur.com
- monosnap.com
- chzbgr.com
- img-fotki.yandex.ru
- img.leprosorium.com

[This list][1] can be improved, read more to learn how.

[1]: https://github.com/piranha/adium-inline-images/blob/master/inline-images.js#L4

How to use
----------

Clone a repo and run `install.sh` with your style name as parameter, i.e.:

    ./install.sh minimal_mod

If you want to go manual road, it's not very hard (check contents of
`install.sh` if you want):

1. Find your style directory: it's either located in
   `"/Applications/Adium.app/Contents/Resources/Message Styles/YourStyle"` or
   `"~/Library/Application Support/Adium 2.0/Message Styles/YourStyle"`. You can
   check name of your style in Adium's Preferences -> Messages.

2. Put a file `inline-images.js` in `Contents/Resources` subdir of your style.

3. Edit a file `Footer.html` (create it if it doesn't exist) in
   `Contents/Resources` subdir to add this line:

```
<script type="text/javascript" src="inline-images.js"></script>
```

This is it! Restart Adium and it should work.

I might write a script automating that in future.

Adding a new service
--------------------

File `inline-images.js` contains a variable named `IMAGE_SERVICES`. This is a
list of objects, each defining a service. Those objects have two properties:

1. `test` - either a regular expression, matching given link, or a function,
   which can perform custom matching (should return boolean if this service
   supports this link).

2. `link` - is a function, which should return a source url of an image by given
   link.

Add new service, send a pull request, and let the glory of inline images spread
all over the world!
