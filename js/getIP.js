const cheerio = require("cheerio");
const request = require("request");
let sql=require("../utils/sql")
let tools=require("../utils/tools")

//
// let url='http://jahttp.zhimaruanjian.com/'

let ipList=[]

//先拿10页的IP存起
let getTenPage=async function () {
    let baseUrl='http://www.taiyanghttp.com/free/page'
    for (let i = 20; i >=15; i--) {
        await requestProxy(baseUrl+i)
    }
    // console.log(ipList);
    //验证IP能不能用
    let afterCheckIPList=[]
    for (let i = 0; i < ipList.length; i++) {
        let checkResult=await checkIP(ipList[i])
        if (checkResult) {
            afterCheckIPList.push(ipList[i])
        }
    }
    return
    insertIPToDB(afterCheckIPList)
}

//请求网站
let requestProxy=function (url) {
    return new Promise((resolve,reject)=>{
        request(url,(err, response, body)=>{
            parsingIPFromHTML(body)
            resolve()
        })
    })
}

//解析网站，把IP，端口，协议提取出来
let parsingIPFromHTML=function (body) {
    const $=cheerio.load(body)
    $('#ip_list').find('.tr').each(function (i,e) {
        let obj={}
        $(e).find('div').each(function (chilrenI,childrenE) {
            if (chilrenI==0) obj.ip=$(childrenE).text()
            if (chilrenI==1) obj.port=$(childrenE).text()
            if (chilrenI==6) obj.type=$(childrenE).text()
        })
        obj.id=tools.getGuid()
        ipList.push(obj)
    })
}

//检测网址为百度的某个js文件，速度快，文件小，非常适合作为检测方式
let checkIP=function (ipItem) {
    return new Promise((resolve,reject)=>{
        request({
            url:'http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js',
            proxy:`${ipItem.type.toLowerCase()}://${ipItem.ip}:${ipItem.port}`,
            method:'GET',
            timeout:2000,
        },(err, response, body)=>{
            if(!err && response.statusCode == 200){
                console.log(`${ipItem.type.toLowerCase()}://${ipItem.ip}:${ipItem.port} 链接成功`)
                resolve(true)
            } else {
                console.log(`${ipItem.type.toLowerCase()}://${ipItem.ip}:${ipItem.port} 链接失败`)
                resolve(false)
            }
        })
    })
}

//把IP插入到数据库里面去
let insertIPToDB=async function (ipList) {
    await sql.insertIPList(ipList)
}

getTenPage()