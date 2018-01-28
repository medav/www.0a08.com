var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var path = require('path');

app.get('/:id?', function(req, res) {
    directory = JSON.parse(fs.readFileSync('directory.json'));
    var id = directory.length - 1

    if (req.params['id'] != null) {
        id = parseInt(req.params['id'])
    }

    if (id < 0 || id >= directory.length) {
        id = directory.length - 1
    }

    var meta = directory[id]
    var image_title = meta['title']
    var image_name = meta['image_name']
    var image_text = meta['alttext']
    var prev_link = id - 1
    var next_link = id + 1

    if (id == 0) {
        prev_link = ""
    }

    if (id == directory.length - 1) {
        next_link = ""
    }
    
    var html = fs.readFileSync('html/index.html', {encoding: 'utf-8'});
    html = html
        .replace("{{image-title}}", image_title)
        .replace("{{image-name}}", image_name)
        .replace("{{image-text}}", image_text)
        .replace("{{prev-link}}", prev_link)
        .replace("{{next-link}}", next_link)

    res.send(html)
});

app.get('/images/*.*', function(req, res) {
    var filename = req.params[0];
    var ext = req.params[1]
    var fullname = __dirname + '/images/' + filename + '.' + ext;
    res.sendFile(fullname);
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});