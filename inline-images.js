// (c) 2011-2015 Alexander Solovyov
// under terms of ISC License

var UNIQUE_CLASS_NAME = 'adium-inline-' + Math.random();
var IMAGE_SERVICES = [
    {
        test: new RegExp('^https?://en.wikipedia.org/wiki/File:(.*)', 'i'),
        link: function(href, m) {
            return 'File:' + m[1];
        },
        createNode: function(href, cb) {
            XHR({
                url: 'http://en.wikipedia.org/w/api.php',
                method: 'GET',
                responseType: 'json',
                data: {
                    action: 'query',
                    prop: 'imageinfo',
                    iiprop: 'url',
                    format: 'json',
                    titles: href
                },
                callback: function(err, data) {
                    if (err) return alert(err);

                    var pages = data.query.pages;
                    var page = pages[Object.keys(pages)[0]];

                    var img = document.createElement('img');
                    img.src = page.imageinfo[0].url;
                    img.setAttribute('style', 'max-width: 100%; max-height: 100%;');

                    cb(img);
                }
            });
        }
    },
    {test: /\.(png|jpg|jpeg|gif)$/i},
    {test: new RegExp('^https://i.chzbgr.com/')},
    {test: new RegExp('^http://img-fotki.yandex.ru/get/')},
    {test: new RegExp('^http://img.leprosorium.com/')},
    {test: new RegExp('^https?://pbs.twimg.com/media/')},
    {
        test: new RegExp('^https?://(?:www\\.)?monosnap.com/image/(\\w+)', 'i'),
        link: function(href, m) {
            return 'http://api.monosnap.com/image/download?id=' + m[1];
        }
    },
    {
        test: new RegExp('^https?://(?:i.)?imgur.com/([^/]*)\.gifv', 'i'),
        link: function(href, m) {
            return 'http://i.imgur.com/' + m[1] + '.mp4';
        },
        createNode: function(href, cb) {
            var video = document.createElement('video');
            video.setAttribute('style', 'max-width: 100%; max-height: 100%;');
            video.setAttribute('preload', 'auto');
            video.setAttribute('autoplay', 'autoplay');
            video.setAttribute('loop', 'loop');
            video.setAttribute('webkit-playsinline', '');

            var source = document.createElement('source');
            source.src = href;
            source.type = 'video/mp4';

            video.appendChild(source);
            cb(video);
        },
    },
    {
        // all links which do not have slash as a second character in path,
        // because imgur.com/a/stuff is an album and not an image
        test: new RegExp('^https?://imgur.com/.[^/]', 'i'),
        link: function(href, m) {
            return href.replace('imgur.com', 'i.imgur.com') + '.jpg';
        }
    },
    {
        test: new RegExp('^https?://twitter.com/[^/]+/status/\\d+'),
        link: function(href, m) {
            return m[0];
        },
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

function inlineNode(node, href, m, rule) {
    var imageUrl = rule.link ? rule.link(href, m) : href;
    var shouldScroll = coalescedHTML.shouldScroll || nearBottom();
    var createNode = rule.createNode || defaultCreateNode;

    createNode(imageUrl, function(mediaEl) {
        mediaEl.className = UNIQUE_CLASS_NAME;
        node.parentNode.replaceChild(mediaEl, node);
        mediaEl.addEventListener('click', revertInline(node));

        if (shouldScroll) {
            mediaEl.addEventListener('load', scrollToBottom);
            mediaEl.addEventListener('canplay', scrollToBottom);
        }
    });
}


function revertInline(orig) {
    return function(e) {
        // just in case inner node has links
        if (e.target.hasAttribute('href')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        var node = e.target;
        while (node) {
            if (node.className === UNIQUE_CLASS_NAME) {
                node.parentNode.replaceChild(orig, node);
                break;
            }
            node = node.parentNode;
        }
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
            return inlineNode(e.target, href, matches, rule);
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

var dictToQs = function(dict) {
    dict = dict || {};
    var q = [], key;
    for (key in dict) {
        if (dict.hasOwnProperty(key)) {
            q.push(encodeURIComponent(key) + "=" +
                   encodeURIComponent(dict[key]));
        }
    }
    return q.join('&');
};

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
        var query = (url||'').indexOf('?') === -1 ? '?' : '&';
        query += dictToQs(params);

        callbackName = (callbackName || config.callbackName || 'callback');
        var uniqueName = callbackName + "_json" + (++counter);

        window[uniqueName] = function(data){
            callback(data);
            window[uniqueName] = null;
            try {
                delete window[uniqueName];
            } catch (e) {}
        };

        load(url + query + '&' + callbackName + '=' + uniqueName);
        return uniqueName;
    }

    function setDefaults(obj){
        config = obj;
    }

    return {get: jsonp, init: setDefaults};
}());

/*
 * Simplest XHR helper
 * (c) 2014 Alexander Solovyov
 * ISC Licensed
 */

var XHR = function(opts) {
    var url = opts.url, data = opts.data;
    if (opts.method === 'GET') {
        url += '?' + dictToQs(data);
    }

    var xhr = new XMLHttpRequest();
    xhr.open(opts.method, url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4)
            return;

        if (!((xhr.status >= 200) && (xhr.status < 300))) {
            return opts.callback(xhr.status);
        }

        var resp = xhr.responseText;
        if (opts.responseType === 'json') {
            resp = resp && JSON.parse(resp) || {};
        }
        return opts.callback(null, resp);
    };

    if (opts.method === 'GET') {
        xhr.send();
    } else {
        if (data && typeof data !== 'string') {
            data = dictToQs(data);
        }
        xhr.send(data);
    }
};
