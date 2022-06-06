/**
 * Created by feverdestiny on 2017/9/22.
 */
 const cheerio = require("cheerio");
 const request = require("request");
 const iconv = require('iconv-lite'); 
 const bufferhelper = require('bufferhelper');
 const Buffer = require('buffer').Buffer;
 const xpath = require('xpath')
 const dom = require('xmldom').DOMParser
 const fs = require("fs");
 const path = require("path");
 let count = 0; //叠加
 let url = 'http://www.biquge001.com/modules/article/search.php?searchkey=1'; //小说Url
 let list = []; //章节List
 let booksName = ''; //小说名称
 
 /**
  * 获取小说目录页
  */
 const books = function () {
    // let xml = "<book><title>Harry Potter</title></book>"
    // let doc = new dom().parseFromString(xml)
    // let nodes = xpath.select("//title", doc)
    // console.log(nodes);
    // console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
    // console.log("Node: " + nodes[0].toString())
    //  return
     return new Promise(resolve=>{
        request({
            url:encodeURI(url),
            method: 'GET',
            encoding: 'binary',
            headers: {
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36"
             }
        }, function (err, res, body) {
            if (!err && res.statusCode == 200) {
               // let html = iconv.decode(body, 'gb2312')
               body = Buffer.from(body, 'binary');
               let html = iconv.decode(body, 'gbk')
               
               // var $ = cheerio.load(html, {decodeEntities: false})
                console.log(`获取小说基本信息成功·······`)
                resolve(html)
                // resolve(booksQuery(html))
                // return
                // booksQuery(html);
            } else {
                console.log('err:' + err)
            }
        })
     })
     
 }
 /**
  * 处理小说名称及其小说目录
  * @param {*} body 
  */
 const booksQuery = function (body) {
     let $ = cheerio.load(body,{decodeEntities: false});
    //  console.log($.html());
    let arr=[]
    $('tr').each((i,e)=>{
        if (i>0) {
            let obj={}
            $(e).find('td').each((k,m)=>{
                if (k==0) {
                    obj.url=$(m).find('a').attr('href')
                    obj.name=$(m).text()
                }
            })
            arr.push(obj)
        }
    })

    // body = body.replace(/<html\s.*?>/g, "<html>");
    // let bodyDom=new dom().parseFromString(body)
    // console.log(xpath.select("//div[@id='hotcontent']/table/tr", bodyDom));

    
    
    return arr


     $('.grid').find('tr').each((i,e)=>{
        console.log(e);
     })
     return
     booksName = $('#info').find('h1').text(); //小说名称
     $('#list').find('a').each(function (i, e) { //获取章节UrlList
         list.push($(e).attr('href').split('/').pop())
     });
     // console.log(list);
     createFolder(path.join(__dirname, `/book/${booksName}.txt`)); //创建文件夹
     fs.createWriteStream(path.join(__dirname, `/book/${booksName}.txt`)) //创建txt文件
     console.log(`开始写入《${booksName}》·······`)
     getBody(); //获取章节信息
 
 }
 /**
  * 获取章节页面信息
  * 
  */
 const getBody = function () {
     let primUrl = url + list[count];
     // console.log(primUrl)
     request(primUrl, function (err, res, body) {
         if (!err && res.statusCode == 200) {
             toQuery(body);
         } else {
             console.log('err:' + err)
         }
     })
 };
 /**
  * 处理章节页面信息
  * @param {any} body 
  */
 const toQuery = function (body) {
     $ = cheerio.load(body);
     const title = $('h1').text(); //获取章节标题
     // const content = Trim($('#content').text(), 'g'); //获取当前章节文本内容并去除文本所有空格
     const content = $('#content').text()
     writeFs(title, content);
 }
 /**
  * 写入txt文件
  * @param {*} title 
  * @param {*} content 
  */
 const writeFs = function (title, content) {
     // 添加数据
     fs.appendFile(path.join(__dirname, `/book/${booksName}.txt`), title+"\r\n", function (err) {
         if (err) throw err;
     });
     fs.appendFile(path.join(__dirname, `/book/${booksName}.txt`), content+"\r\n", function (err) {
         if (err) {
             console.log(err)
         } else {
             console.log(title + '········保存成功')
             if (count + 1 < list.length) { //当前页码是否超过章节数
                 count = count + 1;
                 getBody();
             }
         }
     });
 }
 /**
  * 创建文件夹
  * 
  * @param {any} to 
  */
 const createFolder = function (to) { //文件写入
     var sep = path.sep
     var folders = path.dirname(to).split(sep);
     var p = '';
     while (folders.length) {
         p += folders.shift() + sep;
         if (!fs.existsSync(p)) {
             fs.mkdirSync(p);
         }
     }
 };
 
 /**
  * 
  * 去除所有空格
  * @param {any} str 
  * @param {any} is_global 
  * @returns 
  */
 const Trim = function (str, is_global) {
 
     var result;
     result = str.replace(/(^\s+)|(\s+$)/g, "");
     if (is_global.toLowerCase() == "g")
     {
         result = result.replace(/\s/g, "");
     }
     return result;
 }
 books();
 module.exports={
    books:books
 }

 