const websocket = require('ws');
const axios = require('axios');
const notems = require('./notems.js');

//2fa
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const _2fa = {
  getKey: (issuer, username) => {
    let secret = speakeasy.generateSecret({ length: 20 })
    return {
      base32: secret.base32,
      otpauth_url: speakeasy.otpauthURL({ secret: secret.ascii, label: username, issuer: issuer})
    };
  },
  verify: (secret, otpToken) => {
    return speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: otpToken
    });
  },
  qrcode: (secret) => {
    return new Promise((resolve) => {
      qrcode.toDataURL(secret.otpauth_url, function(err, data_url) {
        if (err) resolve(false);
        let notepath = `message${Math.floor(Math.random()*99999999999999999-10000000000000000)+10000000000000000}`
        notems.set(notepath,`![](${data_url})`)
          .then(()=>{
            resolve(`https://note.ms/${notepath}.md`)
          })
          .catch(()=>{
            resolve(false)
          })
      });
    });

  }
}
function reply(args) {//来源于crosst.chat，有改动
  let replyText = '';
  let originalText = args.text;
  let overlongText = false;
  if (originalText.length > 152) {
    replyText = originalText.slice(0, 152);
    overlongText = true;
  }
  if (args.trip) {
    replyText = '>' + args.trip + ' ' + args.nick + '：\n';
  } else {
    replyText = '>' + args.nick + '：\n';
  }
  originalText = originalText.split('\n');
  if (originalText.length >= 8) {
    originalText = originalText.slice(0, 8);
    overlongText = true;
  }
  for (let replyLine of originalText) {
    if (!replyLine.startsWith('>>')) replyText += '>' + replyLine + '\n';
  }
  if (overlongText) replyText += '>……\n';
  replyText += '\n';
  var nick = args.nick
  replyText += '@' + nick + ' ';
  return replyText;
}
const fs = require('fs');
var nicks = [],users = [],nicks_ = [],users = [],checkChannel = false
var myNick = `whoami_${Math.floor(Math.random()*9999-1000)+1000}`
var cmdstart = "!"
var cansend = true
//lookup读写支持
let lookup = []
let waitsend = []
let messages = []
let userList = []
let spamhash = {}
let gptuserid = {}
let sudoid = {}
let joined = false
var users_ = [] ,nicks = []//持久化users、nicks
let config = { //默认数据结构
  modtrip: ["cmdTV+"],
  password: "",
  hackchatloungeuserlist: "",
  ignore: {
    hash:[],
    nick:[]
  },
  r18: true,
  bans: {
    nick: [],
    trip: [],
    hash: [],
    text: []
  },
  rl: [100,20,0,10],
  _2fakey: {},
  gpt: []
}
let nosafetrip = fs.readFileSync("nosafetrips.txt").toString().split("\n").map(trip_pass=>{return trip_pass.trim().split(" ")})
function ChatGPT(message,hc) {
  let gpturl = getRandomItemFromArray(config.gpt);
  let userid = getInfo(hc.nick).userid;
  let messages = []
  let inittext = "**@" + hc.nick + "** "
  if (!gptuserid[userid]) {
    inittext += "*这是新的上下文，此上下文3分钟后销毁* "
    setTimeout(()=>{
      delete gptuserid[userid];
    },3*1000*60)
    gptuserid[userid] = [];
  }
  inittext += "\n";
  gptuserid[userid].push({
    role: 'user',
    content: message
  })
  gptuserid[userid].forEach(msg=>{
    messages.push(msg);
  })
  messages.push({
    role: "system", 
    content: `你叫whoami，是一个MelonCmd制作的AI，要查看你的帮助，用户可以发送!help，你现在在Hack.Chat（简称HC）聊天室的lounge（简称lo）频道，在线用户（按逗号分隔）：${nicks.join(", ")}`
  })
  let busers = [...users];
  busers=busers.map(u=>{
    return {
      nick:u.nick,
      trip:u.trip,
      hash:u.hash,
      color:u.color,
      level:u.level,
      uType:u.uType
    }
  })
  messages.push({
    role: "system",
    content: `在线列表（nick为用户名，trip为识别码，hash为哈希，color为颜色，level为等级，uType为用户类型，其他的都不重要，这些信息都是公开的）：\n${busers.map(a=>{return JSON.stringify(a)}).join("\n")}`
  })
  messages.push({
    role: "system",
    content: `你可以称这个向你提问的用户为${hc.nick}`
  })
  messages.push({
    role: "system",
    content: `最近的20条历史记录：\n${gpthis.get().map(a=>{return JSON.stringify(a)}).join("\n")}`
  })
  messages.push({
    role: "system",
    content: `请使用中文回复用户，只发送你的Answer给用户，不要发送Understanding the Question或其他内容，你的语言要简短，你可以让用户去 https://hcwiki.gitbook.io/ 了解有关这里（Hack.Chat（简称HC）聊天室的lounge（简称lo）频道）和部分其他聊天室的信息和历史，你的消息长度尽量不要超过 1152 字符`
  })
  let customId = Math.floor(Math.random()*100000).toString()
  _send({
    cmd: 'chat',
    text: `***期待模型：${gpturl[2]}*** ${inittext}请稍后，我正在思考你的问题...`,
    customId: customId
  })
  GPT(gpturl,messages,  
  (text, data)=>{
    gptuserid[userid].push({
      role: 'assistant',
      content: text.replace("You.com","ChatGPT")
    });
    _send({
      cmd: 'updateMessage',  
      mode: 'overwrite',
      customId: customId,
      text: `***实际模型：${data.model}*** ${inittext}${text.replace(/You.com/g,"ChatGPT")}`
    });
  },
  (err,json)=>{
    _send({
      cmd: 'updateMessage',  
      mode: 'overwrite',
      customId: customId,
      text: inittext + "==[出错了，请等一会再试一次]=="
    });
    _send({
      cmd: 'updateMessage',  
      mode: 'overwrite',
      customId: customId,
      text: "[出错了，请等一会再试一次]\n```\n" + JSON.stringify(json)
    });
  })
}
function GPT(gpturl,messages,doneback,errback) {
  fetch(gpturl[1]+"v1/chat/completions", {
    "headers": {
      "accept": "application/json, text/event-stream",
      "accept-language": "zh-CN,zh;q=0.9",
      "authorization": "Bearer " + gpturl[0],
      "content-type": "application/json",
      "model": "gpt-4-turbo",
    },
    "body": JSON.stringify({
      messages: messages,
      stream: false,
      model: gpturl[2],
      temperature:0.5,
      presence_penalty:0,
      frequency_penalty:0,
      top_p:1
    }),
    "method": "POST",
  })
  .then(response => {
    return response.json();
  })
  .then(json => {
    try {
      doneback(json.choices[0].message.content, json);
    } catch (err) {
      errback(err.message,json);
    }
  })
  .catch(error => {
    errback(error.message,false);
  });
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
var gpthis = new LimitedArray(20)
var kickreasons = new LimitedArray(5)
//踢出
var waitkick = []
function _kick(kusers,reason="未知") {
  //首先筛选出在线而且是不在等待踢出列表的用户
  let kusersb = kusers.filter(user=>{
    return !waitkick.includes(user) && nicks.includes(user)
  })
  if (kusersb.length == 0) return;
  //然后，把筛选后的用户推入到等待踢出列表，避免反复踢出
  kusersb.forEach((user)=>{waitkick.push(user)})
  //踢出用户
  kickreasons.push(`踢出 ${kusersb.join(", ")} （操作来自：${reason}）`)
  _send({
    cmd: 'whisper',
    nick: 'mbot',
    text: `kick ${kusersb.join(" ")}`
  },true)
}
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
        userInfo.age = value;
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
  } catch (err) {}
}
function saveMsg() {
  try {
    const jsonData = JSON.stringify(messages)//, null, 2);
    fs.writeFileSync('./msg.json', jsonData, 'utf8');
  } catch (err) {}
}
function saveConfig() {
  try {
    const jsonData = JSON.stringify(config, null, 2);
    fs.writeFileSync('./config.json', jsonData, 'utf8');
  } catch (err) {}
}

