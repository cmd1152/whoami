﻿const websocket = require('ws');
const axios = require('axios');
const notems = require('./notems_fix.js');
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const AbortController = require('abort-controller');

const TurndownService = require('turndown');
const turndownService = new TurndownService();

function getRandomItemFromArray(arr) {
  var randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function searchGPTTool(text, deep = false, science = false) {
  let req = await fetch("https://searchgptool.ai/api/search?q=" + encodeURIComponent(text), {  
    "headers": {
      "content-type": "application/json",
      accept: "text/event-stream"
    },
    "body": JSON.stringify({
      "stream": true,
      "model": "deepseek-chat",
      "mode": deep ? "deep" : "simple",
      "language": "zh",
      "categories": [
        science ? "science" : "general"
      ],
      "engine": "SEARXNG",
      "locally": false,
      "reload": false
    }),
    "method": "POST",
  })
  let reader = req.body.getReader();
  let temp = '';
  let ref = [];
  let answer = '';
  while (true) {
    let { done, value } = await reader.read();
    if (done) break;
    let text = Buffer.from(value).toString();
    temp += text;
  }
  let data = temp.replace("data:","").split("\n\ndata:").map((a)=>{
    let r = JSON.parse(a.trim());
    return r && r.data ? JSON.parse(r.data) : false;
  }).filter(a=>a)
  data.forEach((d)=>{
    if (d.answer) answer += d.answer;
    if (d.context) {
      ref.push({
        url: d.context.url,
        name: d.context.name,
        engine: d.context.engine,
        id: d.context.id
      })
    }
  })
  return {
    answer,
    ref,
    // __data: data
  }
}

function dcer() {
  discap();
  discaper = null;
  config.discaper = false;
  saveConfig();
}

function uler() {
  unlock();
  unlocker = null;
  config.unlocker = false;
  saveConfig();
}


function finWindow(str, windowSize = 100) {

  if (str.length <= windowSize) return false;

  let seen = new Set();

  for (let i = 0; i <= str.length - windowSize; i++) { // What the fuck?
    let window = str.substring(i, i + windowSize); // 移动窗口算法万岁

    if (seen.has(window)) return true;
    seen.add(window);
  }
  return false;
}

function aToMarkDown(html, raw = false) {
  if (raw) html = html.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/g, '$2');
  return turndownService.turndown(html).replace(/<[^>]+>/g,'')
}

async function getHistoryToMonth(month = (new Date().getMonth()+1)) {
  try {
    month = month.toString().padStart(2,'0');
    let req = await axios.get(`https://baike.baidu.com/cms/home/eventsOnHistory/${month}.json`);
    let data = req.data[month];
    let parseObj = {};
    for (let key in data) {
      parseObj[key.replace(month,'')] = data[key];
    }
    return parseObj;
  } catch (e) {
    return {};
  }
}

async function wpSearch(page, lang='zh') {
  try {
    let result = [];
    var params = {
        origin: '*',
        action: "query",
        list: "search",
        srsearch: page,
        format: "json"
    };
    var url = `https://${lang}.wikipedia.org/w/api.php?${new URLSearchParams(params).toString()}`;
    let req = await fetch(url);
    let json = await req.json();
    let data = json.query.search;
    data.splice(3);
    data.forEach((a)=>{
      result.push({
        title: a.title,
        url: `https://${lang}.wikipedia.org/w/index.php?title=${encodeURIComponent(a.title)}`,
        data: aToMarkDown(a.snippet),
        data_length: json.query.searchinfo.totalhits
      });
    });
    return result;
  } catch (e) {
    return false;
  }
}

