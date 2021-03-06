const express = require('express');
const app = express();
const ws = require('ws')
const nunjucks = require('nunjucks')
const bodyParser = require('body-parser');
const PORT = 3000;

app.set('view engine', 'html')
nunjucks.configure('views', {
  express: app
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



app.get('/', (req, res) => {
  res.render('index2.html')
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
    const { type, nick} = JSON.parse(data);
    
    switch(type){
      case 'StartChat':
        webSocketServer.clients.forEach((client) => {
          if (client !== ws && client.readyState === ws.OPEN) {
            //나빼고 다른 접속자들에게 
            client.send(JSON.stringify({ ...JSON.parse(data.toString()), type:'NewJoin', port: ws._socket._peername.port, }));
          } else {
            //나에게 
            user.push({ nick: nick, port: ws._socket._peername.port })
            client.send(JSON.stringify({ ...JSON.parse(data.toString()), type: 'SetMyNick', user: user }));
          }
        })
      break;
  
      case 'ChatToAll':
        webSocketServer.clients.forEach((client) => {
            client.send(JSON.stringify({ ...JSON.parse(data.toString()), port: ws._socket._peername.port, }));
        })

      break;
  
      case 'ChatToMan':
        webSocketServer.clients.forEach((client) => {
          if ( client.readyState === ws.OPEN && (client._socket._peername.port == JSON.parse(data).targetPort) || (client === ws)) {
            client.send(JSON.stringify({ ...JSON.parse(data.toString()), port: ws._socket._peername.port, }));
          }
        })
      break;
    }
  })

  ws.on('close', () => {
    const dltuser = user.filter(v => v.port == ws._socket._peername.port)[0]
    let nick;
    if (dltuser != undefined) {
      nick = dltuser.nick;
    }
    if(nick!=undefined){
      const port = ws._socket._peername.port;
      user = user.filter(v => v.port != ws._socket._peername.port)
      webSocketServer.clients.forEach((client) => {
        client.send(JSON.stringify({ port: port, nick: nick, type: 'EndChat' }));
      })
    }
  })


})





