// Copyright (C) 2021 Radioactive64

$.ajaxSetup({cache: true, async:false});
$.getScript('/client/js/index.js');
$.getScript('/client/js/entity.js');
$.getScript('/client/js/menu.js');
PLAYER_LIST = {};
BULLET_LIST = {};
MAPS = [];
CURRENT_MAP = 0;
player = null;
camera = {x:0, y:0, width:window.innerWidth/2, height:window.innerHeight/2};
var mouseX;
var mouseY;
var shooting = false;
var ingame;
var inmenu;
var canmove = false;
var consoleAccess = false;
var connected = 0;
var readyforstart = false;

// game handlers
socket.on('game-joined', function() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    ingame = true;
    canmove = true;
    fadeOut();
});
socket.on('gamefull', function() {
    document.getElementById('serverfull').style.display = 'block';
});
socket.on('gamerunning', function() {
    document.getElementById('gamelocked').style.display = 'block';
});
socket.on('initmap', function(maps) {
    for (var i in maps) {
        MAPS[i] = new Image(maps[i].width, maps[i].height);
        if (maps[i].id == 0) {
            MAPS[i].src = '/client/img/Lobby.png';
        } else {
            MAPS[i].src = '/client/img/map' + maps[i].id + '.png';
        }
    }
});
socket.on('map', function(id) {
    CURRENT_MAP = id;
});
socket.on('gamestart', function() {
    if (ingame) {
        document.getElementById('ready').style.display = 'none';
    }
});
socket.on('roundstart', function(scores) {
    if (ingame) {
        fadeOut();
        setTimeout(function() {
            canmove = true;
        }, 3000);
        sfx[0].src = '/client/sound/Countdown.mp3';
        sfx[0].play();
        for (var i in PLAYER_LIST) {
            PLAYER_LIST[i].alive = true;
        }
        for (var i in scores) {
            PLAYER_LIST[scores[i].id].score = scores[i].score;
        }
    }
});
socket.on('roundend', function() {
    if (ingame) {
        fadeIn();
    }
});

// draw game
socket.on('update', function(pkg) {
    if (ingame) {
        game.clearRect(0, 0, window.innerWidth, window.innerHeight);
        drawMap();
        updateCamera();
        if (player.debug) {
            for (var i in pkg) {
                if (pkg[i].id == player.id) {
                    drawDebug(pkg[i].debug);
                }
            }
        }
        Bullet.update();
        Player.update(pkg);
        player = PLAYER_LIST[player.id];
        connected = 0;
        fpsCounter++;
    }
});
function drawMap() {
    game.drawImage(MAPS[CURRENT_MAP], -camera.x, -camera.y);
}
function updateCamera() {
    // collisions to move camera
    if ((camera.width/2) > (player.relx-16)) {
        camera.x -= (camera.width/2) - (player.relx-16);
    }
    if ((camera.width*(3/2)) < (player.relx+16)) {
        camera.x -= (camera.width*(3/2)) - (player.relx+16);
    }
    if ((camera.height/2) > (player.rely-16)) {
        camera.y -= (camera.height/2) - (player.rely-16);
    }
    if ((camera.height*(3/2)) < (player.rely+16)) {
        camera.y -= (camera.height*(3/2)) - (player.rely+16);
    }
    if (camera.x < 0) {
        camera.x = 0;
    }
    if (camera.y < -200) {
        camera.y = -200;
    }
    if ((camera.x+(camera.width*2)) > MAPS[CURRENT_MAP].width) {
        camera.x = (MAPS[CURRENT_MAP].width-(camera.width*2));
    }
    if ((camera.y+(camera.height*2)) > MAPS[CURRENT_MAP].height) {
       camera.y = (MAPS[CURRENT_MAP].height-(camera.height*2));
    }
}
function drawDebug(debugInfo) {
    game.fillStyle = '#FFFFFF88';
    game.fillRect(4, 4, 380, 48);
    game.fillRect((window.innerWidth - 94), 4, 90, 32)
    game.fillStyle = '#000000';
    game.font = '16px Pixel';
    game.textAlign = 'left';
    game.fillText('(x:' + (Math.round(player.x)/40) + ', y:' + (Math.round(player.y)/40) + ')', 8, 24);
    game.fillText('(x:' + (Math.floor(player.x/40)) + ', y:' + (Math.floor(player.y/40)) + ')', 172, 24);
    game.fillText('^x:' + Math.round(debugInfo.xspeed) + ', ^y:' + Math.round(debugInfo.yspeed), 270, 24);
    game.fillText('(x:' + (Math.round(mouseX)/40) + ', y:' + (Math.round(mouseY)/40) + ')', 8, 48);
    game.fillText('Angle:' + (Math.round((Math.atan2(-(player.y-mouseY-16), -(player.x-mouseX))*180)/Math.PI)),176, 48);
    game.font = '24px Pixel';
    game.textAlign = 'right';
    game.fillText('TPS:' + fps, (window.innerWidth-8), 32);
    var tempx = (Math.floor(player.relx/40)*40);
    var tempy = (Math.floor(player.rely/40)*40);
    if (debugInfo.colliding.bottom) {
        game.strokeStyle = 'FF9900';
    } else {
        game.strokeStyle = '000000';
    }
    game.moveTo(tempx, tempy+40);
    game.lineTo(tempx+40, tempy+40);
    //game.stroke();
}

