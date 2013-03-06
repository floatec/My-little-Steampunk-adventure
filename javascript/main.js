var gamejs = require('gamejs');
var view = require('./view');

gamejs.preload(['./data/tiles.png', './data/player_r_n.png', './data/player_l_n.png', './data/player_r_s.png',
    './data/player_l_s.png', './data/player_r_g.png', './data/player_l_g.png', './data/player_r_sp.png',
    './data/player_l_sp.png', './data/hero.png','./data/splash.png',
    './data/_s.png','./data/_s_a.png', './data/_g_a.png',
    './data/_g.png', './data/_sp.png','./data/_sp_a.png', './data/_n.png','./data/_n_a.png','./data/gameover.png' ]);

//Font
var font = new gamejs.font.Font("12px Verdana");

//Level
var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 480;
var TMX_FILE = './data/testlevel.tmx';

//Physics
var GRAVITY = 2;
var JUMP_IMPULSE = 15;

//Player
var DIR_LEFT = "_l";
var DIR_RIGHT = "_r";

//Items
var ITEM_SWORD="_s";
var ITEM_GUN="_g";
var ITEM_SPRING="_sp";
var ITEM_NONE="_n";
var ITEM_ACTIVATED="_a";
var INFO_TIME=5;
var ITEM_KEYS={none:gamejs.event.K_1,sword:gamejs.event.K_2,
    spring:gamejs.event.K_4,gun:gamejs.event.K_3};

//Misc
var CAMERA_MOVE_OFFSET = 32;
var map;
var player;
var enemies;
var infobox =new Info(" ");

var triggertActions=[]
addTriggeredAction(new gamejs.Rect([96,192], [32,32]),function(){infobox =new Info("Press A or D");})


function addTriggeredAction(rect,callback){
    var obj={callback:callback,rect:rect};
    triggertActions.push(obj);

}
function checkforTriggeredAction(){
    for(action in triggertActions){

        if(player.rect.collideRect(triggertActions[action].rect)){
            triggertActions[action].callback();
        }
    }
}

