const express = require('express');
const app = express();
const ws = require('ws')
const nunjucks = require('nunjucks')
const bodyParser = require('body-parser');
const M = require('minimatch');
const PORT = 3000;

app.set('view engine', 'html')
nunjucks.configure('views', {
  express: app
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



app.get('/', (req, res) => {
  res.render('index.html')
})

const Server = app.listen(PORT, () => {
  console.log(`server start port ${PORT}`)
})

const webSocketServer = new ws.Server({
  server: Server,
})

let user = [];

webSocketServer.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;





  ws.on('message', (data) => {
    const { type, nick } = JSON.parse(data.toString());
    //닉네임 입력하면 나빼고 모두한테 입장메시지 보내기.


    if (type == 0) {
      webSocketServer.clients.forEach((client) => {
        if (client !== ws && client.readyState === ws.OPEN) {
          //나빼고 다른 접속자들에게 
          client.send(JSON.stringify({ ...JSON.parse(data.toString()), port: ws._socket._peername.port, user: user, }));
        } else {
          //나에게 
          user.push({ nick: nick, port: ws._socket._peername.port })
          console.log(user)
          client.send(JSON.stringify({ ...JSON.parse(data.toString()), type: -1, user: user }));
        }
      })
    }
    else if (type == 1) {
      console.log(ws._socket._peername)
      webSocketServer.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          console.log(ws._socket._peername == client._socket._peername)
          const temp = JSON.stringify({
            ...JSON.parse(data.toString()),
            port: ws._socket._peername.port,
          })
          client.send(temp);
        }
      })
    }
    else if (type == 2) {
      webSocketServer.clients.forEach((client) => {
        if (client.readyState === ws.OPEN && (client._socket._peername.port == JSON.parse(data).target) || (client == ws)) {
          const temp = JSON.stringify({
            ...JSON.parse(data.toString()),
            port: ws._socket._peername.port,
          })
          client.send(temp);
        }
      })
    }
  })

  ws.on('close', () => {
    const dltuser = user.filter(v => v.port == ws._socket._peername.port)[0]
    let nick;
    if (dltuser != undefined) {
      nick = dltuser.nick;
    }
    const port = ws._socket._peername.port;
    user = user.filter(v => v.port != ws._socket._peername.port)
    webSocketServer.clients.forEach((client) => {
      client.send(JSON.stringify({ port: port, nick: nick, type: 3 }));
    })
  })
})









