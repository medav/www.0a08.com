var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var path = require('path');

app.enable('trust proxy')

function RandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

app.get('/:id(\\d+)?', function(req, res) {
    var directory = JSON.parse(fs.readFileSync('directory.json'));
    var id = directory.length - 1

    if (req.params['id'] != null) {
        id = parseInt(req.params['id'])
    }

    if (id < 0 || id >= directory.length) {
        id = directory.length - 1
    }

    var log_msg = Date.now() + ',' + req.ip + ',' + id +  '\n'
    fs.appendFile('log.csv', log_msg, function(err) {

    })

    var meta = directory[id]
    var image_title = meta['title']
    var image_name = meta['image_name']
    var image_text = meta['alttext']
    var image_style = "width: 100%;"
    var btn_type = "btn-primary"
    var prev_link = id - 1
    var next_link = id + 1

    if (meta['border']) {
        image_style += "border: black 1px solid;"
    }

    if (meta['type'] == 'heart') {
        btn_type = 'btn-danger'
    }
    else if (meta['type'] == 'life') {
        btn_type = 'btn-success'
    }

    if (id == 0) {
        prev_link = ""
    }

    if (id == directory.length - 1) {
        next_link = ""
    }

    var html = ""

    if (/mobile/i.test(req.headers['user-agent'])) {
        html = fs.readFileSync('html/index.mobile.html', {encoding: 'utf-8'});
    }
    else {
        html = fs.readFileSync('html/index.html', {encoding: 'utf-8'});
    }
    
    html = html
        .replace(/{{image-title}}/g, image_title)
        .replace(/{{image-name}}/g, image_name)
        .replace(/{{image-text}}/g, image_text)
        .replace(/{{prev-link}}/g, prev_link)
        .replace(/{{next-link}}/g, next_link)
        .replace(/{{image-style}}/g, image_style)
        .replace(/{{btn-type}}/g, btn_type)

    res.send(html)
});

app.get('/random', function(req, res) {
    var directory = JSON.parse(fs.readFileSync('directory.json'));
    var id = RandomInt(directory.length)
    res.redirect('/' + id)
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