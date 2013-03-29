// (c) 2011-2013 Alexander Solovyov
// under terms of ISC License

function direct(href, cb) {
    cb(href);
}

var IMAGE_SERVICES = [
    {
        test: /\.(png|jpg|jpeg|gif)$/i,
        link: direct
    },
    {
        test: /^http:\/\/monosnap.com\//i,
        link: function(href, cb) {
            cb('http://api.monosnap.com/image/download?id=' +
               href.match(/(\w+)\/?$/)[1]);
        }
    },
    {
        test: /^http:\/\/imgur.com\/[\w\d]+$/i,
        link: function(href, cb) {
            cb(href.replace('imgur.com', 'i.imgur.com') + '.jpg');
        }
    },
    {
        test: /^https:\/\/i.chzbgr.com\//,
        link: direct
    },
    {
        test: /^http:\/\/img-fotki.yandex.ru\/get\//,
        link: direct
    },
    {
        // this is not working :(
        test: /^xxxhttp:\/\/\w+.wikipedia.org\/wiki\/File:/,
        link: function(href, cb) {
            var xhr = new XMLHttpRequest();
            xhr.open('get', href, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState != 4) return;
                if (!(xhr.status < 300 && xhr.status >= 200)) return;
                var data = xhr.responseText;
            }
        }
    }
];

function inlineImage(node, imageUrl) {
    var shouldScroll = coalescedHTML.shouldScroll || nearBottom();

    var img = document.createElement("img");
    img.src = imageUrl;
    img.className = 'inlineImage';
    img.setAttribute('data-txt', node.innerHTML);
    img.setAttribute('data-href', node.href);
    img.setAttribute('style', 'max-width: 100%; max-height: 100%;');

    node.parentNode.replaceChild(img, node);
    img.addEventListener('click', revertImage);

    if (shouldScroll) {
        img.addEventListener('load', scrollToBottom);
    }
}


function revertImage(e) {
    e.preventDefault();
    e.stopPropagation();

    var node = e.target;
    var a = document.createElement('a');
    a.href = node.getAttribute('data-href');
    a.innerHTML = node.getAttribute('data-txt');

    node.parentNode.replaceChild(a, node);
}


function handleLink(e) {
    var srv,
        matches,
        href = e.target.href,
        handler = function(link) {
            inlineImage(e.target, link);
        };

    for (var i = 0; i < IMAGE_SERVICES.length; i++) {
        srv = IMAGE_SERVICES[i];
        matches = typeof srv.test === 'function' ?
            srv.test(href) :
            href.match(srv.test);

        if (matches) {
            e.preventDefault();
            e.stopPropagation();
            srv.link(href, handler);
            return;
        }
    }
}

document.getElementById('Chat').addEventListener('click', function(e) {
    if (e.target.tagName !== 'A' ||
        e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
        return;
    handleLink(e);
});
