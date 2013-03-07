var gamejs = require('gamejs');
var view = require('./view');

gamejs.preload([
    './data/tiles.png',
    './data/player_r_n.png',
    './data/player_l_n.png',
    './data/player_r_s.png',
    './data/player_l_s.png',
    './data/player_r_g.png',
    './data/player_l_g.png',
    './data/player_r_sp.png',
    './data/player_l_sp.png',
    './data/enemy_1_l.png',
    './data/enemy_1_r.png',
    './data/enemy_2_l.png',
    './data/enemy_2_r.png',
    './data/enemy_3_l.png',
    './data/enemy_3_r.png',
    './data/hero.png',
    './data/splash.png',
    './data/_s.png',
    './data/_s_a.png',
    './data/_g_a.png',
    './data/steam.png',
    './data/speachbubble.png',
    './data/_g.png',
    './data/_sp.png',
    './data/_sp_a.png',
    './data/_n.png',
    './data/box.png',
    './data/_n_a.png',
    './data/pipes.png',
    './data/gameover.png',
    './data/item_disabled.png',
    './sounds/slay.ogg',
    './sounds/spring.ogg'
]);

//Cheats
var WALLHACK = true;
var INVINCIBLE = false;
var ALL_ITEMS = true;
var SHOW_HITBOX = true;

//Font
var font = new gamejs.font.Font("12px Verdana");

//Level
var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 480;
var TILE_SIZE = 16;
var CAMERA_MOVE_OFFSET = 32;
var TMX_FILE = './data/testlevel1.tmx';

//Physics
var GRAVITY = 2;
var JUMP_IMPULSE = 15;

//Player
var DIR_LEFT = "_l";
var DIR_RIGHT = "_r";
var PLAYER_SPEED = 200;
var PLAYER_HEALTH = 5;
var JUMP_MULTIPLIER = 1.8;

//Weapons
var SWORD_TIME = 0.1;
var SWORD_DAMAGE = 2;
var GUN_DAMAGE = 1;
var GUN_SPEED = 300;

//Enemies
var OBJECT_TYPES = {
    EnemyEasy : "enemy1",
    EnemyHard : "enemy2",
    EnemyFlying : "enemy3",
    Savepoint : "save"
}

//Items
var MAX_ITEM_BLOCKTIME= 0.5;
var ITEM_SWORD = "_s";
var ITEM_GUN = "_g";
var ITEM_SPRING = "_sp";
var ITEM_NONE = "_n";
var ITEM_ACTIVATED = "_a";
var INFO_TIME = 2;
var ITEM_KEYS = {
    none : gamejs.event.K_3,
    sword : gamejs.event.K_1,
    spring : gamejs.event.K_2,
    gun : gamejs.event.K_4
};

//Misc
var map;
var player;
var enemies;
var weapons;
var savepoints;
var infobox ;
var menu = [];
var triggers = [];
var itemBlockedTimer;
var itemenabled=true;