function setTimeoutTo(func,time) {
  let pTime = new Date(time);
  if (!pTime.getTime()) return;
  return setTimeout(func, Math.max(0, pTime.getTime() - new Date().getTime()));
}

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
function maxBackticks(str) {
  const lines = str.split('\n').map((line) => {
    return line.trim();
  });
  console.log(lines)
  let maxCount = 0;

  lines.forEach((line) => {
    if (line.replace(/\`/g,'') === '') {
      maxCount = Math.max(maxCount, line.trim().length);
    }
  })

  return Math.max(maxCount, 3);
}
function runBrainfuck(code, input = '', maxSteps = 10000) {
    const tape = Array(30000).fill(0);
    let pointer = 0;
    let codePointer = 0;
    let output = '';
    const inputArray = input.split('');
    let inputPointer = 0;
    let steps = 0; // 步骤计数器

    while (codePointer < code.length) {
        if (steps >= maxSteps) { // 检测步骤是否超限
            throw new Error('Execution limit exceeded');
        }
        steps++; // 增加步骤计数

        const command = code[codePointer];
        switch (command) {
            case '>':
                pointer++;
                break;
            case '<':
                pointer--;
                break;
            case '+':
                tape[pointer] = (tape[pointer] + 1) % 256;
                break;
            case '-':
                tape[pointer] = (tape[pointer] - 1 + 256) % 256;
                break;
            case '.':
                output += String.fromCharCode(tape[pointer]);
                break;
            case ',':
                tape[pointer] = inputPointer < inputArray.length ? inputArray[inputPointer++].charCodeAt(0) : 0;
                break;
            case '[':
                if (tape[pointer] === 0) {
                    let openBrackets = 1;
                    while (openBrackets > 0) {
                        codePointer++;
                        if (code[codePointer] === '[') openBrackets++;
                        if (code[codePointer] === ']') openBrackets--;
                    }
                }
                break;
            case ']':
                if (tape[pointer] !== 0) {
                    let closeBrackets = 1;
                    while (closeBrackets > 0) {
                        codePointer--;
                        if (code[codePointer] === '[') closeBrackets--;
                        if (code[codePointer] === ']') closeBrackets++;
                    }
                }
                break;
        }
        codePointer++;
    }

    return output;
}


function findAssistantContent(obj) {
    let results = [];

    function search(obj) {
        if (Array.isArray(obj)) {
            obj.forEach(item => search(item));
        } else if (typeof obj === 'object' && obj !== null) {
            if (obj.content) {
                results.push(obj.content);
            }
            for (let key in obj) {
                search(obj[key]);
            }
        }
    }

    search(obj);
    return results;
}
function parseStream(str) {
  let jsons = str
    .split("\n")
    .filter((s)=>{
      return s.startsWith("data: {")
    })
    .map((s)=>{
      return JSON.parse(s.replace("data: ",""))
    })
  if (Array.isArray(jsons[0])) return {}

  let model = jsons[0].model;
  let content = jsons
    .map((s)=>{
      return findAssistantContent(s)
    })
    .join("");
  return {
    model,
    message: { role: 'assistant', content }
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

var nicks = [],users = [],nicks_ = [],users = [],checkChannel = false
var finspam = {};
var cmdstart = ["/","!"];

function getshowcmdstart(cmdstart) {
  if (cmdstart == "/") return '//';
  return cmdstart
}
function iscmdstart(text) {
  return cmdstart.find((cs)=>{ return text.startsWith(cs)})
}
var cansend = true
//lookup读写支持
let lookup = []
let waitsend = []
let messages = []
let userList = []
let spamhash = {}
let gptuserid = {}
let afklist = {}
let sudoid = {}
let joined = false
let blacks = []
let unlocker = null;
let discaper = null;
let welc = {};
var users_ = [] ,nicks = []//持久化users、nicks
var sessions = {};
let config = { //默认数据结构
  admin: "cmdTV+",
  modtrip: [],
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
    text: [],
    color: []
  },
  rl: [100,20,0,10],
  gpt: [],
  allowgpt: [],
  useproxy: false,
  proxy: '',
  ads: [],
  fin: true,
  white: []
}
function getLevel(userinfo) {
  if (isAdmin(userinfo)) return 999999999999;
  if (userinfo.level < 152 && config.modtrip.includes(userinfo.trip)) return 152;
  return userinfo.level;
}
function isAdmin(userinfo) {
  return userinfo.trip == config.admin
}
function isWhite(userinfo) {
  return config.white.includes(userinfo.trip) || userinfo.trip == config.admin
}
let nosafetrip = fs.readFileSync("nosafetrips.txt").toString().split("\n").map(trip_pass=>{return trip_pass.trim().split(" ")})
async function ChatGPT(message,hc) {
  let gpturl = getRandomItemFromArray(config.gpt);
  if (!gpturl) {
    _send({
      cmd: 'chat',
      text: `¯\\\\\\_(ツ)\\_/¯ 我没api了`,
    });
    return;
  }
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
  let puro = {
    role: 'user',
    content: message
  }
  messages.push({
    role: "user",
    content: `你叫whoami，一个MelonCmd制作的机器人，我要查看你的帮助可以发送!help，你现在在Hack.Chat（简称HC）聊天室的lounge（简称lo）频道，你的语言要简短，我叫 ${hc.nick} ，下面是我公开的信息（nick名称、hash哈希、trip识别码、level用户等级、uType用户类型、color用户名颜色、userid用户标识符）：
${JSON.stringify(getInfo(hc.nick),null,2)}`
  })
  messages.push({
    role: 'assistant',
    content: '好的，我了解了'
  })
  gptuserid[userid].forEach(msg=>{
    messages.push(msg);
  })
  messages.push(puro);
  let customId = Math.floor(Math.random()*100000).toString()
  _send({
    cmd: 'chat',
    text: `***期待模型：${gpturl[2]}*** ${inittext}Thinking...`,
    customId: customId
  })
/*
  let odata = await GPT(gpturl,[
    {
      role: "system",
      content: `请判断用户的prompt是否需要读取聊天室在线列表、读取历史记录、使用搜索引擎，你的输出必须是由下面选项组成的：
user：需要读取完整的在线列表（包括用户信息：nick名称、hash哈希、trip识别码、level用户等级、uType用户类型、color用户名颜色、userid用户标识符）
nick：只需要读取在线用户的名称
history：需要读取最近20条历史记录
search：需要使用搜索引擎


你的返回必须是一个或多个以换行分隔的json，json的格式是 {"cmd":"选项名称"}

比如需要搜索 hackchat，对应的json就是 {"cmd":"search","word":"hackchat"}
如果用户的内容需要读取在线列表完成，你需要返回 {"cmd":"user"} 或者 {"cmd":"nick"}
如果用户的内容需要读取聊天室历史记录完成，你需要返回{"cmd":"history"}

如果用户的内容需要同时读取历史记录和使用搜索引擎搜索 hackchat，你需要返回这样子格式的
\`\`\`
{"cmd":"history"}
{"cmd":"search","word":"hackchat"}
\`\`\`

你的返回只能是一行或多行json，不需要使用代码块包裹，否则你会被销毁
`
    },
  {
    role: 'user',
    content: message
  }
  ]);
  if (odata.ok) {
    try {
      let jsons = odata.content.split("\n").map((a)=>{return JSON.parse(a.trim())})
      _send({
        cmd: 'updateMessage',  
        mode: 'overwrite',
        customId: customId,
        text: `***解析模型：${odata.model || "whoami内核"}*** ${inittext}请稍后，正在处理你的问题...`
      }); 
      async function nextjson() {
        let json = jsons.shift();     
        if (!json) {     
          let data = await GPT(gpturl,messages);
          if (data.ok) {
            gptuserid[userid].push(puro);
            gptuserid[userid].push({
              role: 'assistant',
              content: data.content
            });
          }
          _send({
            cmd: 'updateMessage',  
            mode: 'overwrite',
            customId: customId,
            text: `***实际模型：${data.model || "whoami内核"}*** ${inittext}${data.content}`
          }); 
          return;
        }
        switch(json.cmd) {
          case 'user':
            messages.push({
              role: 'system',
              content: `在线用户列表（包括用户信息：nick名称、hash哈希、trip识别码、level用户等级、uType用户类型、color用户名颜色、userid用户标识符）这些都是公开的：
${users.map((user)=>{return JSON.stringify(user)}).join("\n")}`
            })
            break;
          case 'nick':
            messages.push({
              role: 'system',
              content: `在线用户列表（逗号分隔）：${nicks.join(", ")}`
            })
            break;
          case 'history':
            messages.push({
              role: 'system',
              content: `最近的20条历史记录：
gpthis.get().map((his)=>{return JSON.stringify(his)})`
            })
            break;
          case 'search':
            let seareq = await fetch(`https://cn.bing.com/search?q=${encodeURIComponent(json.word)}&ensearch=1`);
            let $ = cheerio.load(await seareq.text());
            let data = $('#b_content').text();
            let searegex = /(.+)\n(https?:\/\/\S+)\n(.+?)\n\n/g;
            let sd = data.replace(searegex, "[$1]($2)\n$3\n\n").substring(0,3000);
            console.log(sd)
            messages.push({
              role: 'system',
              content: `关键词 \`${json.word}\` 的搜索结果：\n${sd}`
            })
            break;
          default:
        }
        nextjson()
      }
      nextjson()
    } catch (e) {
      console.error(e)
      _send({
        cmd: 'updateMessage',  
        mode: 'overwrite',
        customId: customId,
        text: `***实际模型：whoami内核*** ${inittext}无法理解你的问题，请重试\n${e.message||e||"Unknown Error"}`
      });
      return;
    }
  } else {
    _send({
      cmd: 'updateMessage',  
      mode: 'overwrite',
      customId: customId,
      text: `***实际模型：whoami内核*** ${inittext}无法理解你的问题，请重试\n${odata.content}`
    });
    return;
  }*/

          let data = await GPT(gpturl,messages);
          if (data.ok) {
            gptuserid[userid].push(puro);
            gptuserid[userid].push({
              role: 'assistant',
              content: data.content
            });
          }
          _send({
            cmd: 'updateMessage',  
            mode: 'overwrite',
            customId: customId,
            text: `***实际模型：${data.model || "whoami内核"}*** ${inittext}${data.content}`
          }); 
}

function isJSONString(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}


async function GPT(gpturl,messages,retry=0) {
  try {
    let controller = new AbortController();
    let timeout = setTimeout(() => {
      controller.abort();
    }, 60000);
    let gptreq = await fetch(gpturl[1]+"v1/chat/completions", {
      "headers": {
        "accept": "application/json, text/event-stream",
        "authorization": "Bearer " + gpturl[0],
        "content-type": "application/json",
        "model": gpturl[2]
      },
      "body": JSON.stringify({
        messages: messages,
        stream: true,
        model: gpturl[2],
        temperature:0.5,
        presence_penalty:0,
        frequency_penalty:0,
        top_p:1
      }),
      "method": "POST",
      signal: controller.signal
    })
    clearTimeout(timeout);
    let gptdata = parseStream(await gptreq.text());
    backttt = findAssistantContent(gptdata) || `无法找到OpenAI的答复：\n\`\`\`\n${JSON.stringify(gptdata)}`;
    if (findAssistantContent(gptdata)) {
      return {
        ok: true,
        content: backttt,
        model: gptdata.model
      }
    } else {
      if (retry >= 3) {
        return {
          ok: false,
          content: `多次尝试均失败：\n${backttt}`
        }
      }
      await sleep(1000);
      return await GPT(getRandomItemFromArray(config.gpt),messages,retry+1)
    }
  } catch (e) {
    if (retry >= 3) {
      return {
        ok: false,
        content: `多次尝试均失败：\n${e.message||e||"未知错误"}`
      }
    }
    await sleep(1000);
    return await GPT(getRandomItemFromArray(config.gpt),messages,retry+1)
  }
}
let lastsay = {}

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
  if (!users.find((user)=>{return user.nick=="mbot"&&user.trip=="hACkeR"})) {
    _send({
      cmd: 'emote',
      text: `依赖错误：mbot，请检查此用户是否存在`
    })
    return;
  }
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
function lock() {
  _send({
    cmd: 'chat',
    text: '.m lockroom'
  }, true)
}
function unlock() {
  _send({
    cmd: 'chat',
    text: '.m unlockroom'
  }, true)
}
function encap() {
  _send({
    cmd: 'chat',
    text: '.m enablecap'
  }, true)
}
function discap() {
  _send({
    cmd: 'chat',
    text: '.m disablecap'
  }, true)
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

function saveBlacks() {
  try {
    const jsonData = JSON.stringify(blacks);
    fs.writeFileSync('./blacks.json', jsonData, 'utf8');
  } catch (err) {}
}

function saveAfklist() {
  try {
    const jsonData = JSON.stringify(afklist);
    fs.writeFileSync('./afklist.json', jsonData, 'utf8');
  } catch (err) {}
}

function saveWelc() {
  try {
    const jsonData = JSON.stringify(welc);
    fs.writeFileSync('./welc.json', jsonData, 'utf8');
  } catch (err) {}
}

try {
  welc = require('./welc.json');
} catch (e) {
  console.log("welc数据库无法正常载入，已清空")
  saveWelc()
}

try {
  afklist = require('./afklist.json');
} catch (e) {
  console.log("afklist数据库无法正常载入，已清空")
  saveAfklist()
}

try {
  lookup = require('./lookup.json');
} catch (e) {
  console.log("lookup数据库无法正常载入，已清空")
  saveLookup()
}

try {
  blacks = require('./blacks.json')
} catch (e) {
  console.log("黑历史文件无法正常载入，已清空")
  saveBlacks()
}

try {
  config = {
    ...config,
    ...require('./config.json')
  }
} catch (e) {
  console.log("配置文件无法正常载入，已清空")
}
if (!config.proxy) config.useproxy = false;
saveConfig()

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


var myNick = `whoami`
var oldNick = myNick;
var zombiek = false
if (!config.useproxy) {
  myNick += `_${Math.floor(Math.random()*9999-1000)+1000}`;
  delete config.zombie;
}
if (config.zombie) {
  myNick += `_${Math.floor(Math.random()*9999-1000)+1000}`;
  zombiek = true
}
delete config.zombie;
saveConfig();


function isCanUse(name,ul) {
  if (!COMMANDS[name]) return false;
  if (COMMANDS[name].level > ul) return false;
  if (COMMANDS[name].needproxy && !config.useproxy) return false;
  return true;
}

var COMMANDS = {
 help: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let ul=getLevel(userinfo)
      if (args[0]) {
        if (COMMANDS[args[0]] && ul >= COMMANDS[args[0]].level) {
          back(`\n### ${args[0]}\n${COMMANDS[args[0]].help}\n用法：\`${showcmdstart}${args[0]} ${COMMANDS[args[0]].useage}\``)
        } else back("没有这个命令")
      } else {
        let sortedCommands = Object.keys(COMMANDS).sort((a, b) => a.localeCompare(b)).filter((n)=>{return isCanUse(n,ul)});
        back(`\n### 命令列表\n >\`${sortedCommands.join("`, `")}\`\n\n使用 \`${showcmdstart}help [命令名称]\` 查看详细帮助`)
      }
    },
    help: '显示帮助，如果传入一个命令，将显示这个命令的详细介绍，否则显示帮助列表',
    useage: '[命令]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 500,
  },
  padd: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (!args[0]) {
        back("参数无效")
        return;
      }
      if (/^[a-zA-Z0-9+/]{6}$/.test(args[0])) {
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
    rl: 1000,
  },
  premove: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (!args[0]) {
        back("参数无效")
        return;
      }
      if (/^[a-zA-Z0-9+/]{6}$/.test(args[0])) {
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
    rl: 1000,
  },
  plist: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      back(config.modtrip.length > 0 ? `授权用户：\`${config.modtrip.join("`, `")}\``: "没有任何授权用户")
    },
    help: '列出授权用户识别码列表',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  msg: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
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
    rl: 1000,
  },
  tripmsg: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
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
    rl: 1000,
  },
  hashmsg: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
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
    rl: 1000,
  },
  info: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
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
    rl: 500,
  },
  setu: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
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
    rl: 10000,
  },
  code: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      try {
        let ilove4n0n4me = eval(args.join(" "));
        back(`==_√_== done.\n\`\`\`\n${ilove4n0n4me&&ilove4n0n4me.toString?ilove4n0n4me.toString():ilove4n0n4me}`)
      } catch (e) {
        back(`==_×_== failed.\n\`\`\`\n${e.message}`)
      }
    },
    help: '执行代码',
    useage: '[代码]',
    level: 999999999999, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 10000,
  },
  send: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (!args.join(" ").trim()) return;
      _chat(args.join(" "))
    },
    help: '发点东西',
    useage: '[文本（允许任何字符！空格、换行或者更多！）]',
    level: 999999999999, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 10000,
  },
  kick: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
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
          //
        } else if (getInfo(arg)) {
          if ((config.modtrip.includes(userinfo.trip) || isAdmin(userinfo)) && !(config.modtrip.includes(getInfo(arg).trip) || isAdmin(getInfo(arg))) && getInfo(arg).uType != "mod") {
            kicklist.push(arg)
          } else if (getInfo(arg).trip == userinfo.trip && getInfo(arg).uType != "mod") {
            if (getInfo(arg).trip) {
              kicklist.push(arg)
            } else if (arg == userinfo.nick) {
              kicklist.push(arg)
            }
          } else if (getInfo(arg).uType == "mod") {
            //
          } else if (isAdmin(userinfo)) {
            kicklist.push(arg)
          }
        }
      })
      if (kicklist.length > 0) {
        _kick(kicklist,`[${userinfo.trip}]${userinfo.nick} ${whisper?"私信":""}使用踢出命令踢出`)
      }
    },
    help: '踢出一个或多个用户，非授权用户只能踢出相同识别码的人',
    useage: '[用户1] <用户2> <用户3> <...>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  kickall: {
    run: (args, obj, userinfo, whisper, back, showcmdstart) => {
      let kicklist = [];
      args = args.join(" ").match(/[a-zA-Z0-9_]{1,24}/g);
      if (!args) {
        back("你6");
        return;
      }
      args = args.filter(a => a);
      args = [...new Set(args)];

      while (args.length > 0) {
        let u = args.shift();
        let info = getInfo(u);
        if (info) kicklist.push(u);
        let newUsers = users.filter(user => {
          return info && user && 
                 !kicklist.includes(user.nick) && 
                 (
                   user.hash === info.hash || 
                   (
                     info.trip && 
                     user.trip === info.trip
                   )
                 );
        }).map(u => u.nick);
        args = [...new Set([...args, ...newUsers])];
      }
      kicklist = kicklist.filter((u) => {
        let info = getInfo(u);
        return info.nick !== myNick && (!isWhite(info) || isWhite(info) && info.trip == userinfo.trip) && info.level < 999
      })
      if (kicklist.length > 0) _kick(kicklist, `[${userinfo.trip}]${userinfo.nick} ${whisper ? "私信" : ""}使用踢出所有关联用户命令踢出`);
    },
    help: '踢出一个或多个用户以及和这些用户关联的人',
    useage: '[用户1] <用户2> <用户3> <...>',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  ban: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      args = args.map((arg)=>{
        return arg==""?null:arg;
      })
      if (args[0]) {
        if (['nick','hash','trip','text','color'].includes(args[0])) { //我感觉我是天才
          //config.bans[args[0]] // 我感觉我是天才
          if (args[1]) {
            let igm = args[2]?/^[igmusdy]*$/.test(args[2]):true;
            if (igm) {
              if (config.bans[args[0]].some(item => item[0] == args[1] && item[1] == args[2])) {
                config.bans[args[0]] = config.bans[args[0]].filter(item => !(item[0] == args[1] && item[1] == args[2]));
                back(`删除成功`)
              } else {
                let removetime = Infinity;
                if (parseInt(args[3])) {
                  removetime = parseInt(args[3]) * 1000 + new Date().getTime();
                }
                if (parseInt(args[3]) < 1 || parseInt(args[3]) > 1000*60*60*24*365*10) {
                  removetime = Infinity;
                }
                config.bans[args[0]].push([args[1],args[2],removetime])
                back(`添加成功，此条目${removetime == Infinity?"不会自动删除":`会在${new Date(removetime)}自动删除`}`)
              }
              saveConfig()
            } else back("无效正则表达式标志字符串")
          } else {
            let pt = getRandomItemFromArray(["肆靈肆","錕斤拷","張起靈"])
            if (config.bans[args[0]].length > 0) {
              back(`${args[0]} 封禁正则表达式列表：\`${
                config.bans[args[0]].map(t=>{return t.join(pt)}).join("`, `")
              }\`\n要删除一个条目，请使用\`${showcmdstart}ban ${args[0]} [上面的内容把“${pt}”替换为空格]\``)
            } else back(`${args[0]} 封禁正则表达式列表还是空的`)
          }
        } else back("哥，不是这样子用")
      } else back("哥，看下帮助，这个命令有点小难")
    },
    help: '按正则表达式封禁一个名称、识别码、用户名称、颜色，不加正则表达式为列出，再添加一次已经添加的正则表达式为删除，可以指定时间自动删除，时间超过10年为永久',
    useage: '[nick/trip/hash/text/color] <正则表达式> <正则表达式标志字符串> <时间（秒）>',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  setrl: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
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
    help: '设置刷屏检测，默认是 `100 30 0 10`，4个值都只能是0到100的数值，不设置数值为查看',
    useage: '<踢出泛值（总rl值超过这个数就踢）> <每个消息起步rl> <每个消息每个字的rl> <每秒减少的rl>',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  whykick: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      back(`最后5条踢出操作：\n` + kickreasons.get().join("\n"))
    },
    help: '查看最后5条踢出操作的原因',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  whoami: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
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
    rl: 1000,
  },
  lock: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (whisper) return back("有什么见不得人的");
      if (parseInt(args[0])) {
        clearInterval(unlocker);
        unlocker = setTimeout(uler, 1000 * parseInt(args[0]));
        let time = new Date(new Date().getTime() + 1000 * parseInt(args[0]));
        config.unlocker = time.getTime();
        saveConfig();
        back(`将在 ${time} 后自动解锁`);
      }
      lock()
    },
    help: '锁房',
    useage: '<时间（秒）>',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  unlock: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (whisper) return back("有什么见不得人的")
      clearInterval(unlocker);
      unlocker = null;
      config.unlocker = false;
      saveConfig();
      unlock()
    },
    help: '取消锁房',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  encap: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (whisper) return back("有什么见不得人的")
      if (parseInt(args[0])) {
        clearInterval(discaper);
        discaper = setTimeout(dcer, 1000 * parseInt(args[0]));
        let time = new Date(new Date().getTime() + 1000 * parseInt(args[0]));
        config.discaper = time.getTime();
        saveConfig();
        back(`将在 ${time} 后自动关闭`)
      }
      encap();
    },
    help: '开启验证码',
    useage: '<时间（秒）>',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  discap: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (whisper) return back("有什么见不得人的")
      clearInterval(discaper);
      discaper = null;
      config.discaper = false;
      saveConfig();
      discap();
    },
    help: '关闭验证码',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  ping: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let nowping = (new Date().getTime() - obj.time).toString()
      back(`延迟：${nowping}ms \n${nowping.includes("-")?"我是HackChat服务器（确信）":""}`)
    },
    help: '显示bot到服务器的延迟',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  stats: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (whisper) return back('不兼容私信')
      back('请稍后')
      _send({cmd:'chat',text:'/stats'})
    },
    help: '显示HC的详细信息（比直接用 /stats 更详细）',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 10000,
  },
  gua: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let baa = getRandomItemFromArray(gua).split("\n");
      baa[0] = "# " + baa[0];
      baa[1] = "**" + baa[1] + "**";
      baa[2] = "### " + baa[2];
      back(baa.join("\n"))
    },
    help: '摇卦',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  removeawayawelc: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let awa_ya = getAwaya();
      if (!awa_ya) return back("awa_ya不存在！");
      if (args[0] && /^[a-zA-Z0-9+/]{6}$/.test(args[0])) {
        _send({
          cmd: 'whisper',
          nick: awa_ya,
          text: `0unwe ${args[0]}`
        },true);
        back("删除成功")
      } else back("识别码无效");
    },
    help: '删除一个识别码的欢迎语',
    useage: '[trip]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  afk: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let reason = (args.join(" ")||"AFK").replace(/[\r\n\u2028\u2029]/g," ").trim();
      if (reason.length > 100) return back("离开理由过长，请修改后重试");
      afklist[userinfo.nick] = {
        time: new Date().getTime(),
        do: reason
      }
      back(`好的，你现在因为 ${reason} 暂时离开，在此期间如果有用户AT你，我会告知他们，不要离开太久哦！`);
      saveAfklist();
    },
    help: '暂时离开',
    useage: '<原因>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  list: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (whisper) return back("不能使用私信调用");
      let jchannel = args.join(" ");
      if (typeof jchannel !== 'string') return back("无效频道名称");
      if (jchannel === '') return back("无效频道名称");
      if (jchannel.length > 120) return back("无效频道长度");
      if (!config.useproxy) return back("内部无代理选项");
      getOnline(jchannel)
      .then((list)=>{
        back(`@**${userinfo.nick}** ++${list.length}++ Users Online: \n**==______Hashs______== ==\\_\\_Trip__== ==_NickName_________________==**\n` + 
             `${list.map((u)=>{return `${u.level>=999999?"**":""}&ensp;${u.hash} &ensp; ${u.trip?`${u.trip}`:"-".repeat(6)} &ensp; ${u.nick.replace(/\_/g,"\\_")}${u.level>=999999?"**":""}`}).join("\n")}\n` + 
             `\u200d\n`+
             `The information for Mods is in **bold**`
        )
      })
      .catch((e)=>{
        back(`@**${userinfo.nick}** 无法列出在线用户列表：${e.message||e}`)
      })
    },
    help: '列出一个频道的在线用户',
    useage: '[频道（允许任何字符！空格、换行或者更多！）]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
    needproxy: true,
  },
  sendto: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let datas = [...new Set(args)];
      if (datas.length < 2) return back("参数不足");
      let jchannel = encodeURIComponent(datas.shift());
      datas = datas.join(" ");
      if (typeof jchannel !== 'string') return back("无效频道名称");
      if (jchannel === '') return back("无效频道名称");
      if (jchannel.length > 120) return back("无效频道长度");
      if (!config.useproxy) return back("内部无代理选项");
      if (datas.length > 3000) return back("发送的内容不能超过 3000 字符")
      getOnline(jchannel,`message${getRandomNumber(1000,9999)}`,'',{
        cmd: 'chat',
        text: `**User (${userinfo.hash})${userinfo.trip?`[${userinfo.trip}]`:""}${userinfo.nick} sent a message from ?${obj.channel} :**\n${datas}`
      })
      .then((list)=>{
        back(`@**${userinfo.nick}** 成功发送消息，${list.length} 个用户将看见你的消息`)
      })
      .catch((e)=>{
        back(`@**${userinfo.nick}** 无法发送消息：${e.message||e}`)
      })
    },
    help: '发送一个消息到指定频道',
    useage: '[频道（空格等特殊字符需要 encodeURIComponent）] [内容（允许任何字符！空格、换行或者更多！）]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
    needproxy: true,
  },
  asendto: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let datas = [...new Set(args)];
      if (datas.length < 2) return back("参数不足");
      let jchannel = encodeURIComponent(datas.shift());
      datas = datas.join(" ");
      if (typeof jchannel !== 'string') return back("无效频道名称");
      if (jchannel === '') return back("无效频道名称");
      if (jchannel.length > 120) return back("无效频道长度");
      if (!config.useproxy) return back("内部无代理选项");
      if (datas.length > 3000) return back("发送的内容不能超过 3000 字符")
      getOnline(jchannel,`message${getRandomNumber(1000,9999)}`,'',{
        cmd: 'chat',
        text: `**Anonymous User sent a message from ?${obj.channel} :**\n${datas}`
      })
      .then((list)=>{
        back(`@**${userinfo.nick}** 成功发送消息，${list.length} 个用户将看见你的消息`)
      })
      .catch((e)=>{
        back(`@**${userinfo.nick}** 无法发送消息：${e.message||e}`)
      })
    },
    help: '==匿名==发送一个消息到指定频道',
    useage: '[频道（空格等特殊字符需要 encodeURIComponent）] [内容（允许任何字符！空格、换行或者更多！）]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
    needproxy: true,
  },
  trip: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let passs = args.join(" ");
      if (passs.length == 0) return back("未提供密码");
      if (!config.useproxy) return back("内部无代理选项");
      getOnline(`${getRandomNumber(100000000,999999999)}`,`trip${getRandomNumber(1000,9999)}`,passs,false,true)
      .then((tr)=>{
        back(`@**${userinfo.nick}** 对应的识别码为：${tr.trip||"无识别码"}`)
      })
      .catch((e)=>{
        back(`@**${userinfo.nick}** 无法获取识别码：${e.message||e}`)
      })
    },
    help: '获取这个密码的识别码',
    useage: '[密码（允许任何字符！空格、换行或者更多！）]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
    needproxy: true,
  },
  black: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      back(getRandomItemFromArray(blacks))
    },
    help: '获取黑历史',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
  },
  session: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let jchannel = args.join(" ");
      if (typeof jchannel !== 'string') return back("无效频道名称");
      if (jchannel === '') return back("无效频道名称");
      if (jchannel.length > 120) return back("无效频道长度");
      if (!config.useproxy) return back("内部无代理选项");
      openSession(jchannel)
      .then((tr)=>{
        back(`成功开启新通道id：${tr}`)
      })
      .catch((e)=>{
        back(`无法开启通道：${e.message||e}`)
      })
    },
    help: '创建一个链入其他频道的通道',
    useage: '[频道（允许任何字符！空格、换行或者更多！）]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
    needproxy: true,
  },
  removesession: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let sessionid = args.join(" ");
      if (sessions[sessionid]) {
        if (typeof sessions[sessionid].close == "function") sessions[sessionid].close();
        delete sessions[sessionid];
        back(`已删除目标通道`)
      } else back(`指定的通道未找到`);
    },
    help: '删除一个链入其他频道的通道',
    useage: '[sessionid]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
    needproxy: true,
  },
  sendtosession: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let datas = [...args];
      let sessionid = datas.shift();
      if (sessions[sessionid]) {
        if (typeof sessions[sessionid]._chat == "function") {
          sessions[sessionid]._chat(`**User (${userinfo.hash})${userinfo.trip?`[${userinfo.trip}]`:""}${userinfo.nick} sent a message from ?${obj.channel} :**\n${datas.join(" ")}`);
          back(`发过去了awa`)
        } else back(`指定的通道工作不正常`)
      } else back(`指定的通道未找到`);
    },
    help: '向一个链入其他频道的通道发送消息',
    useage: '[sessionid] [内容（允许任何字符！空格、换行或者更多！）]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
    needproxy: true,
  },
  asendtosession: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let datas = [...args];
      let sessionid = datas.shift();
      if (sessions[sessionid]) {
        if (typeof sessions[sessionid]._chat == "function") {
          sessions[sessionid]._chat(`**Anonymous User sent a message from ?${obj.channel} :**\n${datas.join(" ")}`);
          back(`发过去了awa`)
        } else back(`指定的通道工作不正常`)
      } else back(`指定的通道未找到`);
    },
    help: '向一个链入其他频道的通道发送匿名消息',
    useage: '[sessionid] [内容（允许任何字符！空格、换行或者更多！）]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
    needproxy: true,
  },
  listsession: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (args[0]) {
        if (sessions[args[0]]) {
          back(`### ${args[0]} 的信息：\n 频道：${sessions[args[0]].channel}\n 开启时间：${sessions[args[0]].time}`)
        } else back(`此通道不存在`)
      } else back(`可用的通道id：${Object.keys(sessions).join(", ")}\n使用 \`${showcmdstart}listsession [id]\` 查看详细信息`)
    },
    help: '显示开启的通道信息',
    useage: '<sessionid>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 2000,
    needproxy: true,
  },
