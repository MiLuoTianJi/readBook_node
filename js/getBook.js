const cheerio = require("cheerio");
const request = require("request");
const iconv = require('iconv-lite'); 
const bufferhelper = require('bufferhelper');
const Buffer = require('buffer').Buffer;
const sql=require("../utils/sql.js")
const tools=require("../utils/tools.js")
const puppeteer=require("./puppeteer")

const baseUrl='http://www.xbiquge.la'

//请求网站,返回dom
function requestWeb(url) {
    return new Promise((resolve,reject)=>{
        let headers=tools.browserHeader()
        request({
            url:encodeURI(url),
            method: 'GET',
            encoding: 'binary',
            headers: {
               "User-Agent": tools.browserHeader()
             }
        },(err, response, body)=>{
            if (err) resolve(false)
            resolve(body)
        })
    })
}

//解析gbk的dom
function parseDom(body) {
    body = Buffer.from(body, 'binary');
    let html = iconv.decode(body, 'gbk')
    let $ = cheerio.load(html,{decodeEntities: false});
    return $
}

//搜索书籍的爬虫
async function parseDomForSearch(text) {
    let body=await puppeteer.clickDom('http://www.xbiquge.la/modules/article/waps.php',text,'#wd','#sss')
    // let body=await requestWeb(url)
    if (!body) return
    let $=cheerio.load(body)
    let arr=[]
    $('tr').each((i,e)=>{
        if (i>0) {
            let obj={}
            $(e).find('td').each((k,m)=>{
                switch (k) {
                    case 0:
                        obj.pageUrl=$(m).find('a').attr('href')
                        obj.bookName=$(m).text()
                        break;
                    case 1:
                        obj.lastChapter=$(m).text()
                        break;
                    case 2:
                        obj.author=$(m).text()
                        break;
                    case 3:
                        obj.wordsNumber=$(m).text()
                        break;
                    case 4:
                        obj.lastUpdateTime=$(m).text()
                        break;
                    case 5:
                        obj.status=$(m).text()
                        break;
                    default:
                        break;
                }
            })
            arr.push(obj)
        }
    })
    return Promise.resolve(arr)
}

//查看单条书籍的详情
async function getBookDetail(id) {
    // 数据库获取这本书详情
    let detail=await sql.bookDetail(id)
    // 拿到URL去爬这本书的详情
    // let body=await requestWeb(detail[0].pageUrl)
    let body=await puppeteer.getDom(detail[0].pageUrl)
    if (!body) return Promise.resolve({
        type:false,
        msg:'请求书籍失败！'
    })
    let item={
        // id
        // bookName
        // imgSrc
        // author
        // type
        // lastUpdateTime
        // lastChapterUrl
        // lastChapter
        // pageUrl
        // introduction
        // category
        // status
        // wordsNumber
    }
    let chapterList=[]
    // let $=parseDom(body)
    let $=cheerio.load(body)
    //类型
    $('.con_top').find('a').each((i,e)=>{
        if (i==2) item.type=$(e).text()
    })
    //封面
    item.imgSrc=$('#fmimg').find('img').attr('src')
    //书名
    item.bookName==$('#info').find('h1').text()
    $('#info').find('p').each((i,e)=>{
        switch (i) {
            case 0:
                //作者
                item.author=$(e).text().slice(($(e).text().indexOf("：")+1))
                break;
            case 2:
                //最后更新
                item.lastUpdateTime=$(e).text().slice(($(e).text().indexOf("：")+1))
                break;
            case 3:
                //最新章节
                item.lastChapterUrl=baseUrl+$(e).find('a').attr('href')
                item.lastChapter=$(e).find('a').text()
                break;
            default:
                break;
        }
    })
    //简介
    $("#intro").find('p').each((i,e)=>{
        if (i==1) item.introduction=$(e).text()
    })
    //更新这本书
    await sql.updateBook(item,id)
    //拿到章节
    $('#list').find('a').each((i,e)=>{
        let aTag=$(e)
        chapterList.push({
            chapterName:aTag.text(),
            
            chapterUrl:baseUrl+aTag.attr('href'),
            bookId:id,
            chapterIndex:i,
        })
    })
    //先去数据库查询当前存进去的章节
    let oldChapterList=await sql.selectChapterListByBookId(id,'chapterIndex','ASC'),
        newChapterList=[]
    //比较新老两个章节列表
    if (oldChapterList.length==0) {
        newChapterList=chapterList
    }else{
        //如果新的章节列表比旧的多，就把多出来的存进数据库
        if (chapterList.length>oldChapterList.length) {
            newChapterList=chapterList.slice(oldChapterList.length)
        }
    }
    await sql.insertChapterList(newChapterList)
    //查询数据库
    //查询书籍，在查询章节
    let result=await sql.bookDetail(id)
    result[0].chapterList=await sql.selectChapterListByBookId(id,'chapterIndex','ASC')
    return Promise.resolve({
        type:true,
        msg:'请求成功！',
        data:result[0]
    })
}

