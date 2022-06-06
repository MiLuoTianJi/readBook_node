const puppeteer = require('puppeteer');

//爬取dom
async function getDom(url) {
    const browser = await puppeteer.launch({
        // slowMo: 100,    //放慢速度
        headless: true, //开启可视化
        // defaultViewport: {width: 1440, height: 780},
        // ignoreHTTPSErrors: false, //忽略 https 报错
        // args: ['--start-fullscreen'] //全屏打开页面
    });
    const page = await browser.newPage();
    await page.goto(url);
    let doc=await page.content()
    await page.close();
    await browser.close();
    return Promise.resolve(doc)
}

//触发点击事件，返回dom
async function clickDom(url,text,inputName,btnName) {
    const browser = await puppeteer.launch({
        // slowMo: 100,    //放慢速度
        headless: true, //开启可视化
        defaultViewport: {width: 1440, height: 780},
        ignoreHTTPSErrors: false, //忽略 https 报错
        args: ['--start-fullscreen'] //全屏打开页面
    });
    const page = await browser.newPage();
    await page.goto(url);
    //输入文本
    const inputElement = await page.$(inputName);
    await inputElement.type(text, {delay: 20});
    //点击搜索按钮
    let okButtonElement = await page.$(btnName);
    //等待页面跳转完成，一般点击某个按钮需要跳转时，都需要等待 page.waitForNavigation() 执行完毕才表示跳转成功
    await Promise.all([
        okButtonElement.click(),
        page.waitForNavigation()  
    ]);
    let doc=await page.content()
    await page.close();
    await browser.close();
    return Promise.resolve(doc)
}

module.exports={
    clickDom:clickDom,
    getDom:getDom
}