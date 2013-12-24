// (c) 2011-2013 Alexander Solovyov
// under terms of ISC License

var UNIQUE_CLASS_NAME = 'very-inline-node';
var IMAGE_SERVICES = [
    {test: /\.(png|jpg|jpeg|gif)$/i},
    {test: new RegExp('^https://i.chzbgr.com/')},
    {test: new RegExp('^http://img-fotki.yandex.ru/get/')},
    {test: new RegExp('^http://img.leprosorium.com/')},
    {test: new RegExp('^https?://pbs.twimg.com/media/')},
    {
        test: new RegExp('^https?://(www\\.)?monosnap.com/image/', 'i'),
        link: function(href) {
            return 'http://api.monosnap.com/image/download?id=' +
                href.match(/(\w+)\/?$/)[1];
        }
    },
    {
        // all links which do not have slash as a second character in path,
        // because imgur.com/a/stuff is an album and not an image
        test: new RegExp('^http://imgur.com/.[^/]', 'i'),
        link: function(href) {
            return href.replace('imgur.com', 'i.imgur.com') + '.jpg';
        }
    },
    {
        test: new RegExp('^https?://twitter.com/[^/]+/status/\\d+'),
        createNode: function(href, cb) {
            JSONP.get('https://api.twitter.com/1/statuses/oembed.json',
                     {url: href},
                     function(data) {
                         var div = document.createElement('div');
                         div.innerHTML = data.html;

                         cb(div);
                     });
        }
    }
];

function defaultCreateNode(href, cb) {
    var img = document.createElement("img");
    img.src = href;
    img.setAttribute('style', 'max-width: 100%; max-height: 100%;');

    cb(img);
}

function inlineNode(node, href, rule) {
    var imageUrl = rule.link ? rule.link(href) : href;
    var shouldScroll = coalescedHTML.shouldScroll || nearBottom();
    var createNode = rule.createNode || defaultCreateNode;

    createNode(imageUrl, function(inline) {
        inline.className = UNIQUE_CLASS_NAME;
        node.parentNode.replaceChild(inline, node);
        inline.addEventListener('click', revertInline(node));

        if (shouldScroll) {
            inline.addEventListener('load', scrollToBottom);
        }
    });
}


function revertInline(orig) {
    return function(e) {
        if (e.target.tagName === 'A') {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        var node = e.target;
        do {
            if (node.className === UNIQUE_CLASS_NAME) {
                node.parentNode.replaceChild(orig, node);
                break;
            }
        } while (node = node.parentNode);
    };
}


function handleLink(e) {
    var rule,
        matches,
        href = e.target.href;

    for (var i = 0; i < IMAGE_SERVICES.length; i++) {
        rule = IMAGE_SERVICES[i];
        matches = typeof rule.test === 'function' ?
            rule.test(href) :
            href.match(rule.test);

        if (matches) {
            e.preventDefault();
            e.stopPropagation();
            return inlineNode(e.target, href, rule);
        }
    }
}

document.getElementById('Chat').addEventListener('click', function(e) {
    if (e.target.tagName !== 'A' ||
        e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
        return;
    }
    handleLink(e);
});

/*
* Lightweight JSONP fetcher
* Copyright 2010-2012 Erik Karlsson. All rights reserved.
* BSD licensed
*/

var JSONP = (function(){
    var counter = 0, head, window = this, config = {};

    function load(url, pfnError) {
        var script = document.createElement('script'),
        done = false;
        script.src = url;
        script.async = true;

        var errorHandler = pfnError || config.error;
        if (typeof errorHandler === 'function') {
            script.onerror = function(ex){
                errorHandler({url: url, event: ex});
            };
        }

        script.onload = script.onreadystatechange = function() {
            if (!done && (!this.readyState ||
                          this.readyState === "loaded" ||
                          this.readyState === "complete") ) {
                done = true;
                script.onload = script.onreadystatechange = null;
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }
        };

        if ( !head ) {
            head = document.getElementsByTagName('head')[0];
        }
        head.appendChild( script );
    }

    function jsonp(url, params, callback, callbackName) {
        var query = (url||'').indexOf('?') === -1 ? '?' : '&', key;

        callbackName = (callbackName || config.callbackName || 'callback');
        var uniqueName = callbackName + "_json" + (++counter);

        params = params || {};
        for (key in params) {
            if ( params.hasOwnProperty(key) ) {
                query += encodeURIComponent(key) + "=" +
                    encodeURIComponent(params[key]) + "&";
            }
        }

        window[uniqueName] = function(data){
            callback(data);
            window[uniqueName] = null;
            try {
                delete window[uniqueName];
            } catch (e) {}
        };

        load(url + query + callbackName + '=' + uniqueName);
        return uniqueName;
    }

    function setDefaults(obj){
        config = obj;
    }

    return {get: jsonp, init: setDefaults};
}());