addTrigger(new gamejs.Rect([(144*TILE_SIZE),7*TILE_SIZE], [32,32]),function(){infobox =new Info("I hate that steam...");});
addTrigger(new gamejs.Rect([(235*TILE_SIZE),24*TILE_SIZE], [64,64]),function(){infobox =new Info("So lame...this box is empty...");});
addTrigger(new gamejs.Rect([(88*TILE_SIZE),11*TILE_SIZE], [32,32]),function(){infobox =new Info("OHH! Some strange guys?! than I will use my Sword[SPACE]");});
addTrigger(new gamejs.Rect([96,192], [32,32]),function(){infobox =new Info("Where should I go?[A] or [D]");});
addTrigger(new gamejs.Rect([(8*3*TILE_SIZE),192], [32,32]),function(){infobox =new Info("oh is this high![W]");});
addTrigger(new gamejs.Rect([(124*TILE_SIZE),23*TILE_SIZE], [32,32]),function(){
    infobox = new Info("Ohh some Springs!\n[2]back[1]");
    player.inventory.push(ITEM_SPRING);
    menu[ITEM_SPRING] = new Item(ITEM_SPRING, [32+10,5], function(event) {
        if (event.key === ITEM_KEYS.spring) {
            for (i in menu) {
                menu[i].deactivate();
            }
            menu[ITEM_SPRING].active();

        }
    });
});
addTrigger(new gamejs.Rect([(236*TILE_SIZE),3*TILE_SIZE], [32,32]),function(){
    if(menu[ITEM_NONE]==ITEM_NONE){
        infobox = new Info("Ohh lets put our items away[3]");
        player.inventory.push(ITEM_NONE);
        menu[ITEM_NONE] = new Item(ITEM_NONE, [64+15,5], function(event) {
            if (event.key === ITEM_KEYS.none) {
                for (i in menu) {
                    menu[i].deactivate();
                }
                menu[ITEM_NONE].active();

            }
        });
        player.item=ITEM_NONE;
        menu[ITEM_NONE].active();
    }

});
function blockItems(){
    for(i in menu){
        menu[i].disable();
    }
    itemBlockedTimer=0;
    itemenabled=false;
}
function reactivateItems(){
    for(i in menu){
        menu[i].enable();
    }
    itemenabled=true;
}

addTrigger(new gamejs.Rect([248*TILE_SIZE,3*TILE_SIZE], [32,32]),function(){infobox =new Info("Oh I'm so fast!!!");});
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
    this.infobox = font.render(text, "rgba(0,0,0,1)");
    this.image =  gamejs.image.load("./data/speachbubble.png");
    this.update = function(dt) {
       this.pos=[player.rect.left+16-(this.infobox.getSize()[0]/2),player.rect.top];
        this.pos[1] -= 20;
        this.bg=new gamejs.Rect(this.pos,this.infobox.getSize());
       this.existingTime += dt;
    }

    this.draw = function(display) {

        if(this.existingTime <= INFO_TIME){
           gamejs.draw.rect(display, "rgba(255,255,255,1)", this.bg ,0);
           display.blit(this.image, [this.pos[0]+(this.infobox.getSize()[0]/2),this.pos[1]+12])
           display.blit(this.infobox, this.pos)

        }
    }
}
function Hud(){

    this.pos=[SCREEN_WIDTH-120,0];
    this.existingTime=0;

    this.update = function(dt) {

        this.bg=new gamejs.Rect(this.pos,[120,16]);
        this.infobox = font.render(" Life: "+player.health+"   Kills: "+player.kills, "rgba(255,255,255,1)");
    }

    this.draw = function(display) {

        if(this.existingTime <= INFO_TIME){
            gamejs.draw.rect(display, "rgba(137,137,61,1)", this.bg ,0);
              display.blit(this.infobox, this.pos)

        }
    }
}

