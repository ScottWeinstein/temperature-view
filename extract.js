var request = require('request');
var fs = require('fs');

var j = request.jar()
request = request.defaults({jar:j})
var rootUrl = 'https://www.mytaglist.com/'
fs.createReadStream('tagPassword.json').pipe(request.post(rootUrl + 'ethAccount.asmx/SignIn', function (e, r, b) {
    request.post(rootUrl + 'ethLogs.asmx/GetTemperatureRawData')
            .json({id: 0})
        .pipe(fs.createWriteStream('app/js/savedData.json'))
}));

// var commetReqBody = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetNextUpdate xmlns="http://mytaglist.com/ethComet" /></soap:Body></soap:Envelope>';
// fs.createReadStream('tagPassword.json').pipe(request.post(rootUrl + 'ethAccount.asmx/SignIn', function (e, r, b) {
//     request.post({
//         url: rootUrl + 'ethComet.asmx?op=GetNextUpdate',
//         headers: {
//             'Content-Type': 'text/xml; charset="UTF-8"'
//         },
//         body: commetReqBody
//     })
//     .pipe(fs.createWriteStream('app/js/savedData2.json'))
// }));

