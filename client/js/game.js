// Copyright (C) 2021 Radioactive64

var mouseX;
var mouseY;
var shooting = false;
var ingame;
var inmenu;
var canmove = false;
var connected = 0;
var readyforstart = false;

// draw game
socket.on('update', function(pkg) {
    if (ingame) {
        game.clearRect(0, 0, window.innerWidth, window.innerHeight);
        drawMap();
        updateCamera();
        if (player.debug) {
            for (var i in pkg) {
                if (pkg[i].id == player.id) {
                    drawDebug(pkg[i], true);
                } else {
                    drawDebug(pkg[i], false);
                }
            }
        }
        Bullet.update();
        Player.update(pkg);
        drawBanners();
        player = PLAYER_LIST[player.id];
        connected = 0;
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
function drawDebug(data, isplayer) {
    if (isplayer) {
        // draw debug headers
        game.fillStyle = '#FFFFFF88';
        game.fillRect(4, 4, 380, 48);
        game.fillRect((window.innerWidth - 94), 4, 90, 64)
        game.fillStyle = '#000000';
        game.font = '16px Pixel';
        game.textAlign = 'left';
        game.fillText('(x:' + (Math.round(player.x)/40) + ', y:' + (Math.round(player.y)/40) + ')', 8, 24);
        game.fillText('(x:' + (Math.floor(player.x/40)) + ', y:' + (Math.floor(player.y/40)) + ')', 172, 24);
        game.fillText('^x:' + Math.round(data.debug.xspeed) + ', ^y:' + Math.round(data.debug.yspeed), 270, 24);
        game.fillText('(x:' + (Math.round(mouseX)/40) + ', y:' + (Math.round(mouseY)/40) + ')', 8, 48);
        game.fillText('Angle:' + (Math.round((Math.atan2(-(player.y-mouseY-16), -(player.x-mouseX))*180)/Math.PI)),176, 48);
        game.font = '24px Pixel';
        game.textAlign = 'right';
        game.fillText('TPS:' + tps, (window.innerWidth-8), 32);
        game.fillText('Ping:' + ping + 'ms', (window.innerWidth-8), 64);
        // tps and ping counter
        tpsCounter++;
        lastDate = Date.now();
        socket.emit('ping');
    }
    // draw collision debug
    game.beginPath();
    var tempx = ((Math.floor(data.x/40)*40)-camera.x);
    var tempy = ((Math.floor(data.y/40)*40)-camera.y);
    if (data.debug.colliding.bottom) {
        game.strokeStyle = '#FF0000';
    } else {
        game.strokeStyle = '#000000';
    }
    game.moveTo(tempx-1, tempy+40);
    game.lineTo(tempx+41, tempy+40);
    game.closePath();
    game.stroke();
    game.beginPath();
    if (data.debug.colliding.top) {
        game.strokeStyle = '#FF0000';
    } else {
        game.strokeStyle = '#000000';
    }
    game.moveTo(tempx-1, tempy);
    game.lineTo(tempx+41, tempy);
    game.closePath();
    game.stroke();
    game.beginPath();
    if (data.debug.colliding.left) {
        game.strokeStyle = '#FF0000';
    } else {
        game.strokeStyle = '#000000';
    }
    game.moveTo(tempx, tempy-1);
    game.lineTo(tempx, tempy+41);
    game.closePath();
    game.stroke();
    game.beginPath();
    if (data.debug.colliding.right) {
        game.strokeStyle = '#FF0000';
    } else {
        game.strokeStyle = '#000000';
    }
    game.moveTo(tempx+40, tempy-1);
    game.lineTo(tempx+40, tempy+41);
    game.closePath();
    game.stroke();
}
socket.on('ping', function() {
    currentDate = Date.now();
    pingCounter = Math.floor(currentDate-lastDate);
});
function drawBanners() {
    for (var i in BANNERS) {
        BANNERS[i].update();
    }
}
// banner init
function Banner(topText, bottomText) {
    j = 0;
    for (var i in BANNERS) {
        j++;
    }
    var self = {id:Math.random(), v:-5, x:window.innerWidth, y:(j*64), top:topText, bottom:bottomText, todelete:false};

    var slidein = setInterval(function() {
        self.v += 0.031;
        self.x += self.v;
    }, 5);
    self.update = function() {
        game.fillStyle = '#222222';
        game.fillRect(self.x, self.y, 400, 60);
        game.fillStyle = '#DDDDDD';
        game.fillRect(self.x+4, self.y+4, 392, 52);
        game.fillStyle = '#000000';
        game.textAlign = 'left';
        game.font = '20px Pixel';
        game.fillText(self.top, self.x+8, self.y+28, 384);
        game.font = '16px Pixel';
        game.fillText(self.bottom, self.x+8, self.y+50, 384);
        if (self.x < (window.innerWidth-400)) {
            self.x = (window.innerWidth-400);
            if (!self.todelete) {
                self.todelete = true;
                clearInterval(slidein);
                setTimeout(function() {
                    var slideout = setInterval(function() {
                        self.v += 0.031;
                        self.x += self.v;
                        if (self.x >= window.innerWidth) {
                            clearInterval(slideout);
                            delete BANNERS[self.id];
                        }
                    }, 5);
                }, 5000);
            }
        }
    }

    BANNERS[self.id] = self;
    return self;
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
    mouseX = camera.x+event.clientX-16;
    mouseY = camera.y+event.clientY-16;
}
document.onmousedown = function(event) {
    mouseX = camera.x+event.clientX-16;
    mouseY = camera.y+event.clientY-16;
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
document.onmouseup = function() {
    shooting = false;
};

// game functions
function fadeIn() {
    canmove = false;
    var fadeAmount = 0;
    var audiofade = (settings.musicvolume*settings.globalvolume);
    document.getElementById('loadingContainer').style.display = 'block';
    document.getElementById('fade').style.display = 'block';
    var fadeInterval = setInterval(function() {
        fadeAmount += 0.01;
        audiofade -= ((settings.musicvolume*settings.globalvolume)/100);
        if (audiofade < 0) {
            audiofade = 0;
        }
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
socket.on('gamestart', function(pkg) {
    if (ingame) {
        document.getElementById('ready').style.display = 'none';
        for (var i in pkg) {
            document.getElementById('player' + i).innerText = pkg[i];
        }
        document.getElementById('scoreContainer').style.display = 'inline';
    }
});
socket.on('winner', function(id) {
    ingame = false;
    canmove = false;
    document.getElementById('loadingContainer').style.display = 'none';
    var v = -10;
    var x = window.innerWidth;
    var slide = setInterval(function() {
        if (x < 200) {
            v *= 0.96;
        }
        x += v;
        game.fillStyle = PLAYER_LIST[id].color;
        game.fillRect(x, 0, window.innerWidth, window.innerHeight);
        if (x < 0.1) {
            clearInterval(slide);
            game.fillRect(0, 0, window.innerWidth, window.innerHeight);
            document.addEventListener('resize', function() {game.fillRect(0, 0, window.innerWidth, window.innerHeight);});
        }
    }, 5);
    var fadeAmount = 1;
    var audiofade = (settings.musicvolume*settings.globalvolume);
    var fadeInterval = setInterval(function() {
        fadeAmount -= 0.01;
        audiofade -= ((settings.musicvolume*settings.globalvolume)/50);
        if (audiofade < 0) {
            audiofade = 0;
        }
        if (fadeAmount < 0.5) {
            clearInterval(fadeInterval);
        }
        document.getElementById('scoreContainer').style.opacity = fadeAmount;
        music.volume = audiofade;
    }, 1);
    setTimeout(function() {
        music.src = '/client/sound/Endscreen.mp3';
        music.play();
        var fadeInterval = setInterval(function() {
            fadeAmount -= 0.01;
            audiofade += ((settings.musicvolume*settings.globalvolume)/50);
            if (audiofade < 0) {
                audiofade = 0;
            }
            if (fadeAmount < 1) {
                clearInterval(fadeInterval);
            }
            document.getElementById('scoreContainer').style.opacity = fadeAmount;
            music.volume = audiofade;
        }, 1);
    }, 500);
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
            document.getElementById('score' + i).innerText = scores[i].score;
        }
    }
});
socket.on('roundend', function() {
    if (ingame) {
        fadeIn();
    }
});
socket.on('inittrackedData', function(pkg) {
    for (var i in pkg.achievements) {
        var localachievement = pkg.achievements[i];
        for (var j in ACHIEVEMENTS) {
            var superlocalachievement = ACHIEVEMENTS[j];
            if (superlocalachievement.id == localachievement.id) {
                superlocalachievement.aqquired = localachievement.aqquired;
            }
        }
    }
    TRACKED_DATA = {kills:pkg.kills, deaths:pkg.deaths, wins:pkg.wins};
});
socket.on('achievement_get', function(pkg) {
    for (var i in ACHIEVEMENTS) {
        if (ACHIEVEMENTS[i].id == pkg.achievement) {
            Banner(pkg.player + ' Achievement Get!', ACHIEVEMENTS[i].name);
            ACHIEVEMENTS[i].aqquired = true;
        }
    }
});

// fps & tps counter
setInterval(function() {
    tps = tpsCounter;
    tpsCounter = 0;
    ping = pingCounter;
}, 1000);

// waiting for server
waiting = setInterval(function() {
    if (ingame) {
        connected++;
        if (connected == 50) {
            fadeIn();
            document.getElementById('loading').style.display = 'inline-block';
            document.getElementById('waiting').style.display = 'inline-block';
        }
    }
}, 1000/10);

function achievementtest() {
    Banner(player.name + ' Achievement Get!', 'Achievements tester');
}