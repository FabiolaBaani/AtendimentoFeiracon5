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
const port = process.env.PORT || 8005;
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
  socket.emit('message', '© BOT-POLITEIA - Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-POLITEIA QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© BOT-POLITEIA Dispositivo pronto!');
    socket.emit('message', '© BOT-POLITEIA Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('© BOT-POLITEIA Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-POLITEIA Autenticado!');
    socket.emit('message', '© BOT-POLITEIA Autenticado!');
    console.log('© BOT-POLITEIA Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BOT-POLITEIA Falha na autenticação, reiniciando...');
    console.error('© BOT-POLITEIA Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BOT-POLITEIA Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BOT-POLITEIA Cliente desconectado!');
  console.log('© BOT-POLITEIA Cliente desconectado', reason);
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
      message: 'BOT-POLITEIA Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Mensagem não enviada',
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
      message: 'BOT-POLITEIA Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, media).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, media).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-POLITEIA Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-POLITEIA Imagem não enviada',
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
 delay(2000).then(async function() {

const stickers = MessageMedia.fromFilePath('./images/sticker.png');
client.sendMessage(stickers, { sendMediaAsSticker: true })

});
	msg.reply("Clique no link abaixo e efetue sua inscrição!");

	delay(2000).then(async function() {
	const media = MessageMedia.fromFilePath('./images/cardinsc');
	client.sendMessage(msg.from, media, {caption: 'link'})
		});

 	}
	
   else if (msg.body !== null && msg.body === "2") {

delay(2000).then(async function() {

const stickers = MessageMedia.fromFilePath('./images/cardexpo');
client.sendMessage(stickers, { sendMediaAsSticker: true })

});
	msg.reply("Clique no link abaixo e efetue sua inscrição!");

	delay(2000).then(async function() {
	const media = MessageMedia.fromFilePath('./images/card');
	client.sendMessage(msg.from, media, {caption: 'link'})
		});

 	}
	  
 else if (msg.body !== null && msg.body === "3") {

	msg.reply("Fale agora mesmo com uma de nossas atendentes:");

delay(4000).then(async function() {

const contactCard = await client.getContactById('556592789898@c.us');
	    client.sendMessage(msg.from, contactCard)
     		});
   	        
 } 
   
  else if (msg.body !== null && msg.body === "12") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
  
 else if (msg.body !== null && msg.body === "13") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
  
 else if (msg.body !== null && msg.body === "14") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }

  else if (msg.body !== null && msg.body === "15") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
	  
else if (msg.body !== null && msg.body === "16"){
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
    
  else if (msg.body !== null && msg.body === "17") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
  
  else if (msg.body !== null && msg.body === "18") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
  
  else if (msg.body !== null && msg.body === "19") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
  
  else if (msg.body !== null && msg.body === "20") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
  
  else if (msg.body !== null && msg.body === "21") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }
  
  else if (msg.body !== null && msg.body === "22") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }

  else if (msg.body !== null && msg.body === "23") {
  msg.reply("Opção inválida! 📵\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }

  else if (msg.body === '!mediainfo' && msg.hasMedia) {
  msg.reply("Desculpe, não entendo mensagens de voz por enquanto 😔\nEscolha um número do menu principal por favor, ou digite *9* para falar com um atendente."); 
  }

 else if (msg.body !== null && msg.body === "N") {
   const chat = await msg.getChat();
   msg.reply("Ok, não vamos mais te enviar mensagens por este atendimento virtual. Desculpe 😔"); 
  
        // mute the chat for 60 seconds
        //async muteChat(chatId, unmuteDate) {
  }

 else if (msg.body !== null && msg.body === "n") {
  msg.reply("Ok, não vamos mais te enviar mensagens por este atendimento virtual. Desculpe 😔"); 
  }

   else if (msg.body !== null || msg.body === "0" || msg.type === 'ptt') {

   	delay(12000).then(async function() {

 	msg.reply("Olá *" + nomeContato + "*, você está agora conversando com o que há de mais moderno em atendimento digital para WhatsApp.\nPor aqui suas dúvidas serão todas respondidas, mas caso não seja suficiente, pode falar diretamente com alguém.\nO contato segue no final da conversa 😉");
	
	const saudacao = ("🤖 A *robotização* veio pra ficar, é inegável!\n\n✅ E você não precisa estar *disponível o tempo todo* para seus clientes, mas sua empresa sim!\n\n👩🏽‍💻 Instale uma *secretária virtual* e nunca mais deixe alguém esperando para ser atendido!\n\n🪙 Com *pouco investimento* você pode oferecer atendimento profissional *24 horas*, o ano todo!\n\n🎯 Direcione o contato dos seus *anúncios patrocinados* para o robô também e aumente sua carteira de clientes!\n\n*Quer saber mais?* Vou te mostrar como funciona ⬇️");
	
	const saudacao1 = ("Este é o nosso atendimento digital, você pode resolver suas dúvidas e ter um exemplo do que pode oferecer aos seus clientes.\n\nPara começar digite o número de uma das opções abaixo:");
	
	client.sendMessage(msg.from, saudacao);	
	client.sendMessage(msg.from, saudacao1);

		});
      
	delay(23000).then(async function() {

const saudacao2 = ("1️⃣ Quero saber como funciona esse robô de WhatsApp \r\n\r\n2️⃣ Quais equipamentos preciso ter para iniciar este serviço?\r\n\r\n3️⃣ Vocês fazem disparos de WhatsApp? \r\n\r\n4️⃣ Funciona no Brasil todo?\r\n\r\n5️⃣ Consigo enviar anexos como fotos, textos, áudios e vídeos?\r\n\r\n6️⃣ Preciso estar com meu celular conectado para que funcione? \r\n\r\n7️⃣ Preciso de um número exclusivo para o atendimento? \r\n\r\n8️⃣ Quanto custa este serviço?\r\n\r\n9️⃣ Minha dúvida não está aqui, quero falar com alguém da Politeia\r\n\r\nPara mais detalhes, visite nosso site:\nhttps://www.politeiaid.com.br/\r\n\r\nCaso não queira mais receber mensagens deste atendimento virtual, por favor digite *N*");

	client.sendMessage(msg.from, saudacao2);
		});
	}
});

console.log("\nA Politeia desenvolve este e outros sistemas que usam inteligência artificial para facilitar sua interatividade com clientes e fornecedores de maneira simples e eficiente.")
console.log("\nQuer um atendimento como este? Mande uma mensagem agora mesmo para nossa equipe clicando no múmero a seguir: *11977750211*")
    
server.listen(port, function() {
        console.log('Aplicação rodando na porta *: ' + port + ' . Acesse no link: http://localhost:' + port);
});