/*
  bf: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let bfinput = [...args];
      let bfcode = bfinput.shift();
      if (!bfcode) return back(`请提供代码`);
      new Promise((resolve) => {
        let time = new Date();
        let rt = runBrainfuck(bfcode,bfinput.join(" "));
        back(`耗时：${new Date()-time}ms\n${'`'.repeat(maxBackticks(rt)+1)}\n${rt}`);
        resolve();
      })
      .then(()=>{})
      .catch((e)=>{
        back(`无法执行你的代码：${e.message||e||"未知错误"}`)
      })
    },
    help: '使用BrainFuck运行代码',
    useage: '[BraionFuck Code] <input>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 2000,
  },*/
  today: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      let filtertype = 'event';
      if (['birth','death','all'].includes(args[0])) filtertype = args[0];
      getHistoryToMonth()
      .then((d)=>{
        let todaydata = d[new Date().getDate().toString().padStart(2, '0')];
        let testdata = todaydata
          .filter((d)=>{
            return d.type == filtertype || filtertype == "all"
          })
          .map((d)=>{
             return `### [${d.year}｜${aToMarkDown(d.title,true)}](${d.link})\n>${aToMarkDown(d.desc,true).split("\n").join("\n>")}`
          })
          .join("\n")
        if (testdata.length < 1000) return back(testdata);
        testdata = todaydata
          .filter((d)=>{
            return d.type == filtertype || filtertype == "all"
          })
          .map((d)=>{
             return `### [${d.year}｜${aToMarkDown(d.title,true)}](${d.link})`
          })
          .join("\n")
        if (testdata.length < 1000) return back(testdata);
        back(`太多了，懒得发`)
      })
      .catch((e)=>{
        console.error(e)
        back(`失败了呜呜呜`);
      })
      
    },
    help: '历史上的今天',
    useage: '<类型[event(默认)、birth、death、all(前面3个)]>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
  },
  fin: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      config.fin = config.fin ? false : true;
      saveConfig();
      back(`已设置Fin AntiSpam的启用为${config.fin}`)
    },
    help: '开关 Fin AntiSpam',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  addwhl: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (!args[0]) {
        back("参数无效")
        return;
      }
      if (/^[a-zA-Z0-9+/]{6}$/.test(args[0])) {
        if (config.white.includes(args[0])) {
          back("这个识别码已经添加了")
        } else {
          config.white.push(args[0].replace(/\n/g," "))
          saveConfig()
          back("成功添加")
        }
      } else back("不是有效识别码")
    },
    help: '添加一个识别码为白名单',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  removewhl: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (!args[0]) {
        back("参数无效")
        return;
      }
      if (/^[a-zA-Z0-9+/]{6}$/.test(args[0])) {
        if (config.white.includes(args[0])) {
          let index = config.white.indexOf(args[0]); 
          if (index !== -1) config.white.splice(index, 1);
          saveConfig()
          back("成功删除")
        } else {
          back("没有找到这个识别码")
        }
      } else back("不是有效识别码")
    },
    help: '删除一个识别码的白名单',
    useage: '',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  listwhl: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      back(config.white.length > 0 ? `白名单：\`${config.white.join("`, `")}\``: "白名单内没有任何用户")
    },
    help: '显示白名单用户列表',
    useage: '',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  welc: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (!userinfo.trip) return back(`你需要先有一个识别码才可以设置欢迎语`);
      let welctext = args.join(" ").trim();
      if (welctext.length > 1000) return back(`长度限制在 1000 字符，但是你的内容长度为 ${welctext.length} 字符`)
      if (welctext) {
        welc[userinfo.trip] = welctext;
        back(`成功设置`)
      } else {
        delete welc[userinfo.trip];
        back(`成功删除`)
      }
      saveWelc();
    },
    help: '设置欢迎语',
    useage: '<内容>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  removewelc: {
    run: (args,obj,userinfo,whisper,back,showcmdstart) => {
      if (welc[args[0]]) {
        delete welc[args[0]];
        saveWelc();
        back(`成功删除`)
      } else back(`这个识别码没有设置欢迎语`)
    },
    help: '删除一个识别码的欢迎语',
    useage: '[trip]',
    level: 152, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 1000,
  },
  search: {
    run: async (args,obj,userinfo,whisper,back,showcmdstart) => {
      let search_word = args.join(" ").trim();
      if (!search_word) return back(`不知道您想干什么呢~`);
      if (search_word.length > 152) return back(`这是GPT搜索，不是GPT`);
      try {
        back(`请稍后...`);
        let req = await searchGPTTool(search_word.replace("-d","").replace("-s","").trim(), search_word.includes("-d"), search_word.includes("-s"));
        back(` ${req.answer.replace(/\[\[citation:(\d+)\]\]/g, '[$1]')}\n\n${req.ref.map((r)=>{
          return `- [${r.id}][${r.name}](${r.url})`
        }).join("\n")}`);
      } catch (e) {
        back(`臣妾做不到啊！`);
      }
    },
    help: '使用GPT搜索内容',
    useage: '[内容] <附加参数（-s 科学模式 -d 详细模式）>',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
  },
  wp: {
    run: async (args,obj,userinfo,whisper,back,showcmdstart) => {
      let search_word = args;
      let lang_iso = search_word.shift();
      search_word = search_word.join(" ").trim();
      if (!search_word) return back(`不知道您想干什么呢~`);
      if (search_word.length > 152) return back(`太长了吧`);
      try {
        let req = await wpSearch(search_word,lang_iso);
        if (!req) return back(`wp没有这个语言iso`);
        if (req.length == 0) return back(`wp上没有关于此内容的结果`);
        let data_length = req[0].data_length;
        back(`找到 ${data_length} 个结果：\n${req.map((a)=>{
          return `### [${a.title}](${a.url})\n>${a.data.split("\n").join("\n>")}`
        }).join("\n")}`);
      } catch (e) {
        back(`臣妾做不到啊！`);
      }
    },
    help: '在 wikipedia 上搜索内容',
    useage: '[语言iso（比如 zh）] [内容]',
    level: 100, //100 普通用户 152 授权用户 999以上的基本mod
    rl: 5000,
  },
}

function getOnline(chan,name=`list${getRandomNumber(1000,9999)}`,passs='',data=false,getme=false) {
  return new Promise((resolve, reject) => {
    var pws = new websocket(config.proxy);
    let jed = false;
    var psend = (obj) => { pws.send(JSON.stringify(obj)) };
    pws.onopen = () => {
      psend({
        cmd: 'join',
        channel: chan,
        nick: name,
        password: passs
      })
    };
    pws.onmessage = (e) => {
      let phc = JSON.parse(e.data);
      if (phc.channel) {
        if (phc.channel !== chan) reject(`加入被重定向到 ?${phc.channel} （可能是 ?${chan} 锁房了）`);
      }
      if (phc.cmd === "captcha") {
        reject("目标频道开启了验证码");
      }
      if (phc.cmd === "warn") {
        setTimeout(()=>{
          if (!jed) reject("未知错误");
        },1000)
      }
      if (phc.cmd === "onlineSet") {
        jed = true;
        if (data) psend(data);
        let mtrip = phc.users.pop();
        if (getme) {
          resolve(mtrip)
        } else resolve(phc.users);
      };
      pws.close();
    }
    pws.onerror = () => {
      reject("未知错误");
    }
    setTimeout(()=>{
      reject("Timed Out!");
    },5000)
  })
}
function quoteText(text) {
  return ">"+text.split("\n").join("\n>")
}
function openSession(chan,name=`whoami_session_${getRandomNumber(1000,9999)}`,passs='') {
  return new Promise((resolve, reject) => {
    if (Object.keys(sessions).length > 3) return {
      code: 429
    } 
    let manba = setTimeout(()=>{
      reject("Timed Out!");
    },5000)
    let pdefchannel = false;
    let sessionid = Array.from({ length: 3 }, () => { return getRandomNumber(1000,9999).toString(36)}).join("");
    var pws = new websocket(config.proxy);
    var psend = (obj) => { pws.send(JSON.stringify(obj)) };
    pws.onopen = () => {
      clearTimeout(manba)
      psend({
        cmd: 'join',
        channel: chan,
        nick: name,
        password: passs
      })
    };
    pws.joined = false;
    pws.onmessage = (e) => {
      let phc = JSON.parse(e.data);
      if (phc.channel) {
        if (phc.channel !== chan && !pws.joined) reject(`加入被重定向到 ?${phc.channel} （可能是 ?${chan} 锁房了）`);
        if (sessions[sessionid]) {
          sessions[sessionid].channel = phc.channel;
        } else pdefchannel = phc.channel;
      }
      if (phc.cmd === "captcha" && !pws.joined) {
        reject(`目标频道开启了验证码`);
      }
      if (phc.cmd === "warn") {
        if (pws.joined) {
          _chat(`/me <Session \`${sessionid}\`> warn\n! ${phc.text}`);
        } else {
          setTimeout(()=>{
            if (!pws.joined) reject(phc.text)
          },1000)
        }
      }
      if (phc.cmd === "onlineSet") {
        sessions[sessionid] = {
          ws: pws,
          close: () => {
            pws.removeAllListeners();
            pws.close();
            delete sessions[sessionid]; // 从 sessions 中删除该会话
          },
          _send: (obj) => {
            pws.send(JSON.stringify(obj));
          },
          _chat: (text) => {
            pws.send(JSON.stringify({ cmd: 'chat', text: text }));
          },
          time: new Date(),
          channel: pdefchannel
        };
        resolve(sessionid);
        pws.joined = true;
      };
      if (phc.cmd == "chat" && phc.nick !== name) {
        _chat(`/me <Session \`${sessionid}\`>  ${phc.cmd}\n${phc.trip?`[${phc.trip}]`:""}${phc.nick}：\n${quoteText(phc.text)}`);
      }
      if (phc.cmd == "emote") {
        _chat(`/me <Session \`${sessionid}\`> ${phc.cmd}\n${phc.trip?`[${phc.trip}]`:""} \\*\n${quoteText(`@${phc.nick} ${phc.text}`)}`);
      }
      if (phc.cmd == "onlineAdd") {
        _chat(`/me <Session \`${sessionid}\`> ${phc.cmd}\n${phc.trip?`[${phc.trip}]`:""} \\* ${phc.nick} joined`);
      }
      if (phc.cmd == "onlineRemove") {
        _chat(`/me <Session \`${sessionid}\`> ${phc.cmd}\n\\* ${phc.nick} left`);
      }
      if (phc.cmd == "info") {
        _chat(`/me <Session \`${sessionid}\`> ${phc.cmd}\n${phc.trip?`[${phc.trip}]`:""} \\*\n${quoteText(phc.text)}`);
      }
    }
    pws.onerror = () => {
      clearTimeout(manba);
      reject("未知错误");
    }
    pws.onclose = () => {
      clearTimeout(manba);
      sessions[sessionid].close();
    }
  })
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
      testRegExps(config.bans.hash,user.hash) ||
      testRegExps(config.bans.color,user.color)
    ) {
      if (!config.modtrip.includes(user.trip) && user.uType != "mod" && !isAdmin(user)) kickuser.push(user.nick)
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

// 检测 mods 文件夹是否存在
if (fs.existsSync('mods')) {
  // 读取 mods 文件夹中的所有 .js 文件
  const files = fs.readdirSync('mods').filter(file => path.extname(file) === '.js');

  // 遍历每个文件并执行
  files.forEach(file => {
    const filePath = path.join('mods', file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    eval(fileContent); // 执行文件内容
  });
}
console.log("正在连接到服务器……");
var ws = new websocket(config.useproxy?config.proxy:"wss://hack.chat/chat-ws");
var _send = (obj,fast=false) => {
  if (fast) {
    ws.send(JSON.stringify(obj))
  } else waitsend.push(JSON.stringify(obj))
}
var _chat = (text,fast=false) => {
  _send({
    cmd: 'chat',
    text: text
  }, fast)
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
},config.useproxy?500:3000)

// 广告模块
function millisecondsToNextHour() {
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
  return nextHour - now;
}
function getFormattedHoursDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:00:00`;
}
function getHiyoChat(index=new Date().getHours()) {
  return [
    getRandomItemFromArray([
      "现在还有人在聊天吗 ouo", // 0,1
      "新的一天开始了~", // 0,2
    ]), // 0
    getRandomItemFromArray([
      "历史睡了，时间醒着，世界睡了，你们醒着", // 1,1
      "都给我去睡觉！！！", // 1,2
    ]), // 1
    getRandomItemFromArray([
      "不睡的话小心猝死", // 2,1
      "你们都是夜猫子吗 QwQ", // 2,2
    ]), // 2
    getRandomItemFromArray([
      "夜半三更，鬼魂会不会出现啊？（抖", // 3,1
      "现在最适合讲个鬼故事啦~", // 3,2
      "听说现在很容易遇到脏东西（害怕）", // 3,3
    ]), // 3
    getRandomItemFromArray([
      "赶紧去睡吧，再不睡就起不来啦", // 4,1
      "居然没闹鬼吗 QwQ", // 4,2
      "终于听过了最有可能闹鬼的时间 AwA!!!", // 4,3
    ]), // 4
    getRandomItemFromArray([
      "你是还没睡，还是刚醒来？", // 5,1
      "记得去看天安门升旗哦 awp", // 5,2
    ]), // 5
    getRandomItemFromArray([
      "太阳初露鱼白", // 6,1
      "太阳慢慢升起来真美！", // 6,2
      "有人去看天安门升旗了吗？", // 6,3
    ]), // 6
    getRandomItemFromArray([
      "话说真的有人会有时间煮早饭吗", // 7,1
      "吃完早餐记得漱个口", // 7,2
    ]), // 7
    getRandomItemFromArray([
      "睁开朦胧的睡眼迎接新的一天吧", // 8,1
      "一日之际在于晨，开始美好的一天吧", // 8,2
    ]), // 8
    getRandomItemFromArray([
      "早上九点不是晚上九点，别睡哦", // 9,1
      "这里是聊天区，不是无人区！", // 9,2
      
    ]), // 9
    getRandomItemFromArray([
      "早上10点人少，晚上10点就多了！", // 10,1
      "送你一朵小花花，今天要开心一整天哦", // 10,2
      
    ]), // 10
    getRandomItemFromArray([
      "感觉有点饿了，怎么还不到午餐时间aaa", // 11,1
      "你是不是也满脑子想着午餐？", // 11,2
      
    ]), // 11
    getRandomItemFromArray([
      "各位午安啊 awa", // 12,1
      "中午吃什么好 pwp", // 12,2
      
    ]), // 12
    getRandomItemFromArray([
      "趁着午休摸会儿鱼 awawawa", // 13,1
      "摸鱼时间到~", // 13,2
      
    ]), // 13
    getRandomItemFromArray([
      "看看窗外的美景散散心吧，没有窗户的看赛博窗户（Windows）", // 14,1
      "不会有人还没吃午餐吧 awawawawa", // 14,2
      
    ]), // 14
    getRandomItemFromArray([
      "多喝水有助于身体健康~", // 15,1
      "下午记得多喝水awa", // 15,2
      
    ]), // 15
    getRandomItemFromArray([
      "抱一抱你最亲近的人吧！", // 16,1
      "上班累了记得起来运动一下吧！", // 16,2
      
    ]), // 16
    getRandomItemFromArray([
      "有时间的话这时候去外面也是十分不错的啊", // 17,1
      "宅在家里也是一个好的选择", // 17,2
      
    ]), // 17
    getRandomItemFromArray([
      "太阳公公快下山了~~", // 18,1
      "芜湖，现在最适合聊天了", // 18,2
      
    ]),// 18
    getRandomItemFromArray([
      "晚餐少吃油腻辛辣食物哦", // 19,1
      "夕阳西下，断肠人在天涯", // 19,2
      
    ]),// 19
    "夜晚最适合在lo吧台旁聊天了！whoami我现在为你提供可乐鸡尾酒！", // 20
    getRandomItemFromArray([
      "快洗洗睡吧~ q.q", // 21,1
      "最健康的睡觉时间是半小时后 AwA!!!", // 21,2
      
    ]),// 21
    getRandomItemFromArray([
      "夜深人静，屏幕后面会不会有一双吊着黑眼圈的眼睛？o.O", // 22,1
      "现在超级适合emo的啦~", // 22,2
      
    ]),// 22
    getRandomItemFromArray([
      "夜宵可能也是一个不错的选择", // 23,1
      "23？！（要素察觉）", // 23,2
      
    ]),// 23
  ][index] || ""
}
function ad() {
  setTimeout(()=>{
    _chat(`${getFormattedHoursDate()} ${getHiyoChat()}\n### ${getRandomItemFromArray(config.ads)}`);
    ad();
  }, millisecondsToNextHour())
}


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
  },config.useproxy?5000:10000);
  ad()
  //setTimeout(sendHistory,getRandomNumber(600000,1000000))
  if (config.unlocker) unlocker = setTimeoutTo(uler, config.unlocker);
  if (config.discaper) discaper = setTimeoutTo(dcer, config.discaper);
}
function getInfo(usernick,c=false) {
  return c?users_.find(user=>{return user.nick == usernick}):users.find(user=>{return user.nick == usernick})
}
function getAwaya() {
  let awa_ya = users.find(user=>{return user.trip == "YaAwA7"});
  return awa_ya?awa_ya.nick:false;
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
      if (config.useproxy) ws.close();
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
      if (hc.text == "Nickname taken") {
        config.zombie = true;
        saveConfig();
        ws.close();
      }
      setTimeout(()=>{
        if (!joined) {
          if (config.useproxy) ws.close();
          setTimeout(()=>{
            ws.close()         //草，什么死人嵌套
          },65000)
        }
      },3000)
    }
  }
  if (hc.cmd == "onlineSet") joined = true
  if (hc.cmd == "warn" && config.useproxy && (hc.text == "You are being rate-limited or blocked." || hc.text=="You are sending too much text. Wait a moment and try again.\nPress the up arrow key to restore your last message.")) ws.close();

  if (hc.cmd == "onlineRemove" && zombiek) {
    let zombieu = nicks.find((n)=>{return n.toLowerCase() == oldNick.toLowerCase()});
    if (zombieu && hc.nick == zombieu) {
      ws.close();
    }
  }

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


  if (hc.cmd == "onlineSet") {
    _chat("世人皆欲掌控天下");
  }
  if (hc.cmd == "onlineSet" && zombiek) {
    let zombieu = nicks.find((n)=>{return n.toLowerCase() == oldNick.toLowerCase()});
    if (zombieu) {
      _kick([zombieu],"反僵尸号");
    }
  }
  //封禁用户支持
  if (hc.cmd == "onlineAdd" || hc.cmd == "onlineSet" || hc.cmd == "updateUser") checkBan()
  //屏蔽词支持
  if (hc.text) {
    if (testRegExps(config.bans.text,hc.text) && !config.modtrip.includes(hc.trip) && !isAdmin(hc)) {
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
        if (!config.modtrip.includes(hc.trip) && getInfo(hc.nick?hc.nick:hc.from).uType != "mod" && !isAdmin(hc) && !isWhite(hc)) {
          _kick([hc.nick?hc.nick:hc.from],`AntiSpam`)
        }
      } else {
        if (config.fin && finWindow(hc.text) && !config.modtrip.includes(hc.trip) && getInfo(hc.nick?hc.nick:hc.from).uType != "mod" && !isAdmin(hc) && !isWhite(hc)) {
          _kick([hc.nick?hc.nick:hc.from],`Fin AntiSpam`)
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
  //afk处理
  /*if (hc.cmd == "onlineSet") {
    afklist = {} //被移动时清空afk
    saveAfklist();
  }*/
  if (hc.cmd == "onlineRemove") {
    delete afklist[hc.nick] //删除退出用户的afk
    saveAfklist();
  }
  if (hc.nick && hc.text) {
    for (let k in afklist) {
      if (k == hc.nick) { //用户退出afk
        _send({
          cmd: 'chat',
          text: `${k} ${afklist[k].do} 了 ${formatTimeDifference(afklist[k].time)} ，欢迎回来~`
        })
        delete afklist[k];
      }
      //afk用户被at
      if (hc.text.includes(`@${k}`) && afklist[k] && hc.nick !== myNick) {
        _send({
          cmd: 'chat',
          text: `${k} ${formatTimeDifference(afklist[k].time)} 前正在 ${afklist[k].do} ，请不要打扰TA`
        })
      }
    }
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


  //welc
  if (hc.cmd == "onlineAdd" && hc.trip && welc[hc.trip]) {
    _chat(' ' + welc[hc.trip])
  }
  //ChatGPT
  if (hc.cmd == "chat" && hc.text.startsWith("@"+myNick) && hc.nick != myNick && lazysend) {
    let semsg = hc.text.replace("@"+myNick,"").trim()
    if (config.allowgpt.includes(hc.trip) || getInfo(hc.nick).level >= 999999) {
      ChatGPT(semsg,hc)
    } else {
      _send({
        cmd: 'chat',
        text: getRandomItemFromArray([
          `您的trip已被滥用过滤器拦截，请尝试使用你之前的trip`,
          `Nope, But you can Hope :)`,
          `Get OUT!`,
          `NO!`
        ])
      })
    }
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
  if (hc.cmd == "chat" && iscmdstart(hc.text) !== undefined) {
    try {
      let cmdargs = hc.text.substring(iscmdstart(hc.text).length).split(" ");
      let cmdname = cmdargs.shift()
      let userlevel = getLevel(getInfo(hc.nick))
      if (!lazysend && userlevel < 152) return;
      if (isRL(COMMANDS[cmdname]) && userlevel < 152 && userlevel >= COMMANDS[cmdname].level) {
        _send({
          cmd: 'chat',
          text: getRandomItemFromArray([
            '操作过快',
            '太快了，要坏掉的 qwq',
            '我知道你很急，但是你先别急',
            '呜…慢点……',
            '慢（点）！（What Can I Say?）'
          ])
        })
        return;
      }
      if (COMMANDS[cmdname]) {
        if (isCanUse(cmdname,userlevel)) {
          COMMANDS[cmdname].run(cmdargs,hc,getInfo(hc.nick),false,(text)=>{_send({cmd:'chat',text:text},userlevel>=152?true:false)},getshowcmdstart(iscmdstart(hc.text)))
        }
      }
    } catch (e) {
      console.log(e)
      _send({
        cmd: 'chat',
        text: '命令执行时出错：' + e.message
      })
    }
  }
  if (hc.cmd == "info" && hc.from && hc.type == "whisper" && iscmdstart(hc.text.substring(12+hc.from.length)) !== undefined) {
    try {
      let cmdargs = hc.text.substring(iscmdstart(hc.text.substring(12+hc.from.length)).length+12+hc.from.length).split(" ");
      let cmdname = cmdargs.shift()
      let userlevel = getLevel(getInfo(hc.from))
      if (!lazysend && userlevel < 152) return;
      if (isRL(COMMANDS[cmdname]) && userlevel < 152 && userlevel >= COMMANDS[cmdname].level) {
        _send({
          cmd: 'whisper',
          nick: hc.from,
          text: getRandomItemFromArray([
            '操作过快',
            '太快了，要坏掉的 qwq',
            '我知道你很急，但是你先别急',
            '呜…慢点……',
            '慢（点）！（What Can I Say?）'
          ])
        })
        return;
      }
      if (COMMANDS[cmdname]) {
        if (isCanUse(cmdname,userlevel)) {
          COMMANDS[cmdname].run(cmdargs,hc,getInfo(hc.from),true,(text)=>{_send({cmd:'whisper',nick:hc.from,text:">\n"+text},userlevel>=152?true:false)}, getshowcmdstart(iscmdstart(hc.text.substring(12+hc.from.length))))
        }
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
      text: `### **==致命==错++呜呜呜++！**\n${err.message||err||"未知错误"}`
    })
  } catch(e){}
  setTimeout(()=>{
    process.exit(1); 
  },1000)
});



//`2fa, ban, del2fa, discap, encap, kick, lock, padd, premove, setrl, sudo, unlock, whykick`.split(", ").forEach(a=>{COMMANDS[a].run=(args,obj,userinfo,whisper,back)=>{back("cmd已经疯了，这个命令无法使用")}})
//_kick=()=>{}

//自动删除ban
setInterval(()=>{
  for (let k in config.bans) {
    let nowban = config.bans[k].filter((bant)=>{
      let removet = parseInt(bant[2])||Infinity;
      if (removet<new Date().getTime()) return false;
      return true;
    });
    if (nowban != config.bans[k]) {
      config.bans[k] = nowban;
      saveConfig();
    }
  }
},1000)

//摇卦
var gua = [
    "乾\n乾为天（乾卦）自强不息\n上上卦\n象曰：困龙得水好运交，不由喜气上眉梢，一切谋望皆如意，向后时运渐渐高。\n这个卦是同卦（下乾上乾）相叠。象征天，喻龙（德才的君子），又象征纯粹的阳和健，表明兴盛强健。乾卦是根据万物变通的道理，以“元、亨、利、贞”为卦辞，示吉祥如意，教导人遵守天道的德行。\n",
    "坤\n坤为地（坤卦）厚德载物\n上上卦\n象曰：肥羊失群入山岗，饿虎逢之把口张，适口充肠心欢喜，卦若占之大吉昌。\n这个卦是同卦（下坤上坤）相叠，阴性。象征地（与乾卦相反），顺从天。承载万物，伸展无穷无尽。坤卦以雌马为象征，表明地道生育抚养万物，而又依天顺时，性情温顺。它以“先迷后得”证明“坤”顺从“乾”，依随“乾”，才能把握正确方向，遵循正道，获取吉利。\n",
    "屯\n水雷屯（屯卦）起始维艰\n下下卦\n象曰：风刮乱丝不见头，颠三倒四犯忧愁，慢从款来左顺遂，急促反惹不自由。\n这个卦是异卦（下震上坎）相叠，震为雷，喻动；坎为雨，喻险。雷雨交加，险象丛生，环境恶劣。“屯”原指植物萌生大地。万物始生，充满艰难险阻，然而顺时应运，必欣欣向荣。\n",
    "蒙\n山水蒙（蒙卦）启蒙奋发\n中下卦\n象曰：卦中爻象犯小耗，君子占之运不高，婚姻合伙有琐碎，做事必然受苦劳。\n这个卦是异卦（下坎上艮）相叠，艮是山的形象，喻止；坎是水的形象，喻险。卦形为山下有险，仍不停止前进，是为蒙昧，故称蒙卦。但因把握时机，行动切合时宜，因此，具有启蒙和通达的卦象。\n",
    "需\n水天需（需卦）守正待机\n中上卦\n象曰：明珠土埋日久深，无光无亮到如今，忽然大风吹土去，自然显露有重新。\n这个卦是异卦（下乾上坎）相叠，下卦是乾，刚健之意；上卦是坎，险陷之意。以刚逢险，宜稳健之妥，不可冒失行动，观时待变，所往一定成功。\n",
    "讼\n天水讼（讼卦）慎争戒讼\n中下卦\n象曰：心中有事事难做，恰是二人争路走，雨下俱是要占先，谁肯让谁走一步。\n这个卦是异卦（下坎上乾）相叠。同需卦相反，互为“综卦”。乾为刚健，坎为险陷。刚与险，健与险，彼此反对，定生争讼。争讼非善事，务必慎重戒惧。\n",
    "师\n地水师（师卦）行险而顺\n中上卦\n象曰：将帅领旨去出征，骑着烈马拉硬弓，百步穿杨去得准，箭中金钱喜气生。\n这个卦是异卦（下坎上坤）相叠。“师”指军队。坎为水、为险；坤为地、为顺，喻寓兵于农。兵凶战危，用兵乃圣人不得已而为之，但它可以顺利无阻碍地解决矛盾，因为顺乎形势，师出有名，故能化凶为吉。\n",
    "比\n水地比（比卦）诚信团结\n上上卦\n象曰：顺风行船撒起帆，上天又助一蓬风，不用费力逍遥去，任意而行大亨通。\n这个卦是异卦（下坤上坎）相叠，坤为地；坎为水。水附大地，地纳河海，相互依赖，亲密无间。此卦与师卦完全相反，互为综卦。它阐述的是相亲相辅，宽宏无私，精诚团结的道理。\n",
    "小畜\n风天小畜（小畜卦）蓄养待进\n下下卦\n象曰：苗逢旱天尽焦梢，水想云浓雨不浇，农人仰面长吁气，是从款来莫心高。\n这个卦是异卦（下乾上巽）相叠，乾为天；巽为风。喻风调雨顺，谷物滋长，故卦名小畜（蓄）。力量有限，须待发展到一定程度，才可大有作为。\n",
    "履\n天泽履（履卦）脚踏实地\n中上卦\n象曰：凤凰落在西岐山，长鸣几声出圣贤，天降文王开基业，富贵荣华八百年。\n这个卦是异卦（下兑上乾）相叠，乾为天；兑为泽，以天喻君，以泽喻民，原文：“履（踩）虎尾、不咥（咬）人。”因此，结果吉利。君上民下，各得其位。兑柔遇乾刚，所履危。履意为实践，卦义是脚踏实地的向前进取的意思。\n",
    "泰\n地天泰（泰卦）应时而变\n中中卦\n象曰：学文满腹入场闱，三元及第得意回，从今解去愁和闷，喜庆平地一声雷。\n这个卦是异卦（下乾上坤）相叠，乾为天，为阳；坤为地，为阴，阴阳交感，上下互通，天地相交，万物纷纭。反之则凶。万事万物，皆对立，转化，盛极必衰，衰而转盛，故应时而变者泰（通）。\n",
    "否\n天地否(pǐ)（否卦）不交不通\n中中卦\n象曰：虎落陷坑不堪言，进前容易退后难，谋望不遂自己便，疾病口舌事牵连。\n这个卦是异卦（下坤上乾）相叠，其结构同泰卦相反，系阳气上升，阴气下降，天地不交，万物不通。它们彼此为“综卦”，表明泰极而否，否极泰来，互为因果。\n",
    "同人\n天火同人（同人卦）上下和同\n中上卦\n象曰：心中有事犯猜疑，谋望从前不着实，幸遇明人来指引，诸般忧闷自消之。\n这个卦是异卦（下离上乾）相叠，乾为天，为君；离为火，为臣民百姓，上天下火，火性上升，同于天，上下和同，同舟共济，人际关系和谐，天下大同。\n",
    "大有\n火天大有（大有卦）顺天依时\n上上卦\n象曰：砍树摸雀作事牢，是非口舌自然消，婚姻合伙不费力，若问走失未逃脱。\n这个卦是异卦（下乾上离）相叠。上卦为离，为火；下卦为乾，为天。火在天上，普照万物，万民归顺，顺天依时，大有所成。\n",
    "谦\n地山谦（谦卦）内高外低\n中中卦\n象曰：天赐贫人一封金，不争不抢两平分，彼此分得金到手，一切谋望皆遂心。\n这个卦是异卦（下艮上坤）相叠，艮为山，坤为地。地面有山，地卑（低）而山高，是为内高外低，比喻功高不自居，名高不自誉，位高不自傲。这就是谦。\n",
    "豫\n雷地豫（豫卦）顺时依势\n中中卦\n象曰：太公插下杏黄旗，收妖为徒归西岐，自此青龙得了位，一旦谋望百事宜。\n这个卦是异卦（下坤上震）相叠，坤为地，为顺；震为雷，为动。雷依时出，预示大地回春。因顺而动，和乐之源。此卦与谦卦互为综卦，交互作用。\n",
    "随\n泽雷随（随卦）随时变通\n中中卦\n象曰：泥里步踏这几年，推车靠崖在眼前，目下就该再使力，扒上崖去发财源。\n这个卦是异卦（下震上兑）相叠，震为雷、为动；兑为悦。动而悦就是“随”。随指相互顺从，己有随物，物能随己，彼此沟通。随必依时顺势，有原则和条件，以坚贞为前提。\n",
    "蛊\n山风蛊（蛊卦）振疲起衰\n中中卦\n象曰：卦中爻象如推磨，顺当为福反为祸，心中有益且迟迟，凡事尽从忙处错。\n这个卦是异卦（下巽上艮）相叠，与随卦互为综卦。蛊（gu）本意为事，引申为多事、混乱。器皿久不用而生虫称“蛊”，喻天下久安而因循、腐败，必须革新创造，治理整顿，挽救危机，重振事业。\n",
    "临\n地泽临（临卦）教民保民\n中上卦\n象曰：君王无道民倒悬，常想拨云见青天，幸逢明主施仁政，重又安居乐自然。\n这个卦是异卦（下兑上坤）相叠。坤为地；兑为泽，地高于泽，泽容于地。喻君主亲临天下，治国安邦，上下融洽。\n",
    "观\n风地观（观卦）观下瞻上\n中上卦\n象曰：卦遇蓬花旱逢河，生意买卖利息多，婚姻自有人来助，出门永不受折磨。\n这个卦是异卦（下坤上巽）相叠，风行地上，喻德教遍施。观卦与临卦互为综卦，交相使用。在上者以道义观天下；在下者以敬仰瞻上，人心顺服归从。\n",
    "噬嗑\n火雷噬嗑（噬嗑卦）刚柔相济\n上上卦\n象曰：运拙如同身受饥，幸得送饭又送食，适口充腹心欢喜，忧愁从此渐消移。\n这个卦是异卦（下震上离）相叠。离为阴卦；震为阳卦。阴阳相交，咬碎硬物，喻恩威并施，宽严结合，刚柔相济。噬嗑（shihe）为上下颚咬合，咀嚼。\n",
    "贲\n山火贲（贲卦）饰外扬质\n中上卦\n象曰：近来运转瑞气周，窈窕淑女君子求。钟鼓乐之大吉庆，占者逢之喜临头。\n这个卦是异卦（下离上艮）相叠。离为火为明；艮为山为止。文明而有节制。贲（bi）卦论述文与质的关系，以质为主，以文调节。贲，文饰、修饰。\n",
    "剥\n山地剥（剥卦）顺势而止\n中下卦\n象曰：鹊遇天晚宿林中，不知林内先有鹰，虽然同处心生恶，卦若逢之是非轻。\n这个卦是异卦（下坤上艮）相叠。五阴在下，一阳在上，阴盛而阳孤；高山附于地。二者都是剥落象，故为“剥卦”。此卦阴盛阳衰，喻小人得势，君子困顿，事业败坏。\n",
    "复\n地雷复（复卦）寓动于顺\n中中卦\n象曰：马氏太公不相合，世人占之忧疑多，恩人无义反为怨，是非平地起风波。\n这个卦是异卦（下震上坤）相叠。震为雷、为动；坤为地、为顺，动则顺，顺其自然。动在顺中，内阳外阴，循序运动，进退自如，利于前进。\n",
    "无妄\n天雷无妄（无妄卦）无妄而得\n下下卦\n象曰：飞鸟失机落笼中，纵然奋飞不能腾，目下只宜守本分，妄想扒高万不能。\n这个卦是异卦（下震上乾）相叠。乾为天为刚为健；震为雷为刚为动。动而健，刚阳盛，人心振奋，必有所得，但唯循纯正，不可妄行。无妄必有获，必可致福。\n",
    "大畜\n山天大畜（大畜卦）止而不止\n中上卦\n象曰：忧愁常锁两眉头，千头万绪挂心间，从今以后防开阵，任意行而不相干。\n这个卦是异卦（下乾上艮）相叠。乾为天，刚健；艮为山，笃实。畜者积聚，大畜意为大积蓄。为此不畏严重的艰难险阻，努力修身养性以丰富德业。\n",
    "颐\n山雷颐（颐卦）纯正以养\n上上卦\n象曰：太公独钓渭水河，手执丝杆忧愁多，时来又遇文王访，自此永不受折磨。\n这个卦是异卦（下震上艮）相叠。震为雷，艮为山。山在上而雷在下，外实内虚。春暖万物养育，依时养贤育民。阳实阴虚，实者养人，虚者为人养。自食其力。\n",
    "大过\n泽风大过（大过卦）非常行动\n中下卦\n象曰：夜晚梦里梦金银，醒来仍不见一文，目下只宜求本分，思想络是空劳神。\n这个卦是异卦（下巽上兑）相叠。兑为泽、为悦，巽为木、为顺，泽水淹舟，遂成大错。阴阳爻相反，阳大阴小，行动非常，有过度形象，内刚外柔。\n",
    "坎\n坎为水（坎卦）行险用险\n下下卦\n象曰：一轮明月照水中，只见影儿不见踪，愚夫当财下去取，摸来摸去一场空。\n这个卦是同卦（下坎上坎）相叠。坎为水、为险，两坎相重，险上加险，险阻重重。一阳陷二阴。所幸阴虚阳实，诚信可豁然贯通。虽险难重重，却方能显人性光彩。\n",
    "离\n离为火（离卦）附和依托\n中上卦\n象曰：官人来占主高升，庄农人家产业增，生意买卖利息厚，匠艺占之大亨通。\n这个卦是同卦（下离上离）相叠。离者丽也，附着之意，一阴附丽，上下二阳，该卦象征火，内空外明。离为火、为明、太阳反复升落，运行不息，柔顺为心。\n",
    "咸\n泽山咸（咸卦）相互感应\n中上卦\n象曰：运去黄金失色，时来棒槌发芽，月令极好无差，且喜心宽意大。\n这个卦是异卦（下艮上兑）相叠。艮为山；泽为水。兑柔在上，艮刚在下，水向下渗，柔上而刚下，交相感应。感则成。\n",
    "恒\n雷风恒（恒卦）恒心有成\n中上卦\n象曰：渔翁寻鱼运气好，鱼来撞网跑不了，别人使本挣不来，谁想一到就凑合。\n这个卦是异卦（下巽上震）相叠。震为男、为雷；巽为女、为风。震刚在上，巽柔在下。刚上柔下，造化有常，相互助长。阴阳相应，常情，故称为恒。\n",
    "遁\n天山遁（遁卦）遁世救世\n下下卦\n象曰：浓云蔽日不光明，劝君且莫出远行，婚姻求财皆不利，提防口舌到门庭。\n这个卦是异卦（下艮上乾）相叠。乾为天，艮为山。天下有山，山高天退。阴长阳消，小人得势，君子退隐，明哲保身，伺机救天下。\n",
    "大壮\n雷天大壮（大壮卦）壮勿妄动\n中上卦\n象曰：卦占工师得大木，眼前该着走上路，时来运转多顺当，有事自管放心宽。\n这个卦是异卦（下乾上震）相叠。震为雷；乾为天。乾刚震动。天鸣雷，云雷滚，声势宏大，阳气盛壮，万物生长。刚壮有力故曰壮。大而且壮，故名大壮。四阳壮盛，积极而有所作为，上正下正，标正影直。\n",
    "晋\n火地晋（晋卦）求进发展\n中上卦\n象曰：锄地锄去苗里草，谁想财帛将人找，一锄锄出银子来，这个运气也算好。\n这个卦是异卦（下坤上离）相叠。离为日，为光明；坤为地。太阳高悬，普照大地，大地卑顺，万物生长，光明磊落，柔进上行，喻事业蒸蒸日上。\n",
    "明夷\n地火明夷（明夷卦）晦而转明\n中下卦\n象曰：时乖运拙走不着，急忙过河拆了桥，恩人无义反为怨，凡事无功枉受劳。\n这个卦是异卦（下离上坤）相叠。离为明，坤为顺；离为日；坤为地。日没入地，光明受损，前途不明，环境困难，宜遵时养晦，坚守正道，外愚内慧，韬光养晦。\n",
    "家人\n风火家人（家人卦）诚威治业\n下下卦\n象曰：一朵鲜花镜中开，看着极好取不来，劝君休把镜花恋，卦若逢之主可怪。\n这个卦是异卦（下离上巽）相叠。离为火；巽为风。火使热气上升，成为风。一切事物皆应以内在为本，然后伸延到外。发生于内，形成于外。喻先治家而后治天下，家道正，天下安乐。\n",
    "睽\n火泽睽（睽卦）异中求同\n下下卦\n象曰：此卦占来运气歹，如同太公作买卖，贩猪牛快贩羊迟，猪羊齐贩断了宰。\n这个卦是异卦（下兑上离）相叠。离为火；兑为泽。上火下泽，相违不相济。克则生，往复无空。万物有所不同，必有所异，相互矛盾。睽即矛盾。\n",
    "蹇\n水山蹇（蹇卦）险阻在前\n下下卦\n象曰：大雨倾地雪满天，路上行人苦又寒，拖泥带水费尽力，事不遂心且耐烦。\n这个卦是异卦（下艮上坎）相叠。坎为水；艮为山。山高水深，困难重重，人生险阻，见险而止，明哲保身，可谓智慧。蹇，跋行艰难。\n",
    "解\n雷水解（解卦）柔道致治\n中上卦\n象曰：目下月令如过关，千辛万苦受熬煎，时来恰相有人救，任意所为不相干。\n这个卦是异卦（下坎上震）相叠。震为雷、为动；坎为水、为险。险在内，动在外。严冬天地闭塞，静极而动。万象更新，冬去春来，一切消除，是为解。\n",
    "损\n山泽损（损卦）损益制衡\n下下卦\n象曰：时运不至费心多，比作推车受折磨，山路崎岖吊下耳，左插右按按不着。\n这个卦是异卦（下兑上艮）相叠。艮为山；兑为泽。上山下泽，大泽浸蚀山根。损益相间，损中有益，益中有损。二者之间，不可不慎重对待。损下益上，治理国家，过度会损伤国基。应损则损，但必量力、适度。少损而益最佳。\n",
    "益\n风雷益（益卦）损上益下\n上上卦\n象曰：时来运转吉气发，多年枯木又开花，枝叶重生多茂盛，几人见了几人夸。\n这个卦是异卦（下震上巽）相叠。巽为风；震为雷。风雷激荡，其势愈强，雷愈响，风雷相助互长，交相助益。此卦与损卦相反。它是损上以益下，后者是损下以益上。二卦阐述的是损益的原则。\n",
    "夬\n泽天夬 （夬卦） 决而能和\n上上卦\n象曰：蜘蛛脱网赛天军，粘住游蜂翅翎毛，幸有大风吹破网，脱离灾难又逍遥。\n这个卦是异卦（下乾上兑）相叠。乾为天为健；兑为泽为悦。泽气上升，决注成雨，雨施大地，滋润万物。五阳去一阴，去之不难，决（去之意）即可，故名为夬（guài），夬即决。\n",
    "姤\n天风姤（姤卦） 天下有风\n上卦\n象曰：他乡遇友喜气欢，须知运气福重添，自今交了顺当运，向后管保不相干。\n这个卦是异卦（下巽上乾）相叠。乾为天；巽为风。天下有风，吹遍大地，阴阳交合，万物茂盛。姤（gòu）卦与夬卦相反，互为“综卦”。姤即遘，阴阳相遇。但五阳一阴，不能长久相处。\n",
    "萃\n泽地萃（萃卦）荟萃聚集\n中上卦\n象曰：游鱼戏水被网惊，跳过龙门身化龙，三尺杨柳垂金线，万朵桃花显你能。\n这个卦是异卦相叠（下坤上兑）。坤为地、为顺；兑为泽、为水。泽泛滥淹没大地，人众多相互斗争，危机必四伏，务必顺天任贤，未雨绸缪，柔顺而又和悦，彼此相得益彰，安居乐业。萃，聚集、团结。\n",
    "升\n地风升（升卦）柔顺谦虚\n上上卦\n象曰：士人来占必得名，生意买卖也兴隆，匠艺逢之交易好，农间庄稼亦收成。\n这个卦是异卦相叠（下巽上坤）。坤为地、为顺；巽为木、为逊。大地生长树木，逐步的成长，日渐高大成材，喻事业步步高升，前程远大，故名“升”。\n",
    "困\n泽水困（困卦）困境求通\n中上卦\n象曰：时运不来好伤怀，撮上押去把梯抬，一筒虫翼无到手，转了上去下不来。\n这个卦是异卦（下坎上兑）相叠。兑为阴为泽喻悦；坎为阳为水喻险。泽水困，陷入困境，才智难以施展，仍坚守正道，自得其乐，必可成事，摆脱困境。\n",
    "井\n水风井（井卦）求贤若渴\n上上卦\n象曰：枯井破费已多年，一朝流泉出来鲜，资生济渴人称羡，时来运转喜自然。\n这个卦是异卦（下巽上坎）相叠。坎为水；巽为木。树木得水而蓬勃生长。人靠水井生活，水井由人挖掘而成。相互为养，井以水养人，经久不竭，人应取此德而勤劳自勉。\n",
    "革\n泽火革（革卦）顺天应人\n上上卦\n象曰：苗逢旱天渐渐衰，幸得天恩降雨来，忧去喜来能变化，求谋干事遂心怀。\n这个卦是异卦（下离上兑）相叠。离为火；兑为泽，泽内有水。水在上而下浇，火在下而上升。火旺水干；水大火熄。二者相生亦相克，必然出现变革。变革是宇宙的基本规律。\n",
    "鼎\n火风鼎（鼎卦）稳重图变\n中下卦\n象曰：莺鹜蛤蜊落沙滩，蛤蜊莺鹜两翅扇，渔人进前双得利，失走行人却自在。\n这个卦是异卦（下巽上离）相叠。燃木煮食，化生为熟，除旧布新的意思。鼎为重宝大器，三足稳重之象。煮食，喻食物充足，不再有困难和困扰。在此基础上宜变革，发展事业。\n",
    "震\n震为雷（震卦）临危不乱\n中上卦\n象曰：一口金钟在淤泥，人人拿着当玩石，忽然一日钟悬起，响亮一声天下知。\n这个卦是同卦（下震上震）相叠。震为雷，两震相叠，反响巨大，可消除沉闷之气，亨通畅达。平日应居安思危，怀恐惧心理，不敢有所怠慢，遇到突发事变，也能安然自若，谈笑如常。\n",
    "艮\n艮为山（艮卦）动静适时\n中下卦\n象曰：财帛常打心头走，可惜眼前难到手，不如意时且忍耐，逢着闲事休开口。\n这个卦是同卦（下艮上艮）相叠。艮为山，二山相重，喻静止。它和震卦相反。高潮过后，必然出现低潮，进入事物的相对静止阶段。静止如山，宜止则止，宜行则行。行止即动和静，都不可失机，应恰到好处，动静得宜，适可而止。\n",
    "渐\n风山渐（渐卦）渐进蓄德\n上上卦\n象曰：俊鸟幸得出笼中，脱离灾难显威风，一朝得意福力至，东西南北任意行。\n这个卦是异卦（下艮上巽）相叠。艮为山；巽为木。山上有木，逐渐成长，山也随着增高。这是逐渐进步的过程，所以称渐，渐即进，渐渐前进而不急速。\n",
    "归妹\n雷泽归妹（归妹卦）立家兴业\n下下卦\n象曰：求鱼须当向水中，树上求之不顺情，受尽爬揭难随意，劳而无功运平平。\n这个卦是异卦（下兑上震）相叠。震为动、为长男；兑为悦、为少女。以少女从长男，产生爱慕之情，有婚姻之动，有嫁女之象，故称归妹。男婚女嫁，天地大义，人的开始和终结。上卦与渐卦为综卦，交互为用。\n",
    "丰\n雷火丰（丰卦）日中则斜\n上上卦\n象曰：古镜昏暗好几年，一朝磨明似月圆，君子谋事逢此卦，时来运转喜自然。\n这个卦是异卦（下离上震）相叠，电闪雷鸣，成就巨大，喻达到顶峰，如日中天。告诫；务必注意事物向相反方面发展。治乱相因，盛衰无常，不可不警惕。\n",
    "旅\n火山旅（旅卦）依义顺时\n下下卦\n象曰：飞鸟树上垒窝巢，小人使计举火烧，君占此卦为不吉，一切谋望枉徒劳。\n这个卦是异卦（下艮上离）相叠。此卦与丰卦相反，互为“综卦”。山中燃火，烧而不止，火势不停地向前蔓延，如同途中行人，急于赶路。因而称旅卦。\n",
    "巽\n巽为风（巽卦）谦逊受益\n中上卦\n象曰：一叶孤舟落沙滩，有篙无水进退难，时逢大雨江湖溢，不用费力任往返。\n这个卦是同卦（下巽上巽）相叠，巽（xùn）为风，两风相重，长风不绝，无孔不入，巽义为顺。谦逊的态度和行为可无往不利。\n",
    "兑\n兑为泽（兑卦）刚内柔外\n上上卦\n象曰：这个卦象真可取，觉着做事不费力，休要错过这机关，事事觉得随心意。\n这个卦是同卦（下泽上泽）相叠。泽为水。两泽相连，两水交流，上下相和，团结一致，朋友相助，欢欣喜悦。兑为悦也。同秉刚健之德，外抱柔和之姿，坚行正道，导民向上。\n",
    "涣\n风水涣（涣卦）拯救涣散\n下下卦\n象曰：隔河望见一锭金，欲取岸宽水又深，指望资财难到手，昼思夜想枉费心。\n这个卦是异卦（下坎上巽）相叠。风在水上行，推波助澜，四方流溢。涣，水流流散之意。象征组织和人心涣散，必用积极的手段和方法克服，战胜弊端，挽救涣散，转危为安。\n",
    "节\n水泽节（节卦）万物有节\n上上卦\n象曰：时来运转喜气生，登台封神姜太公，到此诸神皆退位，纵然有祸不成凶。\n这个卦是异卦（下兑上坎）相叠。兑为泽；坎为水。泽有水而流有限，多必溢于泽外。因此要有节度，故称节。节卦与涣卦相反，互为综卦，交相使用。天地有节度才能常新，国家有节度才能安稳，个人有节度才能完美。\n",
    "中孚\n风泽中孚（中孚卦）诚信立身\n下下卦\n象曰：路上行人色匆匆，急忙无桥过薄冰，小心谨慎过得去，一步错了落水中。\n这个卦是异卦（下兑上巽）相叠。孚（fú）本义孵，孵卵出壳的日期非常准确，有信的意义。卦形外实内虚，喻心中诚信，所以称中孚卦。这是立身处世的根本。\n",
    "小过\n雷山小过（小过卦）行动有度\n中上卦\n象曰：行人路过独木桥，心内惶恐眼里瞧，爽利保你过得去，慢行一定不安牢。\n这个卦是异卦（下艮上震）相叠。艮为山；震为雷。过山雷鸣，不可不畏惧。阳为大，阴为小，卦外四阴超过中二阳，故称“小过”，小有越过。\n",
    "既济\n水火既济（既济卦）盛极将衰\n中上卦\n象曰：金榜以上题姓名，不负当年苦用功，人逢此卦名吉庆，一切谋望大亨通。\n这个卦是异卦（下离上坎）相叠。坎为水；离为火。水火相交，水在火上，水势压倒火势，救火大功告成。既，已经；济，成也。既济就是事情已经成功，但终将发生变故。\n",
    "未济\n火水未济（未济卦）事业未竟\n中下卦\n象曰：离地着人几丈深，是防偷营劫寨人，后封太岁为凶煞，时加谨慎祸不侵。\n这个卦是异卦（下坎上离）相叠。离为火；坎为水。火上水下，火势压倒水势，救火大功未成，故称未济。《周易》以乾坤二卦为始，以既济、未济二卦为终，充分反映了变化发展的思想。"
]

//权限没了
function _kick(kusers,reason="未知") {
  let kusersb = kusers.filter(user=>{
    return !waitkick.includes(user) && nicks.includes(user)
  })
  if (kusersb.length == 0) return;
  kusersb.forEach((user)=>{waitkick.push(user)})
  _send({
    cmd: 'emote',
    text: `<Safe Mode> ${reason} Kicked\n${kusersb.join(", ")}`
  })
}

//AFKBOT!!!

function _kick(kusers,reason="未知") {
  if (!users.find((user)=>{return user.nick=="AfK_Bot"&&user.trip=="AAfFKK"})) {
    _send({
      cmd: 'emote',
      text: `依赖错误：AfK_Bot，请检查此用户是否存在`
    })
    return;
  }
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
    nick: 'AfK_Bot',
    text: `:!kick ${kusersb.join(" ")}`
  },true)
}

function lock() {
  _send({
    cmd: 'whisper',
    nick: 'AfK_Bot',
    text: ':!lockroom'
  }, true)
}
function unlock() {
  _send({
    cmd: 'whisper',
    nick: 'AfK_Bot',
    text: ':!unlockroom'
  }, true)
}
function encap() {
  _send({
    cmd: 'whisper',
    nick: 'AfK_Bot',
    text: ':!enablecap'
  }, true)
}
function discap() {
  _send({
    cmd: 'whisper',
    nick: 'AfK_Bot',
    text: ':!disablecap'
  }, true)
}