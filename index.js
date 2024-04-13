const websocket = require('ws');
const axios = require('axios');
const notems = require('./notems.js');
const fs = require('fs');
var nicks = [],users = [],checkChannel = false
var myNick = `whoami_${Math.floor(Math.random()*9999-1000)+1000}`
var cmdstart = "!"
var cansend = true
//lookup读写支持
let lookup = []
let waitsend = []
let messages = []
let userList = []
let config = { //默认数据结构
  modtrip: ["cmdTV+"],
  password: "",
  hackchatloungeuserlist: "",
  ignore: {
    hash:[],
    nick:[]
  }
}

let lastsay = {}
function getRandomItemFromArray(arr) {
  var randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
//历史记录
class LimitedArray {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.array = [];
  }

  push(item) {
    if (this.array.length >= this.maxSize) {
      this.array.shift();
    }
    this.array.push(item);
  }

  get() {
    return this.array;
  }
  
  clear() {
    this.array = []
  }
}
var historys = new LimitedArray(2000)
//hackchatloungeuserlist读取支持
function parseUserList(rawData) {
  const transformedData = {};
  rawData.forEach(entry => {
    const userInfo = {};
    const lines = entry.split('\n');
    const evaluations = [];
    let startEval = false
    lines.forEach(line => {
      const [key, value] = line.split('：');
      if (key === "用户名") {
        const username = value.split('（')[0];
        userInfo.username = username;
      } else if (key === "昵称/别名") {
        const nicknames = value.split(/[,，。、!?;:；…\s]/).filter(sbcnm=>{return sbcnm})
        userInfo.nick = nicknames;
      } else if (key === "常用trip") {
        const trips = value.split(/[.,，。、;；…\s]/).filter(sbcnm=>{return sbcnm})
        userInfo.trip = trips;
      } else if (key === "年龄") {
        userInfo.age = parseInt(value);
      } else if (key === "性别") {
        userInfo.gender = value;
      } else if (key === "描述") {
        const description = value.split(/[.,，。、!?;:；…\s]/).filter(sbcnm=>{return sbcnm})
        userInfo.description = description.filter(Boolean);
      } else if (key === "评价") {
        startEval = true
      } else if (startEval) {
        if (key && value) {
          evaluations.push({ [key]: value});
        }
      }
    });

    userInfo.evaluation = evaluations;
    transformedData[userInfo.username] = userInfo;
  });

  return transformedData;
}
function parseUseData(data) {
  return data.split("\n\n").filter(o=>{return o.trim().startsWith("用户名：")})
}
function getNewData() {
  return new Promise((resolve) => {
    notems.get(config.hackchatloungeuserlist)
    .then((hcd)=>{
      resolve(parseUserList(parseUseData(hcd)))
    })
    .catch((e)=>{
      resolve(false)
    })
  })
}


function formatTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `[${year}/${month}/${day} ${hours}:${minutes}:${seconds}]`;
}

let lazysend = true
function saveLookup() {
  try {
    const jsonData = JSON.stringify(lookup)//, null, 2);
    fs.writeFileSync('./lookup.json', jsonData, 'utf8');
    return ture;
  } catch (err) {}
  return false;
}
function saveMsg() {
  try {
    const jsonData = JSON.stringify(messages)//, null, 2);
    fs.writeFileSync('./msg.json', jsonData, 'utf8');
    return ture;
  } catch (err) {}
  return false;
}
function saveConfig() {
  try {
    const jsonData = JSON.stringify(config, null, 2);
    fs.writeFileSync('./config.json', jsonData, 'utf8');
    return ture;
  } catch (err) {}
  return false;
}

function saveUser() {
  try {
    const jsonData = JSON.stringify(userList, null, 2);
    fs.writeFileSync('./user.json', jsonData, 'utf8');
    return ture;
  } catch (err) {}
  return false;
}

try {
  lookup = require('./lookup.json');
} catch (e) {
  console.log("lookup数据库无法正常载入，已清空")
  saveLookup()
}

