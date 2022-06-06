const express = require('express');
const cheerio = require("cheerio");
const request = require("request");
const sql=require("../utils/sql.js")
const tools=require("../utils/tools.js")
const getBook=require("./getBook")
const user=require("./user")
const api = express();

api.use(express.json())
api.use(express.urlencoded({ extended: true }))

//设置跨域访问
api.all("*",function(req,res,next){
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers","Content-Type");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
    //数据类型
    res.header("Content-Type", "application/json;charset=utf-8");
    // 让options尝试请求快速结束
    if (req.method.toLowerCase() == 'options')
      res.sendStatus(200);
    else
      next();
});

//搜索书籍
api.get(`/search`, async function(req, res) {
    // let url=`http://www.biquge001.com/modules/article/search.php?searchkey=${req.query.text}`
    let body=await getBook.parseDomForSearch(req.query.text)
    // res.status(200),
    //     res.json(questions)
        // res.send(req.query)
    //存到数据库去
    let result=await sql.insertBook(body,true)
    res.send(result)

});

//查看书籍详情
api.get(`/detail`,async function (req, res) {
    let body=await getBook.getBookDetail(req.query.id)
    res.send(body)
})

//查看书籍详情(和上面的接口的区别在这个不用爬虫，直接从数据库拿)
api.get(`/detailFromDB`,async function (req, res) {
    let body=await getBook.getBookDetailFromDB(req.query.id)
    res.send(body)
})

//通过章节ID获取正文
api.get(`/getText`,async function (req, res) {
    let body=await getBook.getTextByChapterId(req.query.id)
    res.send(body)
})

//通过书籍ID和章节index获取正文
api.get(`/getTextByBookIdAndChapterIndex`,async function (req, res) {
    let body=await getBook.getTextByBookIdAndChapterIndex(req.query.bookId,req.query.chapterIndex,)
    res.send(body)
})

//注册
api.post(`/register`,async function (req, res) {
    let item={
        account:req.body.account,
        password:req.body.password,
        name:req.body.name,
    }
    let body=await user.register(item)
    res.send(body)
})

//登录
api.post(`/login`,async function (req, res) {
    let body=await user.login(req.body.account,req.body.password)
    res.send(body)
})

//收藏书籍
api.post('/collection',async function (req, res) {
    let bookId=req.body.bookId,
        userId=req.body.userId,
        type=req.body.type
    let body=await user.collection(bookId,userId,type)
    res.send(body)
})

//保存用户看书章节进度
api.post('/setUserBookChapterProgress',async function (req, res) {
    if (!req.body.userId) {
        res.send('差userId')
        return
    }
    if (!req.body.bookId) {
        res.send('差bookId')
        return
    }
    if (!req.body.chapterId) {
        res.send('差chapterId')
        return
    }
    if (!req.body.chapterIndex) {
        res.send('差chapterIndex')
        return
    }
    let queryData={
        userId:req.body.userId,
        bookId:req.body.bookId,
        chapterId:req.body.chapterId,
        chapterIndex:req.body.chapterIndex,
        chapterProgress:req.body.chapterProgress,
    }
    let body=await user.setUserBookChapterProgress(queryData)
    res.send(body)
})

//获取用户看书章节进度
api.get('/getUserBookChapterProgress',async function (req, res) {
    if (!req.query.userId) {
        res.send('差userId')
        return
    }
    if (!req.query.bookId) {
        res.send('差bookId')
        return
    }
    let body=await user.getUserBookChapterProgress(req.query.userId,req.query.bookId)
    res.send(body)
})

api.post(`/postceshi`, function(req, res) {
    // res.status(200),
    //     res.json(questions)
        res.send(req.body)
});

module.exports=api