//查看单条书籍的详情(不用爬虫，直接从数据库拿)
async function getBookDetailFromDB(id) {
    // 数据库获取这本书详情
    let detail=await sql.bookDetail(id)
    if (detail.length==0) return Promise.resolve({
        type:false,
        msg:'请求书籍失败！'
    })
    detail[0].chapterList=await sql.selectChapterListByBookId(id,'chapterIndex','ASC')
    return Promise.resolve({
        type:true,
        msg:'请求成功！',
        data:detail[0]
    })
}


//通过章节ID获取正文
async function getTextByChapterId(id) {
    // 数据库获取章节详情
    let chapterDetail=await sql.selectChapterDetailById(id)
    if (chapterDetail.length==0) return Promise.resolve({
        type:false,
        msg:"获取正文失败！"
    })
    // 如果数据库text字段有值，说明有正文,就不去爬了
    if (chapterDetail[0].chapterText) {
        return Promise.resolve({
            type:true,
            msg:"获取正文成功！",
            data:chapterDetail[0]
        })
    }else{
        // 拿到URL去爬这本书的详情
        // let body=await requestWeb(chapterDetail[0].chapterUrl)
        let body=await puppeteer.getDom(chapterDetail[0].chapterUrl)
        if (!body) return Promise.resolve({
            type:false,
            msg:"获取正文失败！",
        })
        // let $=parseDom(body)
        let $=cheerio.load(body)
        let newItem={
            ...chapterDetail[0],
            chapterText:$('#content').text()
        }
        let result=await sql.updateChapterDetail(newItem,id)
        let newChapterDetail=await sql.selectChapterDetailById(id)
        return Promise.resolve({
            type:true,
            msg:"获取正文成功！",
            data:newChapterDetail[0]
        })
    }
}

//通过书籍ID和章节index获取正文
async function getTextByBookIdAndChapterIndex(bookId,chapterIndex) {
    // 数据库获取到章节
    let chapterDetail=await sql.selectTextByBookIdAndChapterIndex(bookId,chapterIndex)
    if (chapterDetail.length==0) return Promise.resolve({
        type:false,
        msg:"获取正文失败！"
    })
    // 如果数据库text字段有值，说明有正文,就不去爬了
    if (chapterDetail[0].chapterText) {
        return Promise.resolve({
            type:true,
            msg:"获取正文成功！",
            data:chapterDetail[0]
        })
    }else{
        // 拿到URL去爬这本书的详情
        // let body=await requestWeb(chapterDetail[0].chapterUrl)
        let body=await puppeteer.getDom(chapterDetail[0].chapterUrl)
        if (!body) return Promise.resolve({
            type:false,
            msg:"获取正文失败！",
        })
        // let $=parseDom(body)
        let $=cheerio.load(body)
        let newItem={
            ...chapterDetail[0],
            chapterText:$('#content').text()
        }
        let result=await sql.updateChapterDetail(newItem,chapterDetail[0].id)
        let newChapterDetail=await sql.selectChapterDetailById(chapterDetail[0].id)
        return Promise.resolve({
            type:true,
            msg:"获取正文成功！",
            data:newChapterDetail[0]
        })
    }
}


module.exports={
    parseDomForSearch:parseDomForSearch,
    getBookDetail:getBookDetail,
    getBookDetailFromDB:getBookDetailFromDB,
    getTextByChapterId:getTextByChapterId,
    getTextByBookIdAndChapterIndex:getTextByBookIdAndChapterIndex,
}