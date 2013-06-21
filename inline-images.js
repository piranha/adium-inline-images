// (c) 2011-2013 Alexander Solovyov
// under terms of ISC License

var IMAGE_SERVICES = [
    {test: /\.(png|jpg|jpeg|gif)$/i},
    {test: /^https:\/\/i.chzbgr.com\//},
    {test: /^http:\/\/img-fotki.yandex.ru\/get\//},
    {test: /^http:\/\/img.leprosorium.com\//},
    {
        test: /^http:\/\/monosnap.com\/image\//i,
        link: function(href) {
            return 'http://api.monosnap.com/image/download?id=' +
                href.match(/(\w+)\/?$/)[1];
        }
    },
    {
        test: /^http:\/\/imgur.com\//i,
        link: function(href) {
            return href.replace('imgur.com', 'i.imgur.com') + '.jpg';
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
        href = e.target.href;

    for (var i = 0; i < IMAGE_SERVICES.length; i++) {
        srv = IMAGE_SERVICES[i];
        matches = typeof srv.test === 'function' ?
            srv.test(href) :
            href.match(srv.test);

        if (matches) {
            e.preventDefault();
            e.stopPropagation();
            inlineImage(e.target, srv.link ? srv.link(href) : href);
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
