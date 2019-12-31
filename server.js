var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var ExifImage = require('exif').ExifImage;

var app = express();

app.set('view engine', 'ejs');

app.get('/', (req,res) => {
    res.render('index.ejs');
});

app.post('/result', (req,res)=>{
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files)=>{
        console.log(JSON.stringify(fields));
        console.log(JSON.stringify(files));
        if(files.photo.size == 0){
            res.status(500).end("No image is upload!");
            return;
        }
        if(files.photo.type){
            var type = files.photo.type;
        }
        if(!type.match(/^image/)){
            res.status(500).end("Please upload an image file!");
            return;
        }

        fs.readFile(files.photo.path, (err,data) => {
            var image64 = new Buffer.from(data).toString('base64');

            try{
                new ExifImage({image: data}, (err,exifData)=>{              
                    if(err){
                        console.log('Error: '+ err.message);
                        //return;
                        if(err.code == "NO_EXIF_SEGMENT"){
                            res.status(500).end("No Exif segment found in the given image.");
                            return;
                        }
                    }
                    console.log(JSON.stringify(exifData));
                    var exifdata = {};
                    exifdata['make'] = exifData.image.Make ? exifData.image.Make : "";
                    exifdata['model'] = exifData.image.Model ? exifData.image.Model : "";
                    exifdata['createdOn'] = exifData.exif.CreateDate;
                    var lat = exifData.gps.GPSLatitude[0] + exifData.gps.GPSLatitude[1]/60 + exifData.gps.GPSLatitude[2]/3600;
                    var lon = exifData.gps.GPSLongitude[0] + exifData.gps.GPSLongitude[1]/60 + exifData.gps.GPSLongitude[2]/3600;
                    if(exifData.gps.GPSLatitudeRef == "S"){
                        lat *= -1;
                    }
                    if(exifData.gps.GPSLongitudeRef == "W"){
                        lon *= -1;
                    }
                    exifdata['location'] = [lat,lon];
                    console.log(JSON.stringify(exifdata));

                    res.render('result.ejs', {
                        title: fields.title ? fields.title : "",
                        discription: fields.discription ? fields.discription : "",
                        type: type,
                        image64: image64,
                        imageData: exifdata
                    });
                });
            }catch(err){
                console.log('Error: ' + err.message);
                return;
            } 
        });           
    });   
});

app.get('/map/:lat/:lon/:zoom', (req,res)=>{
    res.render('map.ejs', {
        lon: req.params.lon,
        lat: req.params.lat,
        zoom: req.params.zoom ? req.params.zoom : 12
    });
});

app.get('/*', (req,res) => {
    res.render('index.ejs');
});

app.listen(app.listen(process.env.PORT || 8099));