try {
  config = require('./config.json');
} catch (e) {
  console.log("配置文件无法正常载入，已清空")
  saveConfig()
}

try {
  messages = require('./msg.json');
} catch (e) {
  console.log("留言文件无法正常载入，已清空")
  saveMsg()
}

try {
  userList = require('./user.json');
} catch (e) {
  console.log("文件缓存无法正常载入，已清空")
  saveUser()
}

var COMMANDS = {
 help: {
    run: (args,obj,userinfo,whisper,back) => {
      if (args[0]) {
        if (COMMANDS[args[0]]) {
          back(`\n### ${args[0]}\n${COMMANDS[args[0]].help}\n用法：\`${cmdstart}${args[0]} ${COMMANDS[args[0]].useage}\``)
        } else back("没有这个命令")
      } else {
        let sortedCommands = Object.keys(COMMANDS).sort((a, b) => a.localeCompare(b))
        back(`\n### 命令列表\n \`${sortedCommands.join("`, `")}\``)
      }
    },
    help: '显示帮助，如果传入一个命令，将显示这个命令的详细介绍，否则显示帮助列表',
    useage: '[命令]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 500
  },
  noteset: {
    run: (args,obj,userinfo,whisper,back) => {
      if (args[0]) {
        let atext = args
        let apage = atext.shift()
        if (apage == "0") {
          back("这个页面不允许你直接写入，请使用 sunoteset 命令")
        } else {
          notems.set(apage,atext.join(" "))
            .then(()=>{back("成功")})
            .catch((err)=>{back("失败："+err)})
        }
      } else {
        back("参数无效")
      }
    },
    help: '往一个notems路径写入内容',
    useage: '[路径（不需要问号）] <内容>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 3000
  },
  sunoteset: {
    run: (args,obj,userinfo,whisper,back) => {
      if (args[0]) {
        let atext = args
        let apage = atext.shift()+"?"
        notems.set(apage,atext.join(" "))
          .then(()=>{back("成功")})
          .catch((err)=>{back("失败："+err)})
      } else {
        back("参数无效")
      }
    },
    help: '往一个特殊notems路径写入内容，如果你知道这个技术，请私信调用 noteset ，不要公屏使用避免传播',
    useage: '[路径（不需要问号）] <内容>',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 3000
  },
  padd: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!args[0]) {
        back("参数无效")
        return;
      }
      if (args[0].length == 6) {
        if (config.modtrip.includes(args[0])) {
          back("这个识别码已经添加了")
        } else {
          config.modtrip.push(args[0].replace(/\n/g," "))
          saveConfig()
          back("成功添加")
        }
      } else back("不是有效识别码")
    },
    help: '添加一个授权用户的识别码',
    useage: '[识别码]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  premove: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!args[0]) {
        back("参数无效")
        return;
      }
      if (args[0].length == 6) {
        if (config.modtrip.includes(args[0])) {
          let index = config.modtrip.indexOf(args[0]); 
          if (index !== -1) config.modtrip.splice(index, 1);
          saveConfig()
          back("成功删除")
        } else {
          back("没有找到这个识别码")
        }
      } else back("不是有效识别码")
    },
    help: '删除一个授权用户的识别码',
    useage: '[识别码]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  plist: {
    run: (args,obj,userinfo,whisper,back) => {
      back(`授权用户：\`${config.modtrip.join("`, `")}\``)
    },
    help: '列出授权用户识别码列表',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  msg: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!args[1]) {
        back("参数无效")
        return;
      }
      let text = args
      let to = text.shift().replace("@","")
      if (text && to.length < 25) {
        messages.push({
          "l":"n",
          "t":to,
          "n":`${formatTime()} ${obj.trip?"["+obj.trip+"]":""}${obj.nick}：\n>${text.join(" ").split("\n").join("\n>")}\n`,
          "w":whisper
        })
        saveMsg()
        back("留言成功")
      } else {
        back("参数无效")
      }
    },
    help: '留言消息给一个名称',
    useage: '[名称] [内容]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  tripmsg: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!args[1]) {
        back("参数无效")
        return;
      }
      let text = args
      let to = text.shift()
      if (text && to.length == 6) {
        messages.push({
          "l":"t",
          "t":to,
          "n":`${formatTime()} ${obj.trip?"["+obj.trip+"]":""}${obj.nick}：\n>${text.join(" ").split("\n").join("\n>")}\n`,
          "w":whisper
        })
        saveMsg()
        back("留言成功")
      } else {
        back("参数无效")
      }
    },
    help: '留言消息给一个识别码',
    useage: '[trip] [消息]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  hashmsg: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!args[1]) {
        back("参数无效")
        return;
      }
      let text = args
      let to = text.shift()
      if (text && to.length == 15) {
        messages.push({
          "l":"h",
          "t":to,
          "n":`${formatTime()} ${obj.trip?"["+obj.trip+"]":""}${obj.nick}：\n>${text.join(" ").split("\n").join("\n>")}\n`,
          "w":whisper
        })
        saveMsg()
        back("留言成功")
      } else {
        back("参数无效")
      }
    },
    help: '留言消息给一个hash',
    useage: '[hash] [消息]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  info: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!args[0]) {
        back("参数无效")
        return;
      }
      if (nicks.includes(args[0].replace("@",""))) {
        let userinf_ = getInfo(args[0].replace("@",""))
        let othern = "用户未设定，应该是默认的 6684e1（普通用户）"
        if (userinf_.uType == "mod") othern = "用户未设定，应该是默认的 1fad83（管理员）"
        if (userinf_.uType == "admin") othern = "用户未设定，应该是默认的 d73737（站长）"
        if (args[0].replace("@","") == "jeb_") {
          othern = "用户未设定，应该是默认的 rainbow（jeb_名称颜色彩蛋）"
          userinf_.color = userinf_.color + "（但是可能显示是 rainbow，因为jeb_名称颜色彩蛋优先级高）"
        }
        back(`### ${args[0].replace("@","")} 的信息：\n识别码：${userinf_.trip}\n用户类型：${userinf_.uType}\nhash：${userinf_.hash}\n等级：${userinf_.level}\n用户标识符：${userinf_.userid}\n名称颜色：${userinf_.color||othern}\n\nTA最后说了${lastsay[args[0].replace("@","")]?"："+lastsay[args[0].replace("@","")].substring(0,50)+`${lastsay[args[0].replace("@","")].length>50?"...":""}`:"什么我也不知道 awa"}`)
      } else back(`这个用户不在线\nTA最后说了${lastsay[args[0].replace("@","")]?"："+lastsay[args[0].replace("@","")].substring(0,50)+`${lastsay[args[0].replace("@","")].length>50?"...":""}`:"什么我也不知道 awa"}`)
    },
    help: '显示一个用户的信息',
    useage: '[用户名称]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 500
  },
  tellabout: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!args[0]) {
        back("参数无效")
        return;
      }
      if (args[0].length == 6) {
        back("正在更新数据库并查询")
        function checknow() {
          let finddata = []
          for (k in userList) {
            if (userList[k].trip) {
              if (userList[k].trip.includes(args[0])) finddata.push(userList[k])
            }
          }
          if (finddata.length == 0) {
            back("数据库中找不到这个识别码的信息")
            return;
          }
          let sb = []
          finddata.forEach(fd=>{
            let pj = []
            fd.evaluation.forEach(pja=>{
              pj.push(`\`${Object.keys(pja)[0]}\`：\`${pja[Object.keys(pja)[0]]}\``)
            })
            sb.push(`用户名：\`${fd.username}\`\n别称：\`${fd.nick.join("`, `")}\`\n识别码：\`${fd.trip.join("`, `")}\`\n年龄：\`${fd.age}\`\n性别：\`${fd.gender}\`\n描述：\`${fd.description.join("`, `")}\`\n评价：\n${pj.join("\n")}`)
          })
          back(sb.join("\n·\n"))
        }
        getNewData()
          .then((data)=>{
            if (typeof data == "object") {
              userList = data
              saveUser()
            } else back("更新失败，使用缓存数据")
            checknow()
          })
          .catch((e)=>{
            back("更新失败，使用缓存数据")
            checknow()
          })
      } else back(`识别码无效`)
    },
    help: '连接hackchatloungeuserlist查询一个用户的信息',
    useage: '[识别码]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 10000
  },
  setu: {
    run: (args,obj,userinfo,whisper,back) => {
      axios.get(`https://api.lolicon.app/setu/v2${args[0]?"?tag="+encodeURIComponent(args.join(" ")):""}`)
      .then((_4w4)=>{
        let _404 = _4w4.data.data
        if (_404) {
          _404 = _404[0]
          let etags = _404.tags.filter((tag)=>{return !(/[乳魅内尻屁胸]/.test(tag))})
          back(`![](${_404.urls.original})\n[${_404.title}](https://www.pixiv.net/artworks/${_404.pid}) —— ${_404.author}\n标签：${etags.join(", ")}`)
        } else back("要求太大了吧qwq")
      })
      .catch((e)=>{
        back("QAQ")
      })
    },
    help: '随机找张瑟图，参考自awa_ya',
    useage: '<标签>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 10000
  },
  code: {
    run: (args,obj,userinfo,whisper,back) => {
      if (userinfo.trip !== "cmdTV+") {
        back("Only Allow MelonCmd's")
      } else {
        try {
          back(`==_√_== done.\n\`\`\`\n${JSON.stringify(eval(args.join(" ")),null,2)}`)
        } catch (e) {
          back(`==_×_== failed.\n\`\`\`\n${e.message}`)
        }
      }
    },
    help: '执行代码',
    useage: '[代码]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 10000
  }
}


