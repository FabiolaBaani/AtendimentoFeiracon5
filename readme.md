# BOT POLITEIA WHATSAPP

### Como usar?

Se a instalção for feita pela primeira vez:

- sudo su root
- cd -
- apt update
- apt upgrade
- curl - fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
- sudo apt-get install -y node.js
- apt-get install libnss3-dev libgdk-pixbuf2.0-dev libxss-dev libasound2
- git clone https://github.com/FabiolaBaani/DisparoZap.git
- cd DisparoZap
- sudo npm install
- npm start
- sudo npm install -g pm2
- npm install github:alechkos/whatsapp-web.js#fix-call-collection
- pm2 start botzdg.js

Depois de instalado:

- Abrir o browser no endereço `http://localhost:8000`
- Ler o QRCode na tela