// input sending
document.onkeydown = function(event) {
    if (ingame && !inmenu && player.alive && canmove) {
        if (event.key == 'w' || event.key == 'W' || event.key == 'ArrowUp') {
            socket.emit('keyPress', {key:'W', state:true});
        }
        if (event.key == 'a' || event.key == 'A' || event.key == 'ArrowLeft') {
            socket.emit('keyPress', {key:'A', state:true});
        }
        if (event.key == 'd' || event.key == 'D' || event.key == 'ArrowRight') {
            socket.emit('keyPress', {key:'D', state:true});
        }
    }
}
document.onkeyup = function(event) {
    if (ingame) {
        if (event.key == 'w' || event.key == 'W' || event.key == 'ArrowUp') {
            socket.emit('keyPress', {key:'W', state:false});
        }
        if (event.key == 'a' || event.key == 'A' || event.key == 'ArrowLeft') {
            socket.emit('keyPress', {key:'A', state:false});
        }
        if (event.key == 'd' || event.key == 'D' || event.key == 'ArrowRight') {
            socket.emit('keyPress', {key:'D', state:false});
        }
        if (event.key == 'Escape') {
            if (inmenu) {
                document.getElementById('ingameMenu').style.display = 'none';
                inmenu = false;
            } else {
                document.getElementById('ingameMenu').style.display = 'inline-block';
                inmenu = true;
                socket.emit('keyPress', {key:'W', state:false});
                socket.emit('keyPress', {key:'A', state:false});
                socket.emit('keyPress', {key:'D', state:false});
            }
            
        }
        if (event.code == 'Backslash') {
            player.debug = !player.debug;
            socket.emit('debug');
            if (PLAYER_LIST[player.id].debug) {
                document.getElementById('versionLabel').style.top = '28px';
            } else {
                document.getElementById('versionLabel').style.top = '0px';
            }
            //socket.emit('debug');
        }
    }
}
document.onmousemove = function(event) {
    mouseX = camera.x+event.clientX;
    mouseY = camera.y+event.clientY;
}
document.onmousedown = function(event) {
    mouseX = camera.x+event.clientX;
    mouseY = camera.y+event.clientY;
    if (ingame && !inmenu && canmove && !shooting) {
        switch (event.button) {
            case 0:
                socket.emit('click', {button:'left', x:mouseX, y:mouseY});
                shooting = true; 
            case 2:
                socket.emit('click', {button:'right'});
                shooting = true;
        }
    }
}

// game functions
function fadeIn() {
    canmove = false;
    var fadeAmount = 0;
    var audiofade = (settings.musicvolume*settings.globalvolume);
    document.getElementById('loadingContainer').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
    var fadeInterval = setInterval(function() {
        fadeAmount += 0.01;
        audiofade -= (settings.musicvolume/100);
        if (fadeAmount > 1) {
            clearInterval(fadeInterval);
            document.getElementById('loading').style.display = 'inline-block';
        }
        document.getElementById('fade').style.opacity = fadeAmount;
        music.volume = audiofade;
    }, 1);
}
function fadeOut() {
    var fadeAmount = 1;
    var audiofade = 0;
    document.getElementById('loading').style.display = 'none';
    var fadeInterval = setInterval(function() {
        fadeAmount -= 0.01;
        audiofade += ((settings.musicvolume*settings.globalvolume)/100);
        if (fadeAmount < 0) {
            clearInterval(fadeInterval);
            document.getElementById('loadingContainer').style.display = 'none';
            document.getElementById('fade').style.display = 'none';
        }
        document.getElementById('fade').style.opacity = fadeAmount;
        music.volume = audiofade;
    }, 1);
}
function ready() {
    if (!readyforstart) {
        socket.emit('ready');
        var fadeAmount = 1;
        var fadeInterval = setInterval(function() {
            fadeAmount -= 0.01;
            document.getElementById('ready').style.opacity = fadeAmount;
            if (fadeAmount < 0.5) {
                clearInterval(fadeInterval);
            }
        }, 1); 
        readyforstart = true;
    }
}

// fps counter
setInterval(function() {
    fps = fpsCounter;
    fpsCounter = 0;
}, 1000);

// waiting for server
setInterval(function() {
    if (ingame) {
        connected++;
        if (connected == 10) {
            fadeIn();
            document.getElementById('loading').style.display = 'inline-block';
            document.getElementById('waiting').style.display = 'inline-block';
        }
    }
}, 1000/10);

// console access
consoleAccess = URLSearchParams(window.location.search).get('console');
console.log(consoleAccess)