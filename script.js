const querystring = window.location.search;
const urlParameters = new URLSearchParams(querystring);
const StreamerbotPort = urlParameters.get('portInput') || '8080';
const StreamerbotAddress = urlParameters.get('hostInput') || '127.0.0.1';
const minRole = 3;
const maxMessages = 30;
let totalMessages = 0;
let ultimoUsuario = '';
const avatarHashMap = new Map();
const colorHashMap = new Map();
const emoteHashMap = new Map();
var audioNotification = document.createElement('audio');
document.createElement('audioNotification');
audioNotification.setAttribute('src', './static/IPhone WhatsApp sound.mp3');
audioNotification.volume = 0.25;
const checkmark = `<img src='https://img.icons8.com/?size=12&id=21740&format=png&color=00C2FF'/>`;

//CLIENTE//
const client = new StreamerbotClient({
    host: StreamerbotAddress,
    port: StreamerbotPort,
    onConnect: (data) =>{
        console.log(data);
        setConnectionStatus(true);
    },
    onDisconnect: () =>{
        setConnectionStatus(false);
    }
});

//VALIDADORES//
const showAvatar = obtenerBooleanos("mostarAvatar", true);
const showTimestamp = obtenerBooleanos("mostrarTiempo", true);
const showBadges = obtenerBooleanos("mostrarInsigneas", true);
const showImages = obtenerBooleanos("mostrarImagenes", true);
const rolUsuario = urlParameters.get("rolesId") || "4";
const fontSize = urlParameters.get("tamañoFuente") || "18";
const showRedeemMessages = obtenerBooleanos("mostrarCanjes", true);
const showCheerMessages = obtenerBooleanos("mostrarMensajesBits", true);
const showFollowMessage = obtenerBooleanos("mostrarFollow", true);
const showRaidMessage = obtenerBooleanos("mostrarRaids", true);
const excludeCommands = obtenerBooleanos("excluirComandos", true);
const ignoredUsers = urlParameters.get("usuariosIgnorados") || "";
const playSound = obtenerBooleanos("sonidoNotificacion", true);
const backgroundImg = urlParameters.get("imagenFondo") || "";
const colorFondo = urlParameters.get("fondoColor") || "#000000";
const opacity = urlParameters.get("opacidad") || 0.75;

