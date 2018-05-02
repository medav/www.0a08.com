var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var path = require('path');
var request = require("request");

//app.enable('trust proxy')

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
    var region = location_info['data']['geo']['region']
    var city = location_info['data']['geo']['city']
    var postal_code = location_info['data']['geo']['postal_code']

    return country_code + ',' + region + ',' + city + ',' + postal_code
}

function LocationOfIp(ip_addr, callback) {
    request('https://tools.keycdn.com/geo.json?host=' + ip_addr, callback)
}

app.get('/robots.txt', function(req, res) {
    res.send("User-agent: *\nDisallow: /")
})

app.get('/:id(\\d+)?', function(req, res) {
    var directory = JSON.parse(fs.readFileSync('directory.json'));
    var id = directory.length - 1

    if (req.params['id'] != null) {
        id = parseInt(req.params['id'])
    }

    if (id < 0 || id >= directory.length) {
        id = directory.length - 1
    }

    var ip_addr = req.headers['x-real-ip'] || req.connection.remoteAddress
    
    LocationOfIp(ip_addr, function(error, response, body) {
        var location_info
        try {
            location_info = JSON.parse(body)
        }
        catch (err) {
            location_info = null
        }

        var log_msg = DateStringCsv() + ',' + ip_addr + ',' + LocationStringCsv(location_info) + ',' + id +  '\n'

        fs.appendFile('log.csv', log_msg, function(err) {

        })
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
