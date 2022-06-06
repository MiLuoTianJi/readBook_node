const sql=require('../utils/sql')


module.exports={

    //注册的方法
    register:async function (item) {
        //先验证账号存不存在
        let accountList=await sql.selectUser({account:item.account})
        if (accountList.length>0) return Promise.resolve({
            type:false,
            msg:'该账号已存在！'
        })
        let result=await sql.insertUser(item)
        if (result) {
            return Promise.resolve({
                type:true,
                msg:'注册成功！'
            })
        }
        return Promise.resolve({
            type:false,
            msg:'注册失败！'
        })
    },

    //登录
    login:async function (account, password) {
        //先验证账号存不存在
        let accountList = await sql.selectUser({ account: account });
        if (accountList.length == 0) return Promise.resolve({
            type:false,
            msg:'该账号不存在！'
        });
        //再看密码对不对
        if (accountList[0].password != password) return Promise.resolve({
            type:false,
            msg:'密码错误！'
        });
        //把收藏的书籍查出来
        let bookListIdArr=accountList[0].bookList.split(',')
        let bookListArr=[]
        if (bookListIdArr.length>0) {
            bookListArr=await sql.selectUserBookListArr(bookListIdArr)
        }
        return Promise.resolve({
            type:true,
            msg:'登录成功！',
            ...accountList[0],
            bookList:bookListArr,
            bookListIdList:bookListIdArr
        });
    },

    //收藏/取消收藏
    collection:async function (bookId,userId,type) {
        // type  true新增   false取消
        //先获取用户原来收藏的书
        let accountList = await sql.selectUser({ id: userId });
        if (accountList.length==0) return Promise.resolve({
            type:false,
            msg:'该账号不存在！',
        });
        let bookList=accountList[0].bookList.split(',');
        let index=bookList.indexOf(bookId)
        if (type) {  //新增
            if (index!=-1) return Promise.resolve({
                type:false,
                msg:'该书籍已存在！',
            });
            bookList.push(bookId)
        }else{  //删除
            if (index==-1) return Promise.resolve({
                type:false,
                msg:'该书籍已删除！',
            });
            bookList.splice(index,1)
        }
        let result=sql.userNewBookList(bookList.join(','),userId)
        if (result) {
            //查出新的bookList
            let newAccountList = await sql.selectUser({ id: userId });
            //返回新的书籍列表
            let newBookListIdArr=newAccountList[0].bookList.split(',')
            let newBookListArr=[]
            if (newBookListIdArr.length>0) {
                newBookListArr=await sql.selectUserBookListArr(newBookListIdArr)
            }
            return Promise.resolve({
                type:true,
                msg:'操作成功！',
                data:newBookListArr
            })
        }else{
            return Promise.resolve({
                type:false,
                msg:'操作失败！'
            })
        }
    },

    //保存用户看书章节进度
    setUserBookChapterProgress:async function (data) {
        //先查数据库有没有这条记录
        let progressArr=await sql.selectBookProgress({userId:data.userId,bookId:data.bookId})
        if (progressArr && progressArr.length>0) {
            // 如果有记录就更新
            let isUpdate = await sql.updateBookProgress(data,progressArr[0].id)
        }else{
            // 如果没有记录就新增一条
            let insert = await sql.insertBookProgress(data)
        }
        let result=await sql.selectBookProgress({userId:data.userId,bookId:data.bookId})
        if (result) {
            return Promise.resolve({
                type:true,
                msg:'保存成功！'
            })
        }else{
            return Promise.resolve({
                type:false,
                msg:'保存失败！'
            })
        }
    },

    //获取用户看书章节进度
    getUserBookChapterProgress:async function (userId,bookId) {
        let progressArr=await sql.selectBookProgress({userId:userId,bookId:bookId})
        if (progressArr && progressArr.length>0) {
            return Promise.resolve({
                type:true,
                msg:'查询成功！',
                data:progressArr[0]
            })
        }else{
            return Promise.resolve({
                type:false,
                msg:'查询失败！',
                data:{}
            })
        }
    }
}