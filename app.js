const api=require("./js/api")

//配置服务端口
let server = api.listen(80, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
})
server.timeout = 20000;