function Item(name,position,handle) {
    this.active = false;
    this.name = name;
    this.currentState=gamejs.image.load("./data/" + name + ".png");
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
    this.enable = function() {
        this.image = this.currentState;
    }

    this.disable = function() {
        this.currentState=this.image
        this.image = gamejs.image.load("./data/item_disabled.png");
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

function Entity(health) {
    Entity.superConstructor.apply(this, arguments);

    this.health = health;
    this.velocity = 0;
    this.isAtGround = false;

    this.damageBy = function(value) {

        this.health -= value;

        if (this.health <= 0) {
            player.kills += 1;
            this.kill();
        }
    }

    this.updatePhysics = function(dt) {
        this.isAtGround = !map.canMove8(this, 0, 0.01);

        //Calculate new Y
        if (!this.isAtGround) {

            //TODO Multiply by dt
            this.velocity += GRAVITY;

            //Collide with ceiling
            if (this.velocity < 0 && !map.canMove8(this, 0, -0.01)) {
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

    this.image = gamejs.image.load('./data/player_r_n.png');
    this.rect = new gamejs.Rect(position, this.image.getSize());

    //State variables
    this.health = PLAYER_HEALTH;
    this.kills = 0;
    this.direction = 0;
    this.move = false;
    this.item = ITEM_SWORD;
    this.inventory = [];
    this.inventory.push(ITEM_SWORD);
    this.lastSave;

    if(ALL_ITEMS){
        this.inventory[ITEM_GUN]=ITEM_GUN;
        this.inventory[ITEM_NONE]=ITEM_NONE;
        this.inventory[ITEM_SPRING]=ITEM_SPRING;
    }
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
            if (event.key === gamejs.event.K_a && !this.move) {
                this.direction = -1 * (this.item==ITEM_NONE ? 2 : 1);
                this.move = true;
            }
            else if (event.key === gamejs.event.K_d && !this.move) {
                this.direction = (this.item==ITEM_NONE ? 2 : 1);
                this.move = true;
            }

            else if (event.key === gamejs.event.K_w && this.isAtGround) {
                if(this.item==ITEM_SPRING){
                    var effect = gamejs.mixer.Sound("./sounds/spring.ogg");
                    effect.play();
                }
                this.velocity = -JUMP_IMPULSE * (this.item==ITEM_SPRING ? JUMP_MULTIPLIER : 1);
                this.velocity = -JUMP_IMPULSE * (this.item==ITEM_SPRING ? JUMP_MULTIPLIER : 1);

            }
            else if (event.key === ITEM_KEYS.sword && player.isInInventory(ITEM_SWORD)&&itemenabled) {
                this.item = ITEM_SWORD;
                blockItems()
                var effect = gamejs.mixer.Sound("./sounds/slay.ogg");
                effect.play();

                weapons.add(new Sword(SWORD_TIME, SWORD_DAMAGE));
            }
            else if (event.key === ITEM_KEYS.gun && player.isInInventory(ITEM_GUN)&&itemenabled) {
                this.item = ITEM_GUN;
                blockItems();
            }
            else if (event.key === ITEM_KEYS.spring && player.isInInventory(ITEM_SPRING)&&itemenabled) {
                this.item = ITEM_SPRING;
                if(player.isAtGround){
                    this.velocity = -JUMP_IMPULSE * (this.item == ITEM_SPRING ? JUMP_MULTIPLIER : 1);
                }
                blockItems();
            }
            else if (event.key === ITEM_KEYS.none && player.isInInventory(ITEM_NONE)) {
                this.item = ITEM_NONE;
                blockItems();
            }
            else if (event.key === gamejs.event.K_SPACE) {

                if (player.item === ITEM_SWORD) {
                    weapons.add(new Sword(SWORD_TIME, SWORD_DAMAGE));

                    var effect = gamejs.mixer.Sound("./sounds/slay.ogg");
                    effect.play();
                }
                else if (player.item === ITEM_GUN) {
                    weapons.add(new Bullet(10, GUN_DAMAGE, GUN_SPEED));
                }
            }

            //Cheats
            if (WALLHACK) {
                if (event.key === gamejs.event.K_LEFT) { this.rect.left -= 10; }
                if (event.key === gamejs.event.K_RIGHT) { this.rect.left += 10; }
                if (event.key === gamejs.event.K_UP) { this.rect.top -= 100; }
                if (event.key === gamejs.event.K_DOWN) { this.rect.top += 100; }
            }
        }
        else if (event.type === gamejs.event.KEY_UP) {
            if (event.key === gamejs.event.K_a) this.move = false;
            if (event.key === gamejs.event.K_d) this.move = false;
        }
    };

    this.update = function(dt) {

        //Calculate new X
        if (this.move) {
            var x = this.direction * PLAYER_SPEED * dt;
            map.move(this, x, 0);
        }

        //Falling etc.
        this.updatePhysics(dt);

        //Collision with enemies
        gamejs.sprite.spriteCollide(player, enemies, false).forEach(function(collision) {
            collision.b.damageBy(10);
            player.damageBy(1);
        });

        //TODO Fix for performance
        if (player.direction > 0) {
            this.image = gamejs.image.load('./data/player_r' + this.item + '.png');
        }
        else {
            this.image = gamejs.image.load('./data/player_l' + this.item + '.png');
        }

        //Kill
        if (map.hitsKillingObject(this)) {
            this.kill();
        }

        //Save
        gamejs.sprite.spriteCollide(player, savepoints, false).forEach(function(collision) {
            collision.b.offset = map.getOffset();
            player.lastSave = collision.b;
        });
    };

    this.kill = function() {

        if (!INVINCIBLE) {
            //this._alive = false;

            this.rect.topleft = [this.lastSave.rect.left, this.lastSave.rect.top - TILE_SIZE];

            var x = this.lastSave.offset[0] - map.getOffset()[0];
            var y = this.lastSave.offset[1] - map.getOffset()[1];
            updateScroll(x, y);
        }
    }
}
gamejs.utils.objects.extend(Player, Entity);

function Enemy(health, imagePath, pos, speed) {
    Enemy.superConstructor.apply(this, arguments);

    this.imageR = gamejs.image.load('./data/' + imagePath + '_r.png');
    this.imageL = gamejs.image.load('./data/' + imagePath + '_l.png')
    this.image = this.imageR;

    this.size = this.image.getSize();
    this.rect = new gamejs.Rect([pos[0], pos[1] - TILE_SIZE], this.size);

    this.direction = 1;
    this.speed = speed;
}
gamejs.utils.objects.extend(Enemy, Entity);

function WalkingEnemy(health, imagePath, pos, speed) {

    WalkingEnemy.superConstructor.apply(this, arguments);

    this.update = function(dt) {

        //Move
        var x = this.speed * this.direction * dt;
        if (map.canMove8(this, x, 0) && !map.canMove4(this, x, 0.01)) {
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

function FlyingEnemy(health, imagePath, pos, speed) {

    FlyingEnemy.superConstructor.apply(this, arguments);

    this.update = function(dt) {

        //Move
        var x = this.speed * this.direction * dt;
        if (map.canMove8(this, x, 0)) {
            map.move(this, x, 0);
        }
        //Change direction
        else {
            this.direction *= -1;
            this.direction > 0 ? this.image = this.imageR : this.image = this.imageL;
        }
    };
}
gamejs.utils.objects.extend(FlyingEnemy, Enemy);

function Weapon(lifeTime, damage) {
    Weapon.superConstructor.apply(this, arguments);

    this.damage = damage;
    this.lifeTime = lifeTime;
    this.existingTime = 0;

    this.draw = function(display) {

        //TODO Show "animation" ?
        if (this.rect != null && SHOW_HITBOX) {
            gamejs.draw.rect(display, "rgba(255, 0, 0, 0.5)", this.rect, 0);
        }
    };
}
gamejs.utils.objects.extend(Weapon, gamejs.sprite.Sprite);

function Sword(lifeTime, damage) {
    Sword.superConstructor.apply(this, arguments);

    this.update = function(dt) {

        //Move with player
        if (player.direction > 0) {
            this.size = [TILE_SIZE * 2, TILE_SIZE * 2];
            this.rect = new gamejs.Rect(player.rect.topright, this.size);
        }
        else {
            this.size = [-TILE_SIZE * 2, TILE_SIZE * 2];
            this.rect = new gamejs.Rect(player.rect.topleft, this.size);
        }

        //Only hit once
        if (this.existingTime == 0) {
            gamejs.sprite.spriteCollide(this, enemies, false).forEach(function(collision) {
                collision.b.damageBy(collision.a.damage);
            });
        }

        //Disappear
        this.existingTime += dt;
        if (this.existingTime >= this.lifeTime) {
            this.kill();
        }
    };
}
gamejs.utils.objects.extend(Sword, Weapon);

function Bullet(lifeTime, damage, speed) {
    Bullet.superConstructor.apply(this, arguments);

    this.speed = speed;
    this.direction = player.direction;

    //Spawn
    var y = (player.rect.top + player.rect.center[1]) / 2;

    if (this.direction > 0) {
        this.size = [TILE_SIZE, TILE_SIZE];
        this.rect = new gamejs.Rect([player.rect.right, y], this.size);
    }
    else {
        this.size = [-TILE_SIZE, TILE_SIZE];
        this.rect = new gamejs.Rect([player.rect.left, y], this.size);
    }

    this.update = function(dt) {

        //Collision
        gamejs.sprite.spriteCollide(this, enemies, false).forEach(function(collision) {
            collision.b.damageBy(collision.a.damage);
            collision.a.kill();
        });

        //Movement
        var x = this.direction * this.speed * dt;
        if (map.canMove4(this, x, 0)) {
            map.move(this, x, 0);
        }
        else {
            this.kill();
        }

        //Disappear
        this.existingTime += dt;
        if (this.existingTime >= this.lifeTime) {
            this.kill();
        }
    };
}
gamejs.utils.objects.extend(Bullet, Weapon);

function Savepoint(pos) {
    Savepoint.superConstructor.apply(this, arguments);

    this.size = [TILE_SIZE, TILE_SIZE];
    this.rect = new gamejs.Rect(pos, this.size);

    this.offset = [0, 0];

    this.draw = function(display) {

        if (SHOW_HITBOX) {
            gamejs.draw.rect(display, "rgba(255, 255, 0, 0.5)", this.rect, 0);
        }
    };
}
gamejs.utils.objects.extend(Savepoint, gamejs.sprite.Sprite);

function main() {

    //Initialize screen
    var display = gamejs.display.setMode([SCREEN_WIDTH, SCREEN_HEIGHT]);

    //Initialize variables
    player = new Player([96, 48]);
    enemies = new gamejs.sprite.Group();
    weapons = new gamejs.sprite.Group();
    savepoints = new gamejs.sprite.Group();
    infobox = new Info("Hallo, I'm Julia");
    this.hud = new Hud();
    var splashScreen = new SplashScreen();
    splashScreen.showSplash=false;
    menu = [];

    //Initialize map
    map = new view.Map(TMX_FILE);
    map.loadObjects(spawnObject);

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
        itemBlockedTimer+=dt;
        if(itemBlockedTimer>=MAX_ITEM_BLOCKTIME&&!itemenabled){
            reactivateItems();
        }
        //Process input
        gamejs.event.get().forEach(function(event) {
            for (i in menu){
                menu[i].handle(event);
            }
            player.handle(event);
            splashScreen.handle(event);

        });
        if(player.isDead()){
            splashScreen.setGameOver();
        }

        //Update world
        player.update(dt);
        weapons.update(dt);
        enemies.update(dt);
        checkForTrigger();
        infobox.update(dt);
        map.update(dt);
        updateScroll(0, 0);
        this.hud.update(dt);
    }

    function draw() {

        //Background
        display.fill("rgba(0,0,0,1)");

        if (splashScreen.showSplash || player.isDead()){

            splashScreen.draw(display);
        }
        else {

            //Draw world
            map.drawBackground(display);
            player.draw(display);
            enemies.draw(display);
            weapons.draw(display);
            savepoints.draw(display);
            map.drawTiles(display);
            map.drawForeground(display);

            //Draw overlay
            infobox.draw(display);
            for (i in menu){
                menu[i].draw(display);
            }
            this.hud.draw(display);
        }

    }
}

function updateScroll(x, y) {

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
        triggers.forEach(function(trigger) { trigger.rect.moveIp(x, y); });
        weapons.forEach(function(weapon) { weapon.rect.moveIp(x, y); });
        savepoints.forEach(function (savepoint) { savepoint.rect.moveIp(x, y); });
    }
}

function spawnObject(type, pos) {

    if (type === OBJECT_TYPES.EnemyEasy) {
        enemies.add(new WalkingEnemy(1, "enemy_1", pos, 100));
    }
    else if (type === OBJECT_TYPES.EnemyHard) {
        enemies.add(new WalkingEnemy(2, "enemy_2", pos, 80));
    }
    else if (type === OBJECT_TYPES.EnemyFlying) {
        enemies.add(new FlyingEnemy(1, "enemy_3", pos, 100));
    }
    else if (type === OBJECT_TYPES.Savepoint) {
        savepoints.add(new Savepoint(pos));
    }
}

//Start game
gamejs.ready(main);