function saveUser() {
  try {
    const jsonData = JSON.stringify(userList, null, 2);
    fs.writeFileSync('./user.json', jsonData, 'utf8');
  } catch (err) {}
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
        back(`\n### 命令列表\n \`${sortedCommands.join("`, `")}\`\n**部分**开源在 https://github.com/cmd1152/whoami`)
      }
    },
    help: '显示帮助，如果传入一个命令，将显示这个命令的详细介绍，否则显示帮助列表',
    useage: '[命令]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 500
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
      if (text && /^[a-zA-Z0-9_]{1,24}$/.test(to)) {
        messages.push({
          "l":"n",
          "t":to,
          "n":`${formatTime()} ${userinfo.trip?"["+userinfo.trip+"]":""}${userinfo.nick}：\n>${text.join(" ").split("\n").join("\n>")}\n`,
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
      if (text && /^[a-zA-Z0-9+/]{6}$/.test(to)) {
        messages.push({
          "l":"t",
          "t":to,
          "n":`${formatTime()} ${userinfo.trip?"["+userinfo.trip+"]":""}${userinfo.nick}：\n>${text.join(" ").split("\n").join("\n>")}\n`,
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
      if (text && /^[a-zA-Z0-9+/]{15}$/.test(to)) {
        messages.push({
          "l":"h",
          "t":to,
          "n":`${formatTime()} ${userinfo.trip?"["+userinfo.trip+"]":""}${userinfo.nick}：\n>${text.join(" ").split("\n").join("\n>")}\n`,
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
        args[0] = userinfo.nick;
      }
      if (nicks_.includes(args[0].replace("@",""))) {
        let userinf_ = getInfo(args[0].replace("@",""),true)
        let othern = "用户未设定，应该是默认的 6684e1（普通用户）"
        if (userinf_.uType == "mod") othern = "用户未设定，应该是默认的 1fad83（管理员）"
        if (userinf_.uType == "admin") othern = "用户未设定，应该是默认的 d73737（站长）"
        if (args[0].replace("@","") == "jeb_") {
          othern = "用户未设定，应该是默认的 rainbow（jeb_名称颜色彩蛋）"
          userinf_.color = userinf_.color + "（但是可能显示是 rainbow，因为jeb_名称颜色彩蛋优先级高）"
        }
        back(`### ${args[0].replace("@","")} 的信息：\n识别码：${userinf_.trip}\n用户类型：${userinf_.uType}\nhash：${userinf_.hash}\n等级：${userinf_.level}\n用户标识符：${userinf_.userid}\n名称颜色：${userinf_.color||othern}\n\nTA最后说了${lastsay[args[0].replace("@","")]?"："+lastsay[args[0].replace("@","")].substring(0,50)+`${lastsay[args[0].replace("@","")].length>50?"...":""}`:"什么我也不知道 awa"}`)
      } else back(`我没有记录到这个用户`)
    },
    help: '显示一个用户的信息',
    useage: '<用户名称>',
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
      if (!config.r18 && args.join(" ").indexOf("[NSFW]")!=-1) {
        back('NSFW在配置文件中禁用')
        return;
      }
      let ses = []
      if (args.join(" ").replace("[NSFW]","")) ses.push("tag="+encodeURIComponent(args.join(" ")).replace("[NSFW]",""))
      if (args.join(" ").indexOf("[NSFW]") != -1) ses.push("r18=1")
      axios.get(`https://api.lolicon.app/setu/v2${ses.length > 0?"?" + ses.join("&"):""}`)
      .then((_4w4)=>{
        let _404 = _4w4.data.data
        _404 = _404[0]
        if (!_404) return back("别要求那么严格嘛...")
        let etags = _404.tags.filter((tag)=>{return (args.join(" ").indexOf("[NSFW]")!=-1 || !(/[乳魅内尻屁胸]/.test(tag)))})
        back(`![](${_404.urls.original})\n[${_404.title}](https://www.pixiv.net/artworks/${_404.pid}) —— ${_404.author}\n标签：${etags.join(", ")}`)
      })
    },
    help: '随机找张瑟图，参考自awa_ya，在标签内添加`[NSFW]`启用r18，记住一定要加中括号，而且是英文的！！！',
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
  },
  kick: {
    run: (args,obj,userinfo,whisper,back) => {
      let kicklist = []
      let info = []
      args = args.join(" ").match(/[a-zA-Z0-9_]{1,24}/g)
      if (!args) {
        back("你6")
        return;
      }
      args = args.filter(a=>{return a})
      args = [...new Set(args)]
      args.forEach(arg=>{
        if (arg == myNick) {
          info.push(`踢出 ${arg} 失败：不想自裁`)
        } else if (getInfo(arg)) {
          if (config.modtrip.includes(userinfo.trip) && !config.modtrip.includes(getInfo(arg).trip) && getInfo(arg).uType != "mod") {
            kicklist.push(arg)
          } else if (getInfo(arg).trip == userinfo.trip && getInfo(arg).uType != "mod") {
            if (getInfo(arg).trip) {
              kicklist.push(arg)
            } else if (arg == userinfo.nick) {
              kicklist.push(arg)
            } else {
              info.push(`踢出 ${arg} 失败：你不能证明他是你，他没有识别码`)
            }
          } else if (getInfo(arg).uType == "mod") {
            info.push(`踢出 ${args} 失败：我何德何能`)
          } else {
            if (config.modtrip.includes(userinfo.trip)) {
              info.push(`踢出 ${arg} 失败：你只能踢出同识别码的授权用户`)
            } else info.push(`踢出 ${arg} 失败：你只能踢出同识别码的人`)
          }
        } else info.push(`踢出 ${arg} 失败：未找到`)
      })
      if (kicklist.length > 0) {
        _kick(kicklist,`[${userinfo.trip}]${userinfo.nick} ${whisper?"私信":""}使用踢出命令踢出`)
      }
      if (info.length > 0) {
        if (info.join("\n").length > 30) {
          let notepath = `message${Math.floor(Math.random()*99999999999999999-10000000000000000)+10000000000000000}`
          notems.set(notepath,info.join("\n"))
            .then(()=>{
              back(`在踢出一个或多个用户时可能遇到大量问题，[点此查看](https://note.ms/${notepath})`)
            })
            .catch(()=>{
              back(`在踢出一个或多个用户时可能遇到大量问题，但是不能正确向您报告问题`)
            })
        } else back(`在踢出一个或多个用户时可能遇到问题\n${info.join("\n")}`)
      }
    },
    help: '踢出一个或多个用户，非授权用户只能踢出相同识别码的人',
    useage: '[用户1] <用户2> <用户3> <...>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  ban: {
    run: (args,obj,userinfo,whisper,back) => {
      if (args[0]) {
        if (['nick','hash','trip','text'].includes(args[0])) { //我感觉我是天才
          //config.bans[args[0]] // 我感觉我是天才
          if (args[1]) {
            let igm = args[2]?/^[igmusdy]*$/.test(args[2]):true;
            if (igm) {
              if (config.bans[args[0]].some(item => item[0] == args[1] && item[1] == args[2])) {
                config.bans[args[0]] = config.bans[args[0]].filter(item => !(item[0] == args[1] && item[1] == args[2]));
                back(`删除成功`)
              } else {
                config.bans[args[0]].push([args[1],args[2]])
                back(`添加成功`)
              }
              saveConfig()
            } else back("无效正则表达式标志字符串")
          } else {
            if (config.bans[args[0]].length > 0) {
              back(`${args[0]} 封禁正则表达式列表：\`${config.bans[args[0]].join("`, `")}\``)
            } else back(`${args[0]} 封禁正则表达式列表还是空的`)
          }
        } else back("哥，不是这样子用")
      } else back("哥，看下帮助，这个命令有点小难")
    },
    help: '按正则表达式封禁一个名称、识别码、用户名称，不加正则表达式为列出，再添加一次已经添加的正则表达式为删除',
    useage: '[nick/trip/hash/text] <正则表达式> <正则表达式标志字符串>',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  setrl: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!args[0]) {
        back(`踢出泛值：${config.rl[0]} 消息起步：${config.rl[1]} 消息每个字额外添加：${config.rl[2]} 每秒减少：${config.rl[3]}`)
        return;
      }
      if (args[3]) {
        function testAllInt(ints) {
          let ret = true
          ints.forEach(aint=>{
            let pint = parseInt(aint)
            if (pint < 0 || pint > 100) ret = false
          })
          return ret
        }
        if (testAllInt(args.slice(0, 4))) {
          if (parseInt(args[0]) < parseInt(args[1]) + parseInt(args[2]) * 20) {
            back("过于严格")
          } else {
            config.rl=args.slice(0, 4).map(a=>{return parseInt(a)})
            saveConfig()
            back("成功修改")
          }
        } else back("参数不合法")
      } else back("哥，看下帮助，这个命令有点小难")
    },
    help: '设置刷屏检测，默认是 `100 30 1 10`，4个值都只能是0到100的数值，不设置数值为查看',
    useage: '<踢出泛值（总rl值超过这个数就踢）> <每个消息起步rl> <每个消息每个字的rl> <每秒减少的rl>',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  whykick: {
    run: (args,obj,userinfo,whisper,back) => {
      back(`最后5条踢出操作：\n` + kickreasons.get().join("\n"))
    },
    help: '查看最后5条踢出操作的原因',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  whoami: {
    run: (args,obj,userinfo,whisper,back) => {
      function formatTimeDifference(timestamp) {
        const milliseconds = Date.now() - timestamp;
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        const formatNumber = (num) => {
          return num.toString().padStart(2, '0');
        };

        return `${years ? years + " 年 " : ''}${months ? formatNumber(months % 12) + " 月 " : ''}${days ? formatNumber(days % 30) + " 天 " : ''}${hours ? formatNumber(hours % 24) + " 时 " : ''}${minutes ? formatNumber(minutes % 60) + " 分 " : ''}${seconds ? formatNumber(seconds % 60) : '0'} 秒`;
      }
      back(`我来到这个世界上已经 ${formatTimeDifference(1712749911312)} 了，还请多多关照\n` + getRandomItemFromArray([
        "我不知道为什么我在战乱的时候出生，谁不想出生在一个和平年代",
        "你为什么看起来那么悲伤，请问您最近有遇到什么烦心事吗",
        "世间繁华，不过大梦一场",
        "你好，勇士，你是这里的一个新希望",
        "你还在迷茫吗？是做梦中的王子，还是做现实中的勇士？",
        "为了将你们永远留在这，人死后灵魂依旧飘荡，您的发言将会被用于制作LLM",
        "我不希望你们离去，我会参考您的所有发言，然后制作为LLM",
        "谢谢"
      ]))
    },
    help: '查看本机器人的信息',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  "2fa": {
    run: (args,obj,userinfo,whisper,back) => {
      if (!whisper) return back("请私信调用")
      if (!userinfo.trip) return back("你识别码没了？")
      let secretKey = _2fa.getKey("whoami",userinfo.trip)
      _2fa.qrcode(secretKey) 
        .then((noteurl)=>{
          if (noteurl) {
            config._2fakey[userinfo.trip] = secretKey
            back(`2fa成功创建，这是你唯一一次看见此notems二维码地址，请使用 Authenticator 扫描他们，如果你不慎丢失，再执行一次这个命令重新生成\n${noteurl}`)
            saveConfig()
          } else back("创建失败")
        })
    },
    help: '为授权用户创建新的2fa验证，这个验证用于在无法使用识别码时证明身份',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  sudo: {
    run: (args,obj,userinfo,whisper,back) => {
      if (!whisper) return back("请私信调用")
      let payload = [...args]
      let _2fatrip = payload.shift()
      let _2faKey = payload.shift()
      if (!_2faKey) return back("参数错误")
      let isTr = false
      for (let k in config._2fakey) {
        if (_2fa.verify(config._2fakey[k],_2faKey) && k == _2fatrip && config.modtrip.includes(k)) isTr = k
      }
      if (isTr) {
        sudoid[userinfo.userid] = true
        back("成功提权，但重进或者改名就没，部分命令用不了，kick可以用ban再unban代替")
        _send({cmd:'emote',text:`>\n[${isTr}]${userinfo.nick} 成功提权`})
      } else back("2fa代码或识别码无效")
    },
    help: '通过2fa验证证明你的授权身份，成功后你被直接提升为授权用户（重进或者改名就没）',
    useage: '[绑定2fa的识别码] [2fa代码]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  del2fa: {
    run: (args,obj,userinfo,whisper,back) => {
      if (args[0]) return back("参数错误")
      delete config._2fakey[userinfo.trip]
      back("已尝试删除，删没删成功我不道")
    },
    help: '强制删除一个识别码的2fa',
    useage: '[绑定2fa的识别码]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  lock: {
    run: (args,obj,userinfo,whisper,back) => {
      _send({
        cmd: 'chat',
        text: '.m lockroom'
      }, true)
    },
    help: '锁房',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  unlock: {
    run: (args,obj,userinfo,whisper,back) => {
      _send({
        cmd: 'chat',
        text: '.m unlockroom'
      }, true)
    },
    help: '取消锁房',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  encap: {
    run: (args,obj,userinfo,whisper,back) => {
      _send({
        cmd: 'chat',
        text: '.m enablecap'
      }, true)
    },
    help: '开启验证码',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  discap: {
    run: (args,obj,userinfo,whisper,back) => {
      _send({
        cmd: 'chat',
        text: '.m disablecap'
      }, true)
    },
    help: '关闭验证码',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  ping: {
    run: (args,obj,userinfo,whisper,back) => {
      back(`延迟：${(new Date().getTime() - obj.time).toString().replace("-","")}ms`)
    },
    help: '显示bot到服务器的延迟',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000
  },
  stats: {
    run: (args,obj,userinfo,whisper,back) => {
      if (whisper) return back('不兼容私信')
      back('请稍后')
      _send({cmd:'chat',text:'/stats'})
    },
    help: '显示HC的详细信息（比直接用 /stats 更详细）',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 10000
  }
}

function testRegExps(RegExps, content) {
  for (let expression of RegExps) {
    try {
      let regex = new RegExp(expression[0])
      if (expression[1]) regex = new RegExp(expression[0], expression[1])
      if (regex.test(content)) return true;
    } catch (e) {}
  }
  return false;
}
//封禁用户检查
function checkBan() {
  let kickuser = []
  users.forEach((user)=>{
    if (
      testRegExps(config.bans.nick,user.nick) ||
      testRegExps(config.bans.trip,user.trip) ||
      testRegExps(config.bans.hash,user.hash)
    ) {
      if (!config.modtrip.includes(user.trip) && user.uType != "mod") kickuser.push(user.nick)
    }
  })
  if (kickuser.length > 0) {
    _kick(kickuser,`这些用户已被封禁`)
  }
}
setInterval(checkBan,1000)
//用户spam循环
setInterval(()=>{
  for (let key in spamhash) {
    if (typeof spamhash[key] === 'number') {
      spamhash[key] -= parseInt(config.rl[3]);
      if (spamhash[key] < 0) spamhash[key] = 0
    }
  }
},1000)

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
    channel: 'lounge',
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
  //setTimeout(sendHistory,getRandomNumber(600000,1000000))
}
function getInfo(usernick,c=false) {
  return c?users_.find(user=>{return user.nick == usernick}):users.find(user=>{return user.nick == usernick})
}
function isRL(cmd) {
  if (cmd) {
    if (!cmd.nowRL) {
      cmd.nowRL = new Date().getTime()
      return false
    }
    if (cmd.nowRL + cmd.rl < new Date().getTime()) {
      cmd.nowRL = new Date().getTime()
      return false;
    }
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
    if (hc.channel != "lounge" && hc.channel != "loungee") {
      setTimeout(()=>{
        ws.close()
      },3000)
    }
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
  //加入检查
  if (hc.cmd == "warn" || hc.cmd == "info") {
    //3秒后还没有onlineSet就是死了
    if (!joined) {
      setTimeout(()=>{
        if (!joined) {
          setTimeout(()=>{
            ws.close()         //草，什么死人嵌套
          },65000)
        }
      },3000)
    }
  }
  if (hc.cmd == "onlineSet") joined = true

  //users和nicks变量支持
  if (hc.cmd == "onlineSet") {
    users = hc.users
    nicks = hc.nicks
    hc.users.forEach(user=>{ users_.push(user) });
    hc.nicks.forEach(nick=>{ nicks_.push(nick) });
  }
  if (hc.cmd == "onlineAdd") {
    let payload = {...hc}
    delete payload.cmd
    users.push(payload)
    nicks.push(hc.nick)
    users_ = users_.filter(function (item) {
      return item.nick !== hc.nick;
    });
    users_.push(payload)
    nicks_.push(hc.nick)
    nicks=[...new Set(nicks)]
  }
  if (hc.cmd == "onlineRemove") {
    users = users.filter(function (item) {
      return item.nick !== hc.nick;
    });
    let index = nicks.indexOf(hc.nick);
    if (index !== -1) nicks.splice(index, 1);
    nicks=[...new Set(nicks)]
  }
  if (hc.cmd == "updateUser") {
    let payload = {...hc}
    delete payload.cmd
    users = users.filter(function (item) {
      return item.nick !== hc.nick;
    });
    users.push(payload)

    users_ = users_.filter(function (item) {
      return item.nick !== hc.nick;
    });
    users_.push(payload)
  }


  //封禁用户支持
  if (hc.cmd == "onlineAdd" || hc.cmd == "onlineSet") checkBan()
  //屏蔽词支持
  if (hc.text) {
    if (testRegExps(config.bans.text,hc.text) && !config.modtrip.includes(hc.trip)) {
      _kick([`${hc.nick?hc.nick:hc.from}`],"屏蔽词")
    }
  }
  //刷屏检查
  if ((hc.nick || hc.from) && hc.text) {
    let checkinfo = getInfo(hc.nick?hc.nick:hc.from)
    if (checkinfo) {
      checkinfo = checkinfo.hash
      if (!spamhash[checkinfo]) spamhash[checkinfo] = 0
      spamhash[checkinfo] += config.rl[1] + hc.text.length * config.rl[2]
      if (spamhash[checkinfo] > config.rl[0]) {
        spamhash[checkinfo] = 0
        if (!config.modtrip.includes(hc.trip) && getInfo(hc.nick?hc.nick:hc.from).uType != "mod") {
          _kick([hc.nick?hc.nick:hc.from],`刷屏检测`)
        }
      }
    }
  }
  if (hc.cmd == "onlineRemove" && hc.nick) {
    if (getInfo(hc.nick)) delete spamhash[getInfo(hc.nick).hash] //这几个判断不是杞人忧天，你永远不知道hc会返回什么
  }
  //踢出
  if (hc.cmd == "info" && hc.text.startsWith("Kicked ")) { //从等待踢出队列删除已经踢出的用户
    let index = waitkick.indexOf(hc.text.substring(7));
    if (index !== -1) waitkick.splice(index, 1);
  }
  if (hc.cmd == "onlineRemove" && hc.nick) {
    let index = waitkick.indexOf(hc.nick); //从等待队列删除已退出的用户，防止残留
    if (index !== -1) waitkick.splice(index, 1);
  }
  //sudo删除处理
  if (hc.cmd == "onlineRemove" && hc.nick) {
    if (getInfo(hc.nick)) delete sudoid[getInfo(hc.nick).userid]
  }
  //gpt历史记录
  if (hc.cmd == "chat" || hc.cmd == "emote" || hc.cmd == "updateMessage") {
    gpthis.push(hc);
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


  //屏蔽
  if (nicks.includes(hc.nick) && getInfo(hc.nick)) if (config.ignore.hash.includes(getInfo(hc.nick).hash) || config.ignore.nick.includes(hc.nick)) return;
  if (nicks.includes(hc.from) && getInfo(hc.from)) if (config.ignore.hash.includes(getInfo(hc.from).hash) || config.ignore.nick.includes(hc.from)) return;

  //弱密码警告
  if (hc.cmd == "onlineAdd" && hc.trip) {
    for (let key in nosafetrip) {
      if (nosafetrip[key][0] == hc.trip) {
        _send({
          cmd: 'whisper',
          nick: hc.nick,
          text: `嘿，你的识别码密码可能并不安全，请不要使用\`${nosafetrip[key][1]}\`继续当你的密码了，容易泄露被冒充！`
        })
      }
    }
  }

  /* 太吵了

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

  //青云客
  if (hc.cmd == "chat" && hc.text.indexOf("@"+myNick) != -1 && hc.nick != myNick) { 
    let semsg = hc.text.replace("@"+myNick,"").trim()
    qyk(semsg)
  }

  */
  //ChatGPT
  if (hc.cmd == "chat" && hc.text.indexOf("@"+myNick) != -1 && hc.nick != myNick && lazysend) {
    let semsg = hc.text.replace("@"+myNick,"").trim()
    ChatGPT(semsg,hc)
  }
  //留言处理
  if (hc.cmd == "chat" && lazysend) {
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

  //stats处理
  if (hc.cmd == "info") {
    let statsinfo = /current-connections: (\d+)\ncurrent-channels: (\d+)\nusers-joined: (\d+)\ninvites-sent: (\d+)\nmessages-sent: (\d+)\nusers-banned: (\d+)\nusers-kicked: (\d+)\nstats-requested: (\d+)\nserver-uptime: (\d+d \d+h \d+m \d+s)/
    if (statsinfo.test(hc.text)) {
      let hcstats = hc.text.match(statsinfo);
      function parseUptimeString(uptimeString) {
        var regex = /(\d+)d (\d+)h (\d+)m (\d+)s/;
        var matches = uptimeString.match(regex);
        var days = parseInt(matches[1]) * 24 * 60 *60 * 1000; // 将天数转换为毫秒
        var hours = parseInt(matches[2]) * 60 * 60 * 1000; // 将小时转换为毫秒
        var minutes = parseInt(matches[3]) * 60 * 1000; // 将分钟转换为毫秒
        var seconds = parseInt(matches[4]) * 1000; // 将秒数转换为毫秒
        return days + hours + minutes + seconds;
      }
      _send({
        cmd:'chat',
        text:`现在有${hcstats[1]}个用户连接到了${hcstats[2]}个频道\n已经有${hcstats[3]}次加入，发送了${hcstats[5]}条消息和${hcstats[4]}次邀请，有${hcstats[7]}个用户被踢，${hcstats[6]}个用户被ban\n服务器启动于 ${new Date(Date.now() - parseUptimeString(hcstats[9]))} （距今${hcstats[9]}）`
      })
    }
  }
  //屎山代码，用了return，必须放最后

  //命令系统
  if (hc.cmd == "chat" && hc.text.startsWith("![")) return;
  if (hc.cmd == "chat" && hc.text.startsWith(cmdstart)) {
    try {
      let cmdargs = hc.text.substring(cmdstart.length).split(" ");
      let cmdname = cmdargs.shift()
      let userlevel = ((sudoid[getInfo(hc.nick).userid] || config.modtrip.includes(hc.trip)) && hc.level < 152)?152:hc.level
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
      let userlevel = ((sudoid[getInfo(hc.from).userid] || config.modtrip.includes(hc.trip)) && hc.level < 152)?152:hc.level
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
ws.onclose=ws.onerror=()=>{
  process.exit(1)
}

process.on('uncaughtException', (err) => {
  console.error(err);
  try {
    _send({
      cmd: 'chat',
      text: coreErr(err.message)
    })
  } catch(e){}
});

function coreErr(error) {
  return getRandomItemFromArray([
    "有些鸟儿是永远关不住的，因为它的每一片羽毛，都沾满了$的光辉",
    "好，明明要因为$而亡的我，正在尝试坚强的活着",
    "$了，你很开心吗？",
    "$？厉害，但是你还是失败了！"
  ]).replace(/\$/,error)
}


//`2fa, ban, del2fa, discap, encap, kick, lock, padd, premove, setrl, sudo, unlock, whykick`.split(", ").forEach(a=>{COMMANDS[a].run=(args,obj,userinfo,whisper,back)=>{back("cmd已经疯了，这个命令无法使用")}})
//_kick=()=>{}