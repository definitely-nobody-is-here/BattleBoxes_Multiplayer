// Copyright (C) 2021 Radioactive64'

round = {inProgress:false, number:0};
gameinProgress = false;
const achievementsTemplate = require('./Achievements.json').data;

// game functions
startGame = function() {
    endRound();
    var pack = [];
    for (var i in PLAYER_LIST) {
        var localplayer = PLAYER_LIST[i];
        if (localplayer.ingame) {
            localplayer.score = 0;
            pack.push(localplayer.name);
        }
    }
    setTimeout(function () {
        io.emit('gamestart', pack);
        gameinProgress = true;
        startRound();
    }, 1000);
}
endGame = function(id) {
    if (id != null) {
        io.emit('winner', id);
        Achievements.update();
    }
    round.inProgress = false;
    gameinProgress = false;
    setTimeout(function() {
        CURRENT_MAP = 0;
        io.emit('map', CURRENT_MAP);
    }, 1000)
}
// round functions
startRound = function() {
    if (gameinProgress) {
        switch (Math.floor(Math.random()*3)) {
            case 0:
                CURRENT_MAP = 1;
                break;
            case 1:
                CURRENT_MAP = 2;
                break;
            case 2:
                CURRENT_MAP = 3;
                break;
            default:
                break;
        }
        io.emit('map', CURRENT_MAP);
        var j = 0;
        var pack = [];
        var pack2 = [];
        for (var i in PLAYER_LIST) {
            localplayer = PLAYER_LIST[i];
            if (localplayer.ingame) {
                localplayer.respawn(MAPS[CURRENT_MAP].spawns[j].x, MAPS[CURRENT_MAP].spawns[j].y);
                pack.push({id:localplayer.id, x:localplayer.x, y:localplayer.y, hp:localplayer.hp, debug:{xspeed:localplayer.xspeed, yspeed:localplayer.yspeed, colliding:{left:localplayer.colliding.left, right:localplayer.colliding.right, bottom:localplayer.colliding.bottom, top:localplayer.colliding.top}}});
                pack2.push({id:localplayer.id, score:localplayer.score});
                j++;
            }
        }
        remainingPlayers = 0;
        for (var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].ingame) {
                remainingPlayers++;
            }
        }
        io.emit('update', pack);
        io.emit('roundstart', pack2);
        round.inProgress = true;
    }
}
endRound = function() {
    io.emit('roundend');
    round.inProgress = false;
    var nextround = true;
    for (var i in PLAYER_LIST) {
        var localplayer = PLAYER_LIST[i];
        if (localplayer.alive) {
            localplayer.score++;
            if (localplayer.score > 9) {
                localplayer.trackedData.wins++;
                endGame(localplayer.id);
                nextround = false;
                for (var j in PLAYER_LIST) {
                    localplayer.score = 0;
                }
            }
        }
    }
    for (var i in BULLET_LIST) {
        delete BULLET_LIST[i];
    }
    if (remainingPlayers != 0 && nextround && gameinProgress) {
        setTimeout(function () {
            startRound();
        }, 1000);
    }
}

// achievements
Achievements = function() {
    var self = {achievements:achievementsTemplate, kills:0, deaths:0, wins:0};
    // temporary hard-coding while linking is fixed
    self.achievements = [
        {id:"1_Wins", name:"Winner Winner Chicken Dinner", aqquired:false},
        {id:"10_Wins", name:"Master of Gaming", aqquired:false},
        {id:"100_Wins", name:"The Ultimate Champion", aqquired:false},
        {id:"1000_Wins", name:"Unparalleled Dominance", aqquired:false},
        {id:"1_Kills", name:"Pew pew gun!", aqquired:false},
        {id:"10_Kills", name:"Assassin", aqquired:false},
        {id:"100_Kills", name:"Hitman", aqquired:false},
        {id:"1000_Kills", name:"Homocide", aqquired:false},
        {id:"Snipe", name:"Sniper", aqquired:false},
        {id:"1_Deaths", name:"YOU DIED!", aqquired:false},
        {id:"10_Deaths", name:"Careless but Alive", aqquired:false},
        {id:"100_Deaths", name:"Witchcraft", aqquired:false},
        {id:"1000_Deaths", name:"Immortal", aqquired:false},
        {id:"1000000_Deaths", name:"How did we get get here?", aqquired:false},
        {id:"Debug", name:"Debugger", aqquired:false},
        {id:"invalid", name:"Hacker", aqquired:false}
    ]
    return self;
}
Achievements.update = function() {
    for (var i in PLAYER_LIST) {
        var localplayer = PLAYER_LIST[i];
        if (localplayer.ingame) {
            localplayer.checkAchievements();
        }
    }
}
// debug
Achievements.log = function() {
    for (var i in PLAYER_LIST) {
        var localplayer = PLAYER_LIST[i];
        console.log(localplayer.trackedData);
    }
}