const body = document.body;
const hexToRgb = (hex) => {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const { r, g, b } = hexToRgb(colorFondo);
body.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;;

const main = document.getElementById('main-container');
main.style.backgroundImage = `url(${backgroundImg})`;

//EVENTOS//
client.on('Twitch.ChatMessage', (response) => {
    // if(response.data.user.name === 'ChemitaDev'){
    //     ChatMessageIsMe(response.data);
    // }else{
    //     ChatMessage(response.data);
    // }
    ChatMessage(response.data);
    
})

client.on('Twitch.Follow', (response) => {
    if(showFollowMessage){
        FollowNotification(response.data);
    }
})

client.on('Twitch.Raid', (response) => {
    if(showRaidMessage){
        RaidNotification(response.data);
    }
})

client.on('Twitch.UserTimeOut', (response)=> {
    TimeoutUser(response.data);
})

client.on('Twitch.UserBanned', (response)=> {
    BannedUser(response.data);
})

//MENSAJE DE CHAT//
async function ChatMessage(data) {
    console.log(data);
    //ASIGNACION DE VALORES OBTENIDOS DEL DATA//
    const usuario = data.user.name;
    const uid = data.message.userId;
    const role = data.user.role;
    const color = data.user.color;
    const msgId = data.messageId;
    const esRespuesta = data.message.isReply;
    let message = data;
    let badges = '';
    let avatarImageUrl = '';
    let timestamp= '';

    let replyUser = '';
    let replyUserId = '';
    let replyMsg = '';
    let replyMsgId = '';

    //AQUI ASIGNAMOS LOS COLORES AL HASHMAP//
    colorHashMap.set(usuario, color);

    //VALORES PARA LA RESPUESTA//
    if(esRespuesta){
         replyUser = data.message.reply.userName;
         replyUserId = data.message.reply.Id;
         replyMsg = data.message.reply.msgBody;
         replyMsgId = data.message.reply.msgId;
    }
    
    
    //VERIFICAMOS SI LOS COMANDOS SON EXCLUIDOS//
    if(data.message.message.startsWith("!") && excludeCommands){
        return;
    }

    //VERIFICAMOS SI EL USUARIO ES IGNORADO//
    if(ignoredUsers.includes(usuario)){
        return;
    }

    //ASIGNAR AVATAR//
    if(!avatarHashMap.has(usuario)){
        try{
            const avatarUrl = await obtenerAvatar(usuario);
            avatarHashMap.set(usuario, avatarUrl);
        }catch(e){
            avatarHashMap.set(usuario, "default-avatar-url.png");
        }
    }
    const avatarUrl = avatarHashMap.get(usuario);

    if(showAvatar){
        avatarImageUrl = `<img src="${avatarUrl}" id="avatar"/>`;
    }else{
        avatarImageUrl = `<img src="${avatarUrl}" id="avatar" style="display: none"/>`;
    }

    //OBTENCION DE INSIGNIAS//
    for(i in data.message.badges){
        const badge = new Image();
        badge.src = data.message.badges[i].imageUrl;
        badge.classList.add("badge");
        if(showBadges){
            badges += `<img src="${badge.src}" id="badge"/>`;
        }else{
            badges += `<img src="${badge.src}" id="badge" style="display: none"/>`;
        }
        
    }

    //OBTENCION DE EMOTES//
    message = agregarEmotes(message);
    replyMsg = agregarEmotesARespuestas(replyMsg);

    //REGEX PARA IMAGENES//
    const imgRegex = /^https:\/\/.*\.(gif|png|jpg|jpeg|webp)$/;
    const imgMatch = message.match(imgRegex);
        //true && 1 >= 0 && 0 != 0 && true
    if (imgMatch && role >= rolUsuario && rolUsuario != 0 && showImages) {
            const imgSrc = imgMatch[0];
            const imgTag = `<img src="${imgSrc}" alt="Image" id="imgur-image" />`;
            message = message.replace(imgMatch[0], imgTag);
    } else {
        console.log("No cuenta con el permiso necesario o no es imagen");
    }

    //TIMESTAMP//
    const now = new Date();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const time = `${horas}:${minutos}`;
    if(showTimestamp){
        timestamp = `<span id="time">${time}</span>`;
    }else{
        timestamp = `<span id="time" style="display: none">${time}</span>`;
    }

    totalMessages += 1;

    //MENSAJE ARMADO//
    if(esRespuesta){
        message = message.replace(/^@\w+\s*/, '');
        replyMsg = replyMsg.replace(/^@\w+\s*/, '');
        if(ultimoUsuario !== usuario){
            ultimoUsuario = usuario;
            const replyUserColor = colorHashMap.get(replyUser) || "#aaa";
            element = `
            <div data-sender="${uid}" data-msgid="${msgId}" class="message-wrapper animated new-user" style="margin-top:10px" id="msg-${totalMessages}">
              ${avatarImageUrl}
              <div class="message received">
                <div class="user-line">
                  <strong class="username" style="color:${color}">${usuario}</strong>
                  <span class="badges">${badges}</span>
                </div>
                <div>
                    <div data-sender="${replyUserId}" data-msgid="${replyMsgId}" class="messageReply-wrapper">
                        <div class="replyInfo">
                            <strong class="replyUser" style="color: ${replyUserColor}">${replyUser}</strong><br>
                            <div id="replyMsg" class="message-body" style="font-size: ${fontSize}px">${replyMsg}</div>
                        </div>
                    </div>
                </div>
                <div id="user-message" class="message-content" style="font-size: ${fontSize}px margin-left: 10px">${message}</div>
                <span class="metadata"><span class="time">${timestamp}</span></span>
              </div>
            </div>`;

        } else{
            const replyUserColor = colorHashMap.get(replyUser) || "#aaa";
            element = `
            <div data-sender="${uid}" data-msgid="${msgId}" class="message-row animated same-user" style="margin-top:4px" id="msg-${totalMessages}">
                <div class="message received no-tail">
                <div>
                    <div data-sender="${replyUserId}" data-msgid="${replyMsgId}" class="messageReply-wrapper">
                        <div class="replyInfo">
                            <strong class="replyUser" style="color: ${replyUserColor}">${replyUser}</strong><br>
                            <div id="replyMsg" class="message-body" style="font-size: ${fontSize}px">${replyMsg}</div>
                        </div>
                    </div>
                </div>
                <span id="user-message" style="font-size: ${fontSize}px margin-left: 10px">${message}</span>
                <span class="metadata"><span class="time">${timestamp}</span></span>
                </div>
            </div>`;
        }
    }else{
    if (ultimoUsuario !== usuario) {
        ultimoUsuario = usuario;
        element = `
          <div data-sender="${uid}" data-msgid="${msgId}" class="message-wrapper animated new-user" style="margin-top:10px" id="msg-${totalMessages}">
            ${avatarImageUrl}
            <div class="message received">
              <div class="user-line">
                <strong class="username" style="color:${color}">${usuario}</strong>
                <span class="badges">${badges}</span>
              </div>
              <div id="user-message" class="message-content" style="font-size: ${fontSize}px">${message}</div>
              <span class="metadata"><span class="time">${timestamp}</span></span>
            </div>
          </div>`;
      } else {
        element = `
          <div data-sender="${uid}" data-msgid="${msgId}" class="message-row animated same-user" style="margin-top:4px" id="msg-${totalMessages}">
            <div class="message received no-tail">
              <span id="user-message" style="font-size: ${fontSize}px">${message}</span>
              <span class="metadata"><span class="time">${timestamp}</span></span>
            </div>
          </div>`;
      }
    }    

    $('#main-container').prepend(element);

    gsap.fromTo(`#msg-${totalMessages}`,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
    
    document.querySelectorAll(".main-container .message-row").forEach((el, i) => {
        if (i >= maxMessages) {
          gsap.timeline().to(el, { opacity: 0 }).add(() => {
            el.remove();
          });
        }
    });
}

//FOLLOW//
async function FollowNotification(data) {
    ultimoUsuario = "";
    const usuario = data.user_name;
    const uid = data.user_id;
    const notificacion = `Se añadio a ${usuario}`;

    totalMessages += 1;

    const element = `
         <div data-sender="${uid}" class="follow-row" id="msg-${totalMessages}">
            <div class="follow .received">
                <span id="follow-message" style="font-size: ${fontSize}px">${notificacion}</span>
            </div>
        </div>
    `;

    $('#main-container').prepend(element);

    gsap.fromTo(`#msg-${totalMessages}`,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
    
    document.querySelectorAll(".main-container .message-row").forEach((el, i) => {
        if (i >= maxMessages) {
          gsap.timeline().to(el, { opacity: 0 }).add(() => {
            el.remove();
          });
        }
    });
}

//RAID//
async function RaidNotification(data) {
    if(playSound){
        audioNotification.play(); 
    }
    const usuario = data.from_broadcaster_user_name;
    const cantidad = data.viewers;
    const avatarUrl = await obtenerAvatar(usuario);
    let texto = '';
    if(cantidad == 1){
        texto = `Bro, estamos afuera y traje a un invitado`;
    }else{
        texto = `Bro, estamos afuera y traje a ${cantidad} invitados`;
    }
    

    const now = new Date();
    const time = now.toTimeString().slice(0, 5);

    const element = $(`
        <div class="raid-notification-container">
            <div class="raid-notification-wrapper">
                <span class="raid-usuario">
                    <img src="${avatarUrl}" class="raid-avatar" />
                    ${usuario}
                    <span class="raid-time">${time}</span>
                </span>
                <div class="raid-texto">${texto}</div>
            </div>
        </div>
    `);

    $('.notification-zone').prepend(element);

    setTimeout(() => {
        element.addClass('show');
    }, 50);

    setTimeout(() => {
        element.removeClass('show');
        setTimeout(() => element.remove(), 400);
    }, 5000);
}

//TIMEOUT USER//
async function TimeoutUser(data){
    const sender = data.user_id;
    $(`.message-row[data-sender=${sender}]`).remove();
}

//BANNED USER//
async function BannedUser(data){
    const sender = data.user_id;
    $(`.message-row[data-sender=${sender}]`).remove();
}

//HELPERS//
function agregarEmotes(message){
    let text = html_encode(message.text);
    let emotes = message.emotes;

    text = text.replace(/([^\s]*)/gi, 
        function (m, key){
            let result = emotes.filter(emote => {
                return emote.name === key
            });
            if(typeof result[0] !== "undefined"){
                let url = result[0]['imageUrl'];
                if(!emoteHashMap.has(key)){
                    emoteHashMap.set(key, url);
                }
                return `<img alt="" src="${url}" id="emotes"/>`;
            }else return key;
        }
    );
    return text;
}

function agregarEmotesARespuestas(reply){
     let text = html_encode(reply);
     text = text.replace(/([^\s]+)/g, (match) => {
         if (emoteHashMap.has(match)) {
             const url = emoteHashMap.get(match);
             return `<img alt="${match}" src="${url}" id="emotes"/>`;
         }
         return match;
     });
     return text;
}

function html_encode(e) {
    return e.replace(/[<>"^]/g, function (e) {
        return "&#" + e.charCodeAt(0) + ";";
    });
}

async function obtenerAvatar(username){
    let response = await fetch('https://decapi.me/twitch/avatar/'+username);
    let data = await response.text();
    return data;
}

function obtenerBooleanos(parametro, valor){
    const urlParams = new URLSearchParams(window.location.search);

    console.log(urlParams);

    const valorParametro = urlParams.get(parametro);

    if(valorParametro === null){
        return valor;
    }

    if(valorParametro === 'true'){
        return true;
    }else if(valorParametro === 'false'){
        return false;
    }else{
        return valor;
    }
}

//STREAMERBOT STATUS FUNCTION//

function setConnectionStatus(connected){
    let statusContainer = document.getElementById('status-container');
    if(connected){
        statusContainer.style.background = "#2FB774";
        statusContainer.innerText = "CONECTADO!";
        statusContainer.style.opacity = 1;
        setTimeout(() => {
            statusContainer.style.transition = "all 2s ease";
            statusContainer.style.opacity = 0;
        }, 10);
    }else{
        statusContainer.style.background = "FF0000";
        statusContainer.innerText = "CONECTANDO...";
        statusContainer.style.transition = "";
        statusContainer.style.opacity = 1;
    }
}

const data = {
    "from_broadcaster_id": 123456,
    "from_broadcaster_user_login": "shroud",
    "from_broadcaster_user_name": "Shroud",
    "viewers": 13
};

//RaidNotification(data);


//FollowNotification(data);

// setInterval(() => {
//     RaidNotification(data);
// }, 3000);