console.log("正在连接到服务器……");
var ws = new websocket("wss://hack.chat/chat-ws");
var _send = (obj,fast=false) => {
  if (fast) {
    ws.send(JSON.stringify(obj))
  } else waitsend.push(JSON.stringify(obj))
}
setInterval(()=>{
  if (waitsend.length == 0 || !cansend) {
    waitsend = []
    return;
  }
  if (waitsend.length > 5) {
    lazysend = false
    waitsend = []
    _send({
      cmd: 'emote',
      text: 'ouo，我好像被轰炸了，暂停所有优先级不为高的待发送信息和私信命令执行处理1分钟'
    },true)
    cansend = false
    setTimeout(()=>{
      lazysend=true
      cansend = true
      waitsend = []
    },60000);
    return;
  }
  ws.send(waitsend.shift())
},3000)
function yiyan(textpa) {
  axios.get("https://v1.hitokoto.cn/")
    .then((_0x24a)=>{
      let _404 = _0x24a.data
      _send({
        cmd: 'chat',
        text: textpa.replace("$t",_404.hitokoto).replace("$f",_404.from).replace("$w",`${_404.from_who?_404.from_who:getRandomItemFromArray(["侠名","一位人","一位过客","4n0n4me",getRandomItemFromArray(nicks)])}`)
      })
    })
    .catch((e)=>{
      _send({
        cmd: 'chat',
        text: 'who am i?'
      })
    })
}
function qyk(semsg) {
  if (semsg.indexOf("机器人") != -1) {
    _send({
      cmd: 'chat',
      text: getRandomItemFromArray(["6","666","9","999","e","az"])
    })
  }
  axios.get("http://api.qingyunke.com/api.php?key=free&msg=" + encodeURIComponent(semsg))
  .then((e)=>{
    if (e.data.result == 0) {
      _send({
        cmd: 'chat',
        text: e.data.content.replace(/\{br\}/g,"\n").replace(/菲菲/g,"cmd")
      })
    }
  })
  .catch((e)=>{})
}
function changecolor() {
  _send({
    cmd: 'changecolor',
    color: '' + getRandomNumber(0xaa,0xff).toString(16) + getRandomNumber(0xaa,0xff).toString(16) + getRandomNumber(0xaa,0xff).toString(16)
  },true)
}
ws.onopen=()=>{
  console.log("登入中")
  _send({
    cmd: 'join',
    channel: 'loungee',
    nick: myNick,
    password: config.password
  },true)
  changecolor()
  setInterval(changecolor,30000)
  setInterval(()=>{
    checkChannel = true
    _send({
      cmd: 'chat',
      text: '/'
    },true)
  },10000)
  setTimeout(sendHistory,getRandomNumber(600000,1000000))
}
function getInfo(usernick) {
  return users.find(user=>{return user.nick == usernick})
}
function isRL(cmd) {
  if (cmd) {
    if (!cmd.nowRL) {
      cmd.nowRL = new Date().getTime()
      return false
    }
    if (cmd.nowRL + cmd.rl < new Date().getTime()) return false;
    return true;
  } else return false;
}
function sendHistory() {
  if (getRandomNumber(0,2) != 0) {
    _send({
      cmd: 'chat',
      text: '\x00 ' + getRandomItemFromArray(historys.get())
    })
  } else qyk(getRandomItemFromArray(historys.get()))
  setTimeout(sendHistory,getRandomNumber(300000,1000000))
}
ws.onmessage=(e)=>{
  var hc = JSON.parse(e.data);
  if (hc.channel) {
    if (hc.channel != "lounge" && hc.channel != "loungee") ws.close()
  }
  if (hc.cmd == "warn" && hc.text == "Unknown command: /" && checkChannel) {
    checkChannel = false
    return;
  }
  console.log(e.data)

  //日志
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const dates = today.getDate().toString().padStart(2, '0');

  const todayDate = `${year}-${month}-${dates}`;
  fs.appendFile('logs/' + todayDate + '.txt', e.data + "\r\n", (error) => {
    if (error) {
      console.error(error);
    }
  });
  //屏蔽
  if (nicks.includes(hc.nick)) if (config.ignore.hash.includes(getInfo(hc.nick).hash) || config.ignore.nick.includes(hc.nick)) return;
  //why did you call yourself
  if (hc.cmd == "chat" && hc.text.replace("@","").trim() == hc.nick) _send({cmd:'chat',text:'why did you call yourself'})
  //灵魂支持
  if (hc.cmd == "chat" && hc.text.length < 152 && hc.nick != myNick) historys.push(hc.text)
  if (hc.cmd == "chat" && getRandomNumber(1,30) == 1 && hc.nick != myNick) qyk(hc.text)
  if (hc.cmd == "chat" && getRandomNumber(1,30) == 1 && hc.nick != myNick) _send({cmd:'chat',text:hc.nick + getRandomItemFromArray(['最可爱了','是小天使'])})
  if (hc.cmd == "onlineAdd") {
    if (getRandomNumber(0,1) == 1) {
      yiyan(getRandomItemFromArray(["$w在$f中写道，$t","$t","$w说过，$t","细品$w写的$f","$w写道，$t","昔日，$t","$1，你可曾知道$w","$1，你可曾了解$f","$1，你可曾知晓，$t"]).replace("$1",hc.nick))
    } else {
      var welc = ["hey, $1","hello, $1","早上好，$1！","出现了，$1！","hi, $1","中午好，$1","下午好，$1~","晚上好，$1！","你好诶，$1，新的一天也要加油哦！"]
      _send({
        cmd: 'chat',
        text: getRandomItemFromArray(welc).replace("$1",hc.nick)
      })
    }
  }
  //users和nicks变量支持
  if (hc.cmd == "onlineSet") {
    users = hc.users
    nicks = hc.nicks
  }
  if (hc.cmd == "onlineAdd") {
    let payload = hc
    delete payload.cmd
    users.push(payload)
    nicks.push(hc.nick)
  }
  if (hc.cmd == "onlineRemove") {
    users = users.filter(function (item) {
      return item.nick !== hc.nick;
    });
    let index = nicks.indexOf(hc.nick);
    if (index !== -1) nicks.splice(index, 1);
  }
  if (hc.cmd == "updateUser") {
    let payload = hc
    delete payload.cmd
    users = users.filter(function (item) {
      return item.nick !== hc.nick;
    });
    users.push(payload)
  }
  //lookup数据库支持
  if (hc.cmd == "onlineAdd") {
    lookup.push({
      n:hc.nick,
      t:hc.trip,
      h:hc.hash
    })
    lookup = [...new Set(lookup.map(JSON.stringify))]
    lookup = Array.from(lookup).map(JSON.parse);
    saveLookup()
  }
  if (hc.cmd == "onlineSet") {
    hc.users.forEach(user=>{
      lookup.push({
        n:user.nick,
        t:user.trip,
        h:user.hash
      })
    })
    lookup = [...new Set(lookup.map(JSON.stringify))]
    lookup = Array.from(lookup).map(JSON.parse);
    saveLookup()
  }
  //青云客
  if (hc.cmd == "chat" && hc.text.indexOf("@"+myNick) != -1 && hc.nick != myNick) { 
    let semsg = hc.text.replace("@"+myNick,"").trim()
    qyk(semsg)
  }

  //留言处理
  if (hc.cmd == "chat") {
    let messages2 = []
    let sendmessage = []
    messages.forEach(message=>{
      if (message.l=="n" && message.t==hc.nick && !message.w) {
        sendmessage.push(message.n)
      } else if (message.l=="t" && message.t==hc.trip && !message.w) {
        sendmessage.push(message.n)
      } else if (message.l=="h" && message.t == getInfo(hc.nick).hash && !message.w) {
        sendmessage.push(message.n)
      } else {
        messages2.push(message)
      }
    })
    if (sendmessage.length > 0) {
      messages = messages2
      saveMsg()
      let sendly = sendmessage.join("\n")
      if (sendly.length > 1152) {
        let notepath = `message${Math.floor(Math.random()*99999999999999999-10000000000000000)+10000000000000000}`
        let pnotepath = `message${Math.floor(Math.random()*99999999999999999-10000000000000000)+10000000000000000}`
        notems.set(notepath,sendly)
        .then(()=>{
          notems.set(pnotepath,sendly)
          .then(()=>{
            _send({
              cmd: 'chat',
              text: `@${hc.nick} 你的人缘太好了，留言的内容太长了，为了防止其他人篡改你的留言，NoteMs地址私信发送给您，[而这个是公开的副本](https://note.ms/${pnotepath})，容易被篡改`
            })
          })
          .catch((e)=>{
            _send({
              cmd: 'chat',
              text: `@${hc.nick} 你的人缘太好了，留言的内容太长了，为了防止其他人篡改你的留言，NoteMs地址私信发送给您，而公开的副本写入失败了`
            })
          })
          _send({
            cmd: 'whisper',
            nick: hc.nick,
            text: `你的人缘太好了，留言的内容太长了，[请手动点此查看！](https://note.ms/${notepath})`
          })
        })
        .catch((e)=>{
          _send({
            cmd: 'chat',
            text: `@${hc.nick} ouo，我不小心把别人留言给你的内容弄丢了`
          })
        })
      } else {
        _send({
          cmd: 'chat',
          text: `@${hc.nick}\n${sendly}`
        })
      }
    }
    messages2 = []
    sendmessage = []
    messages.forEach(message=>{
      if (message.l=="n" && message.t==hc.nick && message.w) {
        sendmessage.push(message.n)
      } else if (message.l=="t" && message.t==hc.trip && message.w) {
        sendmessage.push(message.n)
      } else if (message.l=="h" && message.t == getInfo(hc.nick).hash && message.w) {
        sendmessage.push(message.n)
      } else {
        messages2.push(message)
      }
    })
    if (sendmessage.length > 0) {
      messages = messages2
      saveMsg()
      let sendly = sendmessage.join("\n")
      if (sendly.length > 1152) {
        let notepath = `message${Math.floor(Math.random()*99999999999999999-10000000000000000)+10000000000000000}`
        notems.set(notepath,sendly)
        .then(()=>{
          _send({
            cmd: 'whisper',
            nick: hc.nick,
            text: `你的人缘太好了，留言的内容太长了，[请手动点此查看！](https://note.ms/${notepath})`
          })
        })
        .catch((e)=>{
          _send({
            cmd: 'whisper',
            nick: hc.nick,
            text: `ouo，我不小心把别人留言给你的内容弄丢了`
          })
        })
      } else {
        _send({
          cmd: 'whisper',
          nick: hc.nick,
          text: `>\n${sendly}`
        })
      }
    }
  }
  //最后说了……处理
  if (hc.cmd == "chat") lastsay[hc.nick] = hc.text
  if (hc.cmd == "info" && hc.type == "emote") lastsay[hc.nick] = hc.text 


  //屎山代码，用了return，必须放最后

  //命令系统
  if (hc.cmd == "chat" && hc.text.startsWith("![")) return;
  if (hc.cmd == "chat" && hc.text.startsWith(cmdstart)) {
    try {
      let cmdargs = hc.text.substring(cmdstart.length).split(" ");
      let cmdname = cmdargs.shift()
      let userlevel = (config.modtrip.includes(hc.trip) && hc.level < 152)?152:hc.level
      if (!lazysend && userlevel < 152) return;
      if (isRL(COMMANDS[cmdname]) && userlevel < 152) {
        _send({
          cmd: 'chat',
          text: '操作过快'
        })
        return;
      }
      if (COMMANDS[cmdname]) {
        if (userlevel < COMMANDS[cmdname].level) {
          _send({
            cmd: 'chat',
            text: '无权限'
          })
        } else {
          COMMANDS[cmdname].run(cmdargs,hc,getInfo(hc.nick),false,(text)=>{_send({cmd:'chat',text:text},userlevel>=152?true:false)})
        }
      } else {
        _send({
          cmd: 'chat',
          text: '命令未找到'
        })
      }
    } catch (e) {
      console.log(e)
      _send({
        cmd: 'chat',
        text: '命令执行时出错：' + e.message
      })
    }
  }
  if (hc.cmd == "info" && hc.from && hc.type == "whisper" && hc.text.substring(12+hc.from.length).startsWith(cmdstart)) {
    try {
      let cmdargs = hc.text.substring(cmdstart.length+12+hc.from.length).split(" ");
      let cmdname = cmdargs.shift()
      let userlevel = (config.modtrip.includes(hc.trip) && hc.level < 152)?152:hc.level
      if (!lazysend && userlevel < 152) return;
      if (isRL(COMMANDS[cmdname]) && userlevel < 152) {
        _send({
          cmd: 'whisper',
          nick: hc.from,
          text: '操作过快'
        })
        return;
      }
      if (COMMANDS[cmdname]) {
        if (userlevel < COMMANDS[cmdname].level) {
          _send({
            cmd: 'whisper',
            nick: hc.from,
            text: '无权限'
          })
        } else {
          COMMANDS[cmdname].run(cmdargs,hc,getInfo(hc.from),true,(text)=>{_send({cmd:'whisper',nick:hc.from,text:">\n"+text},userlevel>=152?true:false)})
        }
      } else {
        _send({
          cmd: 'whisper',
          nick: hc.from,
          text: '命令未找到'
        })
      }
    } catch (e) {
      _send({
        cmd: 'whisper',
        nick: hc.from,
        text: '命令执行时出错：' + e.message
      })
    }
  }

}
ws.onclose=()=>{
  process.exit(1)
}
