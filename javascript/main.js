var gamejs = require('gamejs');
var view = require('./view');

gamejs.preload(['./data/tiles.png', './data/player_r_n.png', './data/player_l_n.png', './data/player_r_s.png',
    './data/player_l_s.png', './data/player_r_g.png', './data/player_l_g.png', './data/player_r_sp.png',
    './data/player_l_sp.png', './data/hero.png','./data/splash.png',
    './data/_s.png','./data/_s_a.png', './data/_g_a.png',
    './data/_g.png', './data/_sp.png','./data/_sp_a.png', './data/_n.png','./data/_n_a.png','./data/gameover.png' ]);

var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 480;
var GRAVITY = 2;
var JUMP_IMPULSE = 15;
var DIR_LEFT = "_l";
var DIR_RIGHT = "_r";
var ITEM_SWORT="_s";
var ITEM_GUN="_g";
var ITEM_SPRING="_sp";
var ITEM_NONE="_n";
var ITEM_ACTIVATED="_a";
var ITEM_KEYS={none:gamejs.event.K_1,swort:gamejs.event.K_2,
               spring:gamejs.event.K_4,gun:gamejs.event.K_3};
var map;

function Item(name,position,handle) {
    this.active=false;
    this.name=name;
    Item.superConstructor.apply(this, arguments);

    //Load and flip image
    this.image = gamejs.image.load("./data/"+name+".png");

    //Generate random position at top of screen
    this.size = this.image.getSize();
    this.rect = new gamejs.Rect(position, this.size);
    this.active = function(){
        this.image = gamejs.image.load("./data/"+this.name+ITEM_ACTIVATED+".png");
        console.log(this.name);
    }
    this.deactive = function(){
        this.image = gamejs.image.load("./data/"+this.name+".png");
    }

    this.update = function(dt) {


    };
    this.handle = handle;
};

gamejs.utils.objects.extend(Item, gamejs.sprite.Sprite);

function SplashScreen() {
    this.showSplash=true;
    SplashScreen.superConstructor.apply(this, arguments);

    //Load and flip image
    this.image = gamejs.image.load("./data/splash.png");

    //Generate random position at top of screen
    this.size = this.image.getSize();
    this.rect = new gamejs.Rect([0,0], this.size);
    this.gameover=false;
    this.setGameOver=function(){
        this.image = gamejs.image.load("./data/gameover.png");
    }

    this.update = function(dt) {


    };
    this.handle = function(event,player) {

        if (event.type === gamejs.event.MOUSE_DOWN) {
            this.showSplash=false;
            if(this.gameover){
                window.location.reload();
            }
        }
    };
};
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
    this.item=ITEM_SWORT;
    this.alive=true;

    this.handle = function(event) {
        if (event.type === gamejs.event.KEY_DOWN) {
            if (event.key === gamejs.event.K_a && this.xDir == 0) {
                this.xDir = -1*(this.item==ITEM_NONE?2:1);
                this.dir=DIR_LEFT;
            }
            if (event.key === gamejs.event.K_d && this.xDir == 0) {
                this.xDir = 1*(this.item==ITEM_NONE?2:1);
                this.dir =DIR_RIGHT;
            }
            if (event.key === gamejs.event.K_w && this.isAtGround) {
                this.velocity = -JUMP_IMPULSE*(this.item==ITEM_SPRING?2:1);
            }
            if (event.key === ITEM_KEYS.swort) {

                this.item=ITEM_SWORT;
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
            if (event.key === gamejs.event.K_w) this.yDir = 0;
            if (event.key === gamejs.event.K_s) this.yDir = 0;
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
};
gamejs.utils.objects.extend(Player, gamejs.sprite.Sprite);

function main() {

    //Initialize screen
    var display = gamejs.display.setMode([SCREEN_WIDTH, SCREEN_HEIGHT]);

    //Initialize variables
    map = new view.Map('./data/testlevel.tmx');
    var player = new Player([96, 48]);
    var splashScreen = new SplashScreen();
    var menu=[];
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
    menu[ITEM_SWORT]=new Item(ITEM_SWORT,[32+10,5],function(event){
        if (event.key === ITEM_KEYS.swort) {
            for(i in menu){
                menu[i].deactive();
            }
            menu[ITEM_SWORT].active();
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
    menu[ITEM_SWORT].active();
    //The gameloop
    function gameTick(gameTime) {

        update(gameTime);
        draw();
    };
    gamejs.time.fpsCallback(gameTick, this, 30);

    function update(gameTime) {

        var dt = gameTime / 1000;

        //Process input
        gamejs.event.get().forEach(function(event) {
            player.handle(event);
            map.handle(event);
            splashScreen.handle(event);
            for (i in menu){
                menu[i].handle(event);
            }
        });
        if(!player.alive){
            splashScreen.setGameOver();
        }

        //Update world
        player.update(dt)
        map.update(dt, player);
    }

    function draw() {

        //Clear background
        display.fill("rgba(0,0,0,1)");

        if (splashScreen.showSplash||!player.alive){

            splashScreen.draw(display);
        } else {
            //Draw world
            player.draw(display);
            map.draw(display);
            for( i in menu){
                menu[i].draw(display);
            }
        }

    }
};

//Start game
gamejs.ready(main);