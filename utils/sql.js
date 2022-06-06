const tools=require('./tools.js')

//操作数据库
function sqlhandler(sql) {
    let mysql= require('mysql');
    let connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '123456',
        database : 'node_bookRead'
    });
    connection.connect();
    return new Promise((resolve,reject)=>{
        connection.query(sql,(err,result)=>{
            // console.log(err);
            // console.log(result);
            if (err) {
                // console.log(err);
                // reject(err)
                resolve(false)
                connection.end();
                return
            }
            // console.log(result);
            resolve(result)
            connection.end();
          });
    })
}

//验证数据库里面书有没有重复
async function validateBook(item) {
    let arr=[]
    for (const key in item) {
        //在数据库里面找一下同书名同作者的
        if (key=='bookName' || key=='author') {
            arr.push(`${key}="${item[key]}"`)
        }
    }
    let sql=`SELECT * FROM booklist WHERE ${arr.join(' AND ')};`
    let result=await sqlhandler(sql)
    return Promise.resolve(result)
}

module.exports={
    //批量插入ip
    insertIPList:function (arr) {
        let sql="INSERT INTO proxyIP (id,ip,port,type) VALUES "
        let sqlArr=arr.map(v=>{
            return `("${v.id}","${v.ip}","${v.port}","${v.type}")`
        })
        sqlhandler(sql+sqlArr.join(',')+';')
    },

    //删除IP
    deleteIP:function (id) {
        let sql=`DELETE FROM proxyIP WHERE id=${id};`
        sqlhandler(sql)
    },

    //插入新书
    insertBook:async function (arr,needId) {
        let insertArr=[]
        let keysArr=[]
        let allArr=[]
        for (let i = 0; i < arr.length; i++) {
            let repeatList=await validateBook(arr[i])
            if (repeatList.length==0) {
                arr[i].id=tools.getGuid()
                allArr.push(arr[i])
                let insertItemSqlArr=[]
                for (const key in arr[i]) {
                    if (keysArr.indexOf(key)==-1) {
                        keysArr.push(key)
                    }
                    insertItemSqlArr.push(`"${arr[i][key]}"`)
                }
                insertArr.push(`(${insertItemSqlArr.join(',')})`)
            }else{
                allArr=allArr.concat(repeatList)
            }
        }
        let sql=''
        let result=false
        if (insertArr.length>0) {
            sql=`INSERT INTO booklist (${keysArr.join(',')}) VALUES ${insertArr.join(',')};`
            result=await sqlhandler(sql)
        }
        if (needId) {
            return Promise.resolve(allArr)
        }else{
            return Promise.resolve(result)
        }
    },

    //验证数据库里面书有没有重复
    validateBook:validateBook,

    //更新单条书籍详情
    updateBook:async function (item,id) {
        let newAttrList=[]
        for (const key in item) {
            newAttrList.push(`${key}='${item[key]}'`)
        }
        let sql=`UPDATE booklist SET ${newAttrList.join(',')} WHERE id="${id}";`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },

    //根据书籍ID查询章节
    selectChapterListByBookId:async function (bookId,index,type) {
        let sql=`SELECT * FROM chapter_list WHERE bookId="${bookId}" ORDER BY ${index}^0 ${type};`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },

    //存入章节
    insertChapterList:async function (arr) {
        if (arr.length==0) {
            return
        }
        let sql=''
        let result=false
        let keys=[],
            values=[]
        arr.forEach((v,i)=>{
            v.id=tools.getGuid()
            let valuesItem=[]
            for (const key in v) {
                if (i==0) {
                    keys.push(key)
                }
                valuesItem.push(`"${v[key]}"`)
            }
            values.push(`(${valuesItem.join(',')})`)
        })
        if (values.length>0) {
            sql=`INSERT INTO chapter_list (${keys.join(',')}) VALUES ${values.join(',')};`
            result=await sqlhandler(sql)
        }
        return Promise.resolve(result)
    },

    //查询书籍详情
    bookDetail:async function (id) {
        let sql=`SELECT * FROM booklist WHERE id='${id}';`
        let detail=await sqlhandler(sql)
        return Promise.resolve(detail)
    },

    //获取章节详情
    selectChapterDetailById:async function (id) {
        let sql=`SELECT * FROM chapter_list WHERE id='${id}';`
        let detail=await sqlhandler(sql)
        return Promise.resolve(detail)
    },

    //更新章节详情
    updateChapterDetail:async function (item,id) {
        let values=[]
        for (const key in item) {
            values.push(`${key}='${item[key]}'`)
        }
        let sql=`UPDATE chapter_list SET ${values.join(',')} WHERE id="${id}";`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },
    
    //插入新用户
    insertUser:async function (item) {
        let newItem={
            ...item,
            id:tools.getGuid(),
            bookList:''
        }
        let sql=`INSERT INTO user (${Object.keys(newItem).join(',')}) VALUES (${Object.values(newItem).map(v=>`"${v}"`).join(',')});`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },

    //查询用户信息
    selectUser:async function (item) {
        let queryData=[]
        for (const key in item) {
            queryData.push(`${key}="${item[key]}"`)
        }
        let sql=`SELECT * FROM user WHERE ${queryData.join(',')}`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },

    //用户更新bookList
    userNewBookList:async function (newBookListString,userId) {
        let sql=`UPDATE user SET bookList="${newBookListString}" WHERE id="${userId}";`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },

    //通过用户的bookList查每本书的详情
    selectUserBookListArr:async function (bookListIdArr) {
        let sql=`SELECT * FROM booklist WHERE ${bookListIdArr.map(v=>`id="${v}"`).join(' OR ')}`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },

    //通过书籍ID和章节index查询章节
    selectTextByBookIdAndChapterIndex:async function (bookId,chapterIndex) {
        let sql=`SELECT * FROM chapter_list WHERE bookId='${bookId}' AND chapterIndex=${chapterIndex};`
        let detail=await sqlhandler(sql)
        return Promise.resolve(detail)
    },

    //查询用户看书进度
    selectBookProgress:async function (item) {
        let selectData=[]
        for (const key in item) {
            selectData.push(`${key}='${item[key]}'`)
        }
        let sql=`SELECT * FROM book_read_progress WHERE ${selectData.join(' AND ')};`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },

    //插入用户看书章节进度
    insertBookProgress:async function (item) {
        let newItem={
            ...item,
            id:tools.getGuid(),
        }
        let sql=`INSERT INTO book_read_progress (${Object.keys(newItem).join(',')}) VALUES (${Object.values(newItem).map(v=>`"${v}"`).join(',')});`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    },

    //更新用户看书章节进度
    updateBookProgress:async function (item,id) {
        let newItem={
            chapterId:item.chapterId,
            chapterIndex:item.chapterIndex,
            chapterProgress:item.chapterProgress,
        }
        let selectData=[]
        for (const key in newItem) {
            selectData.push(`${key}='${item[key]}'`)
        }
        let sql=`UPDATE book_read_progress SET ${selectData.join(",")} WHERE id="${id}";`
        let result=await sqlhandler(sql)
        return Promise.resolve(result)
    }
}