function Info(text){
    this.pos=[0,0];
    this.existingTime=0;
    this.infobox = font.render(text, "rgba(255,255,255,1)");
   this.update=function(dt){
       this.pos=player.rect.topleft;
       this.pos[1]-=20;
       this.existingTime+=dt;
   }
    this.draw=function(display){
        if(this.existingTime<=INFO_TIME){
        gamejs.draw.rect(display, "rgba(0,0,0,1)", 120, 0);
        display.blit(this.infobox,this.pos)
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

    this.active = function(){
        this.image = gamejs.image.load("./data/" + this.name + ITEM_ACTIVATED + ".png");
    }

    this.deactive = function(){
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
    this.gameover=false;

    this.setGameOver=function(){
        this.gameover=true;
        this.image = gamejs.image.load("./data/gameover.png");
    }

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

function Player(position) {
    Player.superConstructor.apply(this, arguments);

    //Load image
    this.image = gamejs.image.load('./data/player_r_n.png');

    //Set startup position
    this.rect = new gamejs.Rect(position, this.image.getSize());

    //State variables
    this.speed = 200;
    this.velocity = 0;
    this.xDir = 0;
    this.isAtGround = false;
    this.dir=DIR_RIGHT;
    this.item=ITEM_SWORD;
    this.alive=true;

    this.handle = function(event) {
        if (event.type === gamejs.event.KEY_DOWN) {
            if (event.key === gamejs.event.K_a && this.xDir == 0) {
                this.xDir = -1 * (this.item==ITEM_NONE ? 2 : 1);
                this.dir=DIR_LEFT;
            }
            if (event.key === gamejs.event.K_d && this.xDir == 0) {
                this.xDir = (this.item==ITEM_NONE ? 2 : 1);
                this.dir =DIR_RIGHT;
            }
            if (event.key === gamejs.event.K_w && this.isAtGround) {
                this.velocity = -JUMP_IMPULSE*(this.item==ITEM_SPRING?2:1);
            }
            if (event.key === ITEM_KEYS.sword) {
                this.item=ITEM_SWORD;
            }
            if (event.key === ITEM_KEYS.gun) {
                this.item=ITEM_GUN;
            }
            if (event.key === ITEM_KEYS.spring) {
                this.item=ITEM_SPRING;
            }
            if (event.key === ITEM_KEYS.none) {
                this.item=ITEM_NONE;
            }
        }
        else if (event.type === gamejs.event.KEY_UP) {
            if (event.key === gamejs.event.K_a) this.xDir = 0;
            if (event.key === gamejs.event.K_d) this.xDir = 0;
        }
    };

    this.update = function(dt) {

        //Collide with ground
        this.isAtGround = !map.canMove(this, 0, 1);

        //Calculate new X
        var x = this.xDir * this.speed * dt;
        map.move(this, x, 0);

        //Calculate new Y
        if (!this.isAtGround) {
            this.velocity += GRAVITY;

            //Collide with ceiling
            if (this.velocity < 0 && !map.canMove(this, 0, -1)) {
                this.velocity = 0;
            }
        }
        else if (this.velocity > 0) {
            this.velocity = 0;
        }

        this.image = gamejs.image.load('./data/player'+this.dir+this.item+'.png');

        map.move(this, 0, this.velocity);

        if (map.hitsKillingObject(this)) {
            this.alive = false;
        }
    };
}
gamejs.utils.objects.extend(Player, gamejs.sprite.Sprite);

function Enemy(pos) {
    Enemy.superConstructor.apply(this, arguments);

    this.image = gamejs.image.load('./data/player_r_n.png');
    this.size = this.image.getSize();
    this.rect = new gamejs.Rect([pos[0], pos[1] - 16], this.size);

    this.update = function(dt) {

    };
}
gamejs.utils.objects.extend(Enemy, gamejs.sprite.Sprite);

function main() {

    //Initialize screen
    var display = gamejs.display.setMode([SCREEN_WIDTH, SCREEN_HEIGHT]);

    //Initialize variables
    player = new Player([96, 48]);
    enemies = new gamejs.sprite.Group();
    var createEnemy = function(pos) {
      enemies.add(new Enemy(pos));
    };
    var splashScreen = new SplashScreen();
    var menu = [];

    //Initialize map
    map = new view.Map(TMX_FILE);
    map.loadObjects(createEnemy);

    menu[ITEM_GUN]=new Item(ITEM_GUN,[64+15,5],function(event){
        if (event.key === ITEM_KEYS.gun) {
            for(i in menu){
                menu[i].deactive();
            }
            menu[ITEM_GUN].active();
        }
    });
    menu[ITEM_SPRING]=new Item(ITEM_SPRING,[64+32+20,5],function(event){
        if (event.key === ITEM_KEYS.spring) {
            for(i in menu){
                menu[i].deactive();
            }
            menu[ITEM_SPRING].active();
        }
    });
    menu[ITEM_SWORD]=new Item(ITEM_SWORD,[32+10,5],function(event){
        if (event.key === ITEM_KEYS.sword) {
            for(i in menu){
                menu[i].deactive();
            }
            menu[ITEM_SWORD].active();
        }
    });
    menu[ITEM_NONE]=new Item(ITEM_NONE,[5,5],function(event){
        if (event.key === ITEM_KEYS.none) {
            for(i in menu){
                menu[i].deactive();
            }
            menu[ITEM_NONE].active();
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
        checkforTriggeredAction();
        infobox.update(dt);
        map.update(dt);
        updateScroll();
    }

    function draw() {

        //Background
        display.fill("rgba(0,0,0,1)");

        if (splashScreen.showSplash||!player.alive){

            splashScreen.draw(display);
        } else {
            //Draw world
            player.draw(display);
            enemies.draw(display);
            map.draw(display);
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
        enemies.forEach(function(enemy) {enemy.rect.moveIp(x, y);})
    }
}

//Start game
gamejs.ready(main);