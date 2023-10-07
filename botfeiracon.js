const { Client, LocalAuth, MessageMedia, Chat, Buttons } = require('whatsapp-web.js');
const fs = require('fs');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 8012;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', '© BOT-Feiracon - Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-Feiracon QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© BOT-Feiracon Dispositivo pronto!');
    socket.emit('message', '© BOT-Feiracon Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('© BOT-Feiracon Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-Feiracon Autenticado!');
    socket.emit('message', '© BOT-Feiracon Autenticado!');
    console.log('© BOT-Feiracon Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BOT-Feiracon Falha na autenticação, reiniciando...');
    console.error('© BOT-Feiracon Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BOT-Feiracon Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BOT-Feiracon Cliente desconectado!');
  console.log('© BOT-Feiracon Cliente desconectado', reason);
  client.initialize();
});
});

// Send message
app.post('/politeia-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-Feiracon Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-Feiracon Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-Feiracon Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-Feiracon Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-Feiracon Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-Feiracon Mensagem não enviada',
      response: err.text
    });
    });
  }
});


// Send media
app.post('/politeia-media', [
  body('number').notEmpty(),
  body('file').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, media).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-Feiracon Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-Feiracon Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, media).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-Feiracon Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-Feiracon Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, media).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-Feiracon Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-Feiracon Imagem não enviada',
      response: err.text
    });
    });
  }
});

client.on('message', async msg => {

  const nomeContato = msg._data.notifyName;
  let groupChat = await msg.getChat();
  
  if (groupChat.isGroup) return null;

  if (msg.type.toLowerCase() == "e2e_notification") return null;
  
  if (msg.body == "") return null;
	
  if (msg.from.includes("@g.us")) return null;

  if (msg.body !== null && msg.body === "1") {
 	msg.reply("Será incrível ter você com a gente!\nAgora é só clicar no link da inscrição e preencher seu cadastro!\n\nSeja bem vindo(a) a FEIRACON EXPO 2023 🏠🏬");
 	}
	
   else if (msg.body !== null && msg.body === "2") {
msg.reply("Será incrível ter vocês como expositores!\nAcesse o link para se cadastrar que alguém de nossa equipe entrará em contato com você!\n\nSeja bem vindo(a) a FEIRACON EXPO 2023 🏠🏬");
 	}
	  
 else if (msg.body !== null && msg.body === "3") {

	msg.reply("Fale agora mesmo com uma de nossas atendentes:");

delay(4000).then(async function() {

const contactCard = await client.getContactById('556592789898@c.us');
	    client.sendMessage(msg.from, contactCard)
     		});
   	        
 } 
   
  else if (msg.body !== null && msg.body === "4") {
  msg.reply("Ok, não vamos mais te enviar mensagens por este atendimento virtual. Desculpe 😔"); 
  }

   else if (msg.body !== null || msg.body === "0" || msg.type === 'ptt') {

   	delay(1000).then(async function() {

 	msg.reply("Opção inválida! Por favor digite uma das opções do menu:\n\n1️⃣ Quero fazer minha inscrição\r\n\r\n2️⃣ Quero ser expositor\r\n\r\n3️⃣ Quero falar com com a empresa \r\n\r\n4️⃣ Não me enviem mais mensagens");
		});
      
	}
});

console.log("\nA Politeia desenvolve este e outros sistemas que usam inteligência artificial para facilitar sua interatividade com clientes e fornecedores de maneira simples e eficiente.")
console.log("\nQuer um atendimento como este? Mande uma mensagem agora mesmo para nossa equipe clicando no múmero a seguir: *11977750211*")
    
server.listen(port, function() {
        console.log('Aplicação rodando na porta *: ' + port + ' . Acesse no link: http://localhost:' + port);
});
