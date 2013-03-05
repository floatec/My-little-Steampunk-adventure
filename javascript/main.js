var gamejs = require('gamejs');
var view = require('./view');

gamejs.preload(['./data/tiles.png', './data/player_r.png', './data/player_l.png', './data/player_r_s.png',
    './data/player_l_s.png', './data/player_r_g.png', './data/player_l_g.png', './data/player_r_sp.png',
    './data/player_l_sp.png', './data/hero.png','./data/splash.png']);

var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 480;
var GRAVITY = 2;
var JUMP_IMPULSE = 15;
var DIR_LEFT = "_l";
var DIR_RIGHT = "_r";
var ITEM_SWORT="_s";
var ITEM_GUN="_g";
var ITEM_SPRING="_sp";
var ITEM_NONE="";
var map;

function Item(name,position) {
    this.active=false;
    this.name=name;
    SplashScreen.superConstructor.apply(this, arguments);

    //Load and flip image
    this.image = gamejs.image.load("./data/"+name+".png");

    //Generate random position at top of screen
    this.size = this.image.getSize();
    this.rect = new gamejs.Rect(position, this.size);


    this.update = function(dt) {


    };
    this.handle = function(event) {


    };
};

gamejs.utils.objects.extend(SplashScreen, gamejs.sprite.Sprite);

function SplashScreen() {
    this.showSplash=true;
    SplashScreen.superConstructor.apply(this, arguments);

    //Load and flip image
    this.image = gamejs.image.load("./data/splash.png");

    //Generate random position at top of screen
    this.size = this.image.getSize();
    this.rect = new gamejs.Rect([0,0], this.size);


    this.update = function(dt) {


    };
    this.handle = function(event) {

        if (event.type === gamejs.event.MOUSE_DOWN) {
            this.showSplash=false;
        }
    };
};
gamejs.utils.objects.extend(SplashScreen, gamejs.sprite.Sprite);


function Player(position) {
	Player.superConstructor.apply(this, arguments);
	
	//Load image
	this.image = gamejs.image.load('./data/player_r.png');

	//Set startup position
	this.rect = new gamejs.Rect(position, this.image.getSize());

	//State variables
	this.speed = 200;
	this.velocity = 0;
	this.xDir = 0;
	this.isAtGround = false;
    this.dir=DIR_RIGHT;
    this.item=ITEM_NONE;
	
	this.handle = function(event) {
		if (event.type === gamejs.event.KEY_DOWN) {
			if (event.key === gamejs.event.K_a && this.xDir == 0) { 
				this.xDir = -1;
                this.dir=DIR_LEFT;
			}
			if (event.key === gamejs.event.K_d && this.xDir == 0) {
				this.xDir = 1;
                this.dir =DIR_RIGHT;
			}
			if (event.key === gamejs.event.K_w && this.isAtGround) {
				this.velocity = -JUMP_IMPULSE*(this.item==ITEM_SPRING?2:1);
			}
            if (event.key === gamejs.event.K_1) {
                this.item=ITEM_SWORT;
            }
            if (event.key === gamejs.event.K_2) {
                this.item=ITEM_GUN;
            }
            if (event.key === gamejs.event.K_3) {
                this.item=ITEM_SPRING;
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
		});
		
		//Update world
		player.update(dt)
		map.update(dt, player);
	}
	
	function draw() {
		
		//Clear background
		display.fill("rgba(0,0,0,1)");
		
		if (splashScreen.showSplash) {
			splashScreen.draw(display);
        } 
		else {
			//Draw world
			player.draw(display);
			map.draw(display);
        }

	}
};

//Start game
gamejs.ready(main);