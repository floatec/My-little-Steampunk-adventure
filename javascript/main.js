var gamejs = require('gamejs');
var view = require('./view');

gamejs.preload(['./data/tiles.png', './data/player.png', './data/hero.png']);

var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 480;

var map;

function Player(position) {
	Player.superConstructor.apply(this, arguments);
	
	//Load image
	this.image = gamejs.image.load('./data/player.png');

	//Set startup position
	this.rect = new gamejs.Rect(position, this.image.getSize());

	//State variables
	this.speed = 200;
	this.xDir = 0;
	this.yDir = 0;
	
	this.handle = function(event) {
		if (event.type === gamejs.event.KEY_DOWN) {
			if (event.key === gamejs.event.K_a && this.xDir == 0) this.xDir = -1;
			if (event.key === gamejs.event.K_d && this.xDir == 0) this.xDir = 1;
			if (event.key === gamejs.event.K_w && this.yDir == 0) this.yDir = -1;
			if (event.key === gamejs.event.K_s && this.yDir == 0) this.yDir = 1;
		}
		else if (event.type === gamejs.event.KEY_UP) {
			if (event.key === gamejs.event.K_a) this.xDir = 0;
			if (event.key === gamejs.event.K_d) this.xDir = 0;
			if (event.key === gamejs.event.K_w) this.yDir = 0;
			if (event.key === gamejs.event.K_s) this.yDir = 0;
		}
	};
	
	this.update = function(dt) {
	
		//Calculate new position
		var x = this.xDir * 4;
		var y = this.yDir * 4;
		
		//console.log(this.rect.topleft);
		
		map.tryMove(this, x, y);
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
		display.clear();
		
		//Draw world
		map.draw(display);
		player.draw(display);
	}
};

//Start game
gamejs.ready(main);