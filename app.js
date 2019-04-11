var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var path = require('path');
var request = require("request");

//app.enable('trust proxy')

var comics = {}
var first = 0
var last = 0
var indices = []

function LoadComics() {
    files = fs.readdirSync('./comics/')

    indices = []
    
    files.forEach(file => {
        if (file.endsWith('.json')) {
            var id = parseInt(file.substr(0, file.length - 5))
            comics[id] = JSON.parse(fs.readFileSync('comics/' + file))
            indices.push(id)
        }
    });

    indices.sort(function (a, b) { return a -b; })
    first = indices[0]
    last = indices[indices.length - 1]

    for (var i = 0; i < indices.length; i++) {
        if (i == 0) {
            comics[indices[i]].prev = indices[i]
        }
        else {
            comics[indices[i]].prev = indices[i - 1]
        }

        if (i == indices.length - 1) {
            comics[indices[i]].next = indices[i]
        }
        else {
            comics[indices[i]].next = indices[i + 1]
        }
    }
}

LoadComics()

function RandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function DateStringCsv() {
    var date = new Date()
    var day = date.getDate()
    var month = date.getMonth() + 1
    var year = date.getFullYear()
    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()
    
    return year + ',' + month + ',' + day + ',' + hour + ',' + minute + ',' + second
}

function LocationStringCsv(location_info) {
    if (location_info == null) {
        return 'error,error,error,error'
    }

    var country_code = location_info['data']['geo']['country_code']
    var region = location_info['data']['geo']['region_code']
    var city = location_info['data']['geo']['city']
    var postal_code = location_info['data']['geo']['postal_code']

    return country_code + ',' + region + ',' + city + ',' + postal_code
}

var ip_cache = {}

function LocationOfIp(ip_addr, callback) {
    if (ip_addr in ip_cache && ip_cache[ip_addr] != null) {
        callback(ip_cache[ip_addr])
        return
    }

    request('https://tools.keycdn.com/geo.json?host=' + ip_addr, function(error, response, body) {
        var location_info
        try {
            ip_cache[ip_addr] = JSON.parse(body)
            callback(ip_cache[ip_addr])
        }
        catch (err) {
            ip_cache[ip_addr] = null
            callback(ip_cache[ip_addr])
        }
    })
}

app.get('/:id(\\d+)?', function(req, res) {
    directory = JSON.parse(fs.readFileSync('directory.json'))
    var id = last

    if (req.params['id'] != null) {
        id = parseInt(req.params['id'])
    }

    if (id < 0 || id > last) {
        id = last
    }

    if (!(id in comics)) {
        res.redirect('/')
        return
    }

    var ip_addr = req.headers['x-real-ip'] || req.connection.remoteAddress

    LocationOfIp(ip_addr, function(location_info) {
        var log_msg =
            DateStringCsv() + ',' +
            ip_addr + ',' +
            LocationStringCsv(location_info) + ',' +
            id +  '\n'

        fs.appendFile('log.csv', log_msg, function(err) { })
    })

    var comic = comics[id]
    var image_title = comic.title
    var image_name = comic.image_name
    var image_text = comic.mouseover
    var image_style = "width: 100%;"
    var btn_type = "btn-primary"

    if (comic.border) {
        image_style += "border: black 1px solid;"
    }

    if (comic.type == 'heart') {
        btn_type = 'btn-danger'
    }
    else if (comic.type == 'life') {
        btn_type = 'btn-success'
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
        .replace(/{{tail-link}}/g, first)
        .replace(/{{prev-link}}/g, comic.prev)
        .replace(/{{next-link}}/g, comic.next)
        .replace(/{{image-style}}/g, image_style)
        .replace(/{{btn-type}}/g, btn_type)

    res.send(html)
});

app.get('/random', function(req, res) {
    directory = JSON.parse(fs.readFileSync('directory.json'));
    var index = RandomInt(indices.length)
    var ip_addr = req.headers['x-real-ip'] || req.connection.remoteAddress

    LocationOfIp(ip_addr, function(location_info) {
        var log_msg =
            DateStringCsv() + ',' +
            ip_addr + ',' +
            LocationStringCsv(location_info) + ',' +
            'random\n'

        fs.appendFile('log.csv', log_msg, function(err) { })
    })
    res.redirect('/' + indices[index])
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
