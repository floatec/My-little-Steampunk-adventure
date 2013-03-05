var gamejs = require('gamejs');
var view = require('./view');

gamejs.preload(['./data/tiles.png', './data/player.png', './data/hero.png']);

var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 480;
var GRAVITY = 2;
var JUMP_IMPULSE = 15;

var map;

function Player(position) {
	Player.superConstructor.apply(this, arguments);
	
	//Load image
	this.image = gamejs.image.load('./data/player.png');

	//Set startup position
	this.rect = new gamejs.Rect(position, this.image.getSize());

	//State variables
	this.speed = 200;
	this.velocity = 0;
	this.xDir = 0;
	this.isAtGround = false;
	
	this.handle = function(event) {
		if (event.type === gamejs.event.KEY_DOWN) {
			if (event.key === gamejs.event.K_a && this.xDir == 0) { 
				this.xDir = -1;
			}
			if (event.key === gamejs.event.K_d && this.xDir == 0) {
				this.xDir = 1;
			}
			if (event.key === gamejs.event.K_w && this.isAtGround) {
				this.velocity = -JUMP_IMPULSE;
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
	
		this.isAtGround = !map.canMove(this, 0, 1);
	
		//Calculate new X
		var x = this.xDir * this.speed * dt;
		map.move(this, x, 0);
		
		//Calculate new Y
		if (!this.isAtGround) {
			this.velocity += GRAVITY;
		}
		else if (this.velocity > 0) {
			this.velocity = 0;
		}
		
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
		});
		
		//Update world
		player.update(dt)
		map.update(dt);
	}
	
	function draw() {
		
		//Clear background
		display.fill("rgba(0,0,0,1)");
		
		//Draw world
		player.draw(display);
		map.draw(display);
	}
};

//Start game
gamejs.ready(main);