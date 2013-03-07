var gamejs = require('gamejs');
var view = require('./view');

gamejs.preload(['./data/tiles.png', './data/player_r_n.png', './data/player_l_n.png', './data/player_r_s.png',
    './data/player_l_s.png', './data/player_r_g.png', './data/player_l_g.png', './data/player_r_sp.png',
    './data/player_l_sp.png', './data/enemy_1_l.png', './data/enemy_1_r.png', './data/enemy_2_l.png', './data/enemy_2_r.png',
    './data/enemy_3_l.png', './data/enemy_3_r.png', './data/hero.png','./data/splash.png',
    './data/_s.png','./data/_s_a.png', './data/_g_a.png','./data/steam.png',
    './data/_g.png', './data/_sp.png','./data/_sp_a.png', './data/_n.png', './data/box.png','./data/_n_a.png','./data/gameover.png' ]);

//Cheats
var DEBUG = true;

//Font
var font = new gamejs.font.Font("12px Verdana");

//Level
var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 480;
var TILE_SIZE = 16;
var CAMERA_MOVE_OFFSET = 32;
var TMX_FILE = './data/testlevel1.tmx';

//Physics
var GRAVITY = 60;
var JUMP_IMPULSE = 15;

//Player
var DIR_LEFT = "_l";
var DIR_RIGHT = "_r";

//Items
var ITEM_SWORD = "_s";
var ITEM_GUN = "_g";
var ITEM_SPRING = "_sp";
var ITEM_NONE = "_n";
var ITEM_ACTIVATED = "_a";
var INFO_TIME = 2;
var ITEM_KEYS = {
    none : gamejs.event.K_4,
    sword : gamejs.event.K_1,
    spring : gamejs.event.K_2,
    gun : gamejs.event.K_3
};

//Misc
var map;
var player;
var enemies;
var infobox = new Info(" ");
var menu = [];
var triggers = [];

addTrigger(new gamejs.Rect([96,192], [32,32]),function(){infobox =new Info("Press A or D");});
addTrigger(new gamejs.Rect([(8*3*TILE_SIZE),192], [32,32]),function(){infobox =new Info("Press W to jump");});
addTrigger(new gamejs.Rect([(124*TILE_SIZE),23*TILE_SIZE], [32,32]),function(){
    infobox = new Info("Ohh some Springs!\n(switch with 1 and 2 your item)");
    player.inventory.push(ITEM_SPRING);
    menu[ITEM_SPRING] = new Item(ITEM_SPRING, [32+10,5], function(event) {
        if (event.key === ITEM_KEYS.spring) {
            for (i in menu) {
                menu[i].deactivate();
            }
            menu[ITEM_SPRING].active();
            console.log(menu);
        }
    });
});

/*menu[ITEM_GUN]=new Item(ITEM_GUN,[64+15,5],function(event){
 if (event.key === ITEM_KEYS.gun) {
 for (i in menu) {
 menu[i].deactivate();
 }
 menu[ITEM_GUN].active();
 }
 });
 menu[ITEM_NONE]=new Item(ITEM_NONE,[96+20,5],function(event){
 if (event.key === ITEM_KEYS.none) {
 for (i in menu) {
 menu[i].deactivate();
 }
 menu[ITEM_NONE].active();
 }
 });*/

function addTrigger(rect, callback){
    var obj = { callback:callback, rect:rect };
    triggers.push(obj);
}

function checkForTrigger() {

    triggers.forEach( function(trigger) {
        if(player.rect.collideRect(trigger.rect)){
            trigger.callback();
        }
    });
}

function Info(text){

    this.pos=[0,0];
    this.existingTime=0;
    this.infobox = font.render(text, "rgba(255,255,255,1)");
    this.update = function(dt) {

       this.pos=[player.rect.left+16-(this.infobox.getSize()[0]/2),player.rect.top];
        this.pos[1] -= 20;
       this.existingTime += dt;
    }
    //this.background=new Rect( "rgba(255,255,00,1)",this.pos, this.infobox.getSize());

    this.draw = function(display) {

        if(this.existingTime <= INFO_TIME){
            gamejs.draw.rect(display, "rgba(0,0,255,1)", 120, 0);
            display.blit(this.infobox, this.pos)
        }
    }
}

function Item(name,position,handle) {
    this.active = false;
    this.name = name;
    Item.superConstructor.apply(this, arguments);

    this.image = gamejs.image.load("./data/" + name + ".png");
    this.size = this.image.getSize();
    this.rect = new gamejs.Rect(position, this.size);

    this.active = function() {
        this.image = gamejs.image.load("./data/" + this.name + ITEM_ACTIVATED + ".png");
    }

    this.deactivate = function() {
        this.image = gamejs.image.load("./data/" + this.name + ".png");
    }

    this.update = function(dt) {

    };

    this.handle = handle;
}
gamejs.utils.objects.extend(Item, gamejs.sprite.Sprite);

function SplashScreen() {
    this.showSplash=true;
    SplashScreen.superConstructor.apply(this, arguments);

    this.image = gamejs.image.load("./data/splash.png");
    this.size = this.image.getSize();
    this.rect = new gamejs.Rect([0,0], this.size);
    this.gameover = false;

    this.setGameOver = function() {
        this.gameover = true;
        this.image = gamejs.image.load("./data/gameover.png");
    };

    this.update = function(dt) {

    };

    this.handle = function(event) {

        if (event.type === gamejs.event.MOUSE_DOWN) {
            this.showSplash=false;
            if (this.gameover) {
                window.location.reload();
            }
        }
    };
}
gamejs.utils.objects.extend(SplashScreen, gamejs.sprite.Sprite);

function Entity() {
    Entity.superConstructor.apply(this, arguments);

    this.velocity = 0;
    this.isAtGround = false;

    this.updatePhysics = function(dt) {
        this.isAtGround = !map.canMove(this, 0, 0.01);

        //Calculate new Y
        if (!this.isAtGround) {
            this.velocity += GRAVITY * dt;

            //Collide with ceiling
            if (this.velocity < 0 && !map.canMove(this, 0, -0.01)) {
                this.velocity = 0;
            }
        }
        //Collide with ground
        else if (this.velocity > 0) {
            this.velocity = 0;
        }

        map.move(this, 0, this.velocity);
    };
}
gamejs.utils.objects.extend(Entity, gamejs.sprite.Sprite);

function Player(position) {
    Player.superConstructor.apply(this, arguments);

    //Load image
    this.image = gamejs.image.load('./data/player_r_n.png');

    //Set startup position
    this.rect = new gamejs.Rect(position, this.image.getSize());

    //State variables
    this.speed = 200;
    this.xDir = 0;
    this.dir = DIR_RIGHT;
    this.item = ITEM_SWORD;
    this.alive = true;
    this.inventory = [];
    this.inventory.push(ITEM_SWORD);

    this.isInInventory = function(item) {
        for(i in this.inventory) {
            if(item == this.inventory[i]){
                return true;
            }
        }
        return false;
    };

    this.handle = function(event) {
        if (event.type === gamejs.event.KEY_DOWN) {
            if (event.key === gamejs.event.K_a && this.xDir == 0) {
                this.xDir = -1 * (this.item==ITEM_NONE ? 2 : 1);
                this.dir = DIR_LEFT;
            }
            if (event.key === gamejs.event.K_d && this.xDir == 0) {
                this.xDir = (this.item==ITEM_NONE ? 2 : 1);
                this.dir = DIR_RIGHT;
            }
            if (event.key === gamejs.event.K_w && this.isAtGround) {
                this.velocity = -JUMP_IMPULSE*(this.item==ITEM_SPRING?2:1);
            }
            if (event.key === ITEM_KEYS.sword&&player.isInInventory(ITEM_SWORD)) {
                this.item = ITEM_SWORD;
            }
            if (event.key === ITEM_KEYS.gun&&player.isInInventory(ITEM_GUN)) {
                this.item = ITEM_GUN;
            }
            if (event.key === ITEM_KEYS.spring&&player.isInInventory(ITEM_SPRING)) {
                this.item = ITEM_SPRING;
            }
            if (event.key === ITEM_KEYS.none&&player.isInInventory(ITEM_NONE)) {
                this.item = ITEM_NONE;
            }
            //Cheats
            if (DEBUG) {
                if (event.key === gamejs.event.K_LEFT) { this.rect.left -= 10; }
                if (event.key === gamejs.event.K_RIGHT) { this.rect.left += 10; }
                if (event.key === gamejs.event.K_UP) { this.rect.top -= 100; }
                if (event.key === gamejs.event.K_DOWN) { this.rect.top += 100; }
            }
        }
        else if (event.type === gamejs.event.KEY_UP) {
            if (event.key === gamejs.event.K_a) this.xDir = 0;
            if (event.key === gamejs.event.K_d) this.xDir = 0;
        }
    };

    this.update = function(dt) {

        //Calculate new X
        var x = this.xDir * this.speed * dt;
        map.move(this, x, 0);

        //Falling etc.
        this.updatePhysics(dt);

        //TODO Fix for performance
        this.image = gamejs.image.load('./data/player' + this.dir + this.item + '.png');

        //Kill
        if (!DEBUG && map.hitsKillingObject(this)) {
            this.alive = false;
        }
    };
}
gamejs.utils.objects.extend(Player, Entity);

function Enemy(imagePath, pos, speed, health) {
    Enemy.superConstructor.apply(this, arguments);

    this.imageR = gamejs.image.load('./data/' + imagePath + '_r.png');
    this.imageL = gamejs.image.load('./data/' + imagePath + '_l.png')
    this.image = this.imageR;

    this.size = this.image.getSize();
    this.rect = new gamejs.Rect([pos[0], pos[1] - TILE_SIZE], this.size);

    this.direction = 1;
    this.speed = speed;
    this.health = health;
}
gamejs.utils.objects.extend(Enemy, Entity);

function WalkingEnemy(imagePath, pos, speed, health) {

    WalkingEnemy.superConstructor.apply(this, arguments);

    this.update = function(dt) {

        //Move
        var x = this.speed * this.direction * dt;
        if (map.canMove(this, x, 0)) {
            map.move(this, x, 0);
        }
        //Change direction
        else {
            this.direction *= -1;
            this.direction > 0 ? this.image = this.imageR : this.image = this.imageL;
        }

        //Falling etc.
        this.updatePhysics(dt);
    };
}
gamejs.utils.objects.extend(WalkingEnemy, Enemy);

function main() {

    //Initialize screen
    var display = gamejs.display.setMode([SCREEN_WIDTH, SCREEN_HEIGHT]);

    //Initialize variables
    player = new Player([96, 48]);
    enemies = new gamejs.sprite.Group();

    var createEnemy = function(type, pos) {

        if (type === "enemy1") {
            enemies.add(new WalkingEnemy("enemy_1", pos, 100, 2));
        }
        else if (type === "enemy2") {
            enemies.add(new WalkingEnemy("enemy_2", pos, 150, 1));
        }
    };

    var splashScreen = new SplashScreen();
    splashScreen.showSplash=false;
    menu = [];

    //Initialize map
    map = new view.Map(TMX_FILE);
    map.loadObjects(createEnemy);

    menu[ITEM_SWORD]=new Item(ITEM_SWORD,[0+5,5],function(event){
        if (event.key === ITEM_KEYS.sword) {
            for (i in menu) {
                menu[i].deactivate();
            }
            menu[ITEM_SWORD].active();
        }
    });

    menu[ITEM_SWORD].active();

    //The gameloop
    function gameTick(gameTime) {

        update(gameTime);
        draw();
    }
    gamejs.time.interval(gameTick, 30, this);

    function update(gameTime) {

        var dt = gameTime / 1000;

        //Process input
        gamejs.event.get().forEach(function(event) {
            player.handle(event);
            splashScreen.handle(event);
            for (i in menu){
                menu[i].handle(event);
            }
        });
        if(!player.alive){
            splashScreen.setGameOver();
        }

        //Update world
        player.update(dt);
        enemies.update(dt);
        checkForTrigger();
        infobox.update(dt);
        map.update(dt);
        updateScroll();
    }

    function draw() {

        //Background
        display.fill("rgba(0,0,0,1)");

        if (splashScreen.showSplash||!player.alive){

            splashScreen.draw(display);
        }
        else {

            //Draw world
            map.drawBackground(display);
            player.draw(display);
            enemies.draw(display);
            map.drawTiles(display);
            map.drawForeground(display);

            //Draw overlay
            infobox.draw(display);
            for (i in menu){
                menu[i].draw(display);
            }
        }

    }
}

function updateScroll() {

    var x = 0;
    var y = 0;

    //Scroll to the right
    if (player.rect.right > SCREEN_WIDTH) {
        x = - SCREEN_WIDTH + CAMERA_MOVE_OFFSET;
        player.rect.right = CAMERA_MOVE_OFFSET;
    }
    //Scroll to the left
    else if (player.rect.left < 0) {
        x = SCREEN_WIDTH - CAMERA_MOVE_OFFSET;
        player.rect.left = SCREEN_WIDTH - CAMERA_MOVE_OFFSET;
    }

    //Scroll down
    if (player.rect.bottom > SCREEN_HEIGHT) {
        y = - SCREEN_HEIGHT + CAMERA_MOVE_OFFSET;
        player.rect.bottom = CAMERA_MOVE_OFFSET;
    }
    //Scroll up
    else if (player.rect.top < 0) {
        y = SCREEN_HEIGHT - CAMERA_MOVE_OFFSET;
        player.rect.top = SCREEN_HEIGHT - CAMERA_MOVE_OFFSET;
    }

    if (x != 0 || y != 0) {

        map.moveOffset(x, y);
        enemies.forEach(function(enemy) { enemy.rect.moveIp(x, y); })

        triggers.forEach(function(trigger) {
            trigger.rect.left += x;
            trigger.rect.top += y;
        });
    }
}

//Start game
gamejs.ready(main);