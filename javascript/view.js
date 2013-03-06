var gamejs = require('gamejs');
var tmx = require('gamejs/tmx');


/**
 * Loads the tmx at the given URL and holds all layers.
 */
var Map = exports.Map = function(url) {
	
	var offset = [0, 0];
	var map = new tmx.Map(url);

	var layerViews = map.layers.map(function(layer) {
		return new LayerView(layer, {
			tileWidth: map.tileWidth,
			tileHeight: map.tileHeight,
			width: map.width,
			height: map.height,
			tiles: map.tiles
		});
	});

    this.loadObjects = function(callback) {

        for (var y = 0; y < map.height; y++) {
            for (var x = 0; x < map.width; x++) {

                var properties = map.tiles.getProperties(map.layers[1].gids[y][x]);
                for (p in properties) {
                    if (p === "enemy1") {
                        callback([x * map.tileWidth, y * map.tileHeight]);
                    }
                }
            }
        }
    }
	
	this.update = function(dt) {

	};
	
	this.draw = function(display) {

        //Draw only first layer
        layerViews[0].draw(display, offset);
	};

    this.moveOffset = function(x, y) {
        offset[0] += x;
        offset[1] += y;
    }


    this.getTileIndex = function(pos) {

        var x = (pos[0] - offset[0]) / map.tileWidth;
        var y = (pos[1] - offset[1]) / map.tileHeight;

        if (x < 0 || x > map.width || y < 0 || y > map.height) {
            //TODO Better error handling
            console.log("ERROR: Tile [" + Math.floor(x) + "," + Math.floor(y) + "] does not exist!");
        }

        return [Math.floor(x), Math.floor(y)];
    };

    this.getAbsoluteIndex = function(pos) {

        var x = pos[0] / map.tileWidth;
        var y = pos[1] / map.tileHeight;

        return [Math.floor(x), Math.floor(y)];
    };
	
	this.getTileId = function(pos) {
		
		var index = this.getTileIndex(pos);
		var x = index[0];
		var y = index[1];
		
		return map.layers[0].gids[y][x];
	};
		
	this.getTileProperty = function(pos, property) {

		var id = this.getTileId(pos);
		var properties = map.tiles.getProperties(id);

		for (p in properties) {
			if (p === property) {
				return true;
			}
		}
		
		return false;
	};
	
	this.canMove = function(sprite, x, y) {
	    return !this.hitsObjectwithProperty(sprite, x, y, "collide");
    };

    this.hitsKillingObject = function(sprite) {
        return this.hitsObjectwithProperty(sprite, 0, 0, "kill");
    };

    this.hitsObjectwithProperty = function(sprite, x, y,property) {

        var newPos = sprite.rect.clone();
        newPos.moveIp([x, y]);

        //Collisioncheck at eight points
        var topleft = newPos.topleft;
        var topright = newPos.right % map.tileWidth == 0 ? [newPos.right - 1, newPos.top] : newPos.topright;
        var bottomleft = newPos.bottom % map.tileHeight == 0 ? [newPos.left, newPos.bottom - 1] : newPos.bottomleft;

        var brx = newPos.right % map.tileWidth == 0 ? newPos.right - 1 : newPos.right;
        var bry  = newPos.bottom % map.tileHeight == 0 ? newPos.bottom - 1 : newPos.bottom;
        var bottomright = [brx, bry];

        var topmiddle = [(topleft[0] + topright[0]) / 2, topleft[1]];
        var bottommiddle = [(bottomleft[0] + bottomright[0]) / 2, bottomleft[1]];
        var middleleft = [topleft[0], (topleft[1] + bottomleft[1]) / 2];
        var middleright = [topright[0], (topright[1] + bottomright[1]) / 2];

        return !(!this.getTileProperty(topleft, property) && !this.getTileProperty(topmiddle, property)
            && !this.getTileProperty(topright, property) && !this.getTileProperty(middleleft, property)
            && !this.getTileProperty(middleright, property) && !this.getTileProperty(bottomleft, property)
            && !this.getTileProperty(bottommiddle, property) && !this.getTileProperty(bottomright, property)) ;
    };
	
	this.tryMove = function(sprite, x, y) {
	
		if (x != 0)  {

			if (this.canMove(sprite, x, 0)) {
				sprite.rect.moveIp(x, 0);
			}
			//Left
			else if (x < 0) {
				x = (this.getAbsoluteIndex(sprite.rect.topleft)[0]) * map.tileWidth;
				sprite.rect.left = x;
			}
			//Right
			else if (x > 0 && sprite.rect.left % map.tileWidth != 0) {
				x = (this.getAbsoluteIndex(sprite.rect.topleft)[0] + 1) * map.tileWidth;
				sprite.rect.left = x;
			}
		}
		
		if (y != 0)  {
		
			if (this.canMove(sprite, 0, y)) {
				sprite.rect.moveIp(0, y);
			}
			//Up
			else if (y < 0) {
				y = (this.getAbsoluteIndex(sprite.rect.bottomleft)[1]) * map.tileWidth;
				sprite.rect.bottom = y;
			}
			//Down
			else if (y > 0 && sprite.rect.bottom % map.tileHeight != 0) {
				y = (this.getAbsoluteIndex(sprite.rect.bottomleft)[1] + 1) * map.tileHeight;
				sprite.rect.bottom = y;
			}
		}
	};
	
	this.move = function(sprite, x, y) {
	
		var step = 16;
		
		//X-axis
		while(Math.abs(x) > step) {
			this.tryMove(sprite, sign(x) * step, 0);
			x -= sign(x) * step;
		}
		this.tryMove(sprite, x, 0);
		
		//Y-axis
		while(Math.abs(y) > step) {
			this.tryMove(sprite, 0, sign(y) * step);
			y -= sign(y) * step;
		}
		this.tryMove(sprite, 0, y);
	};
	
	function sign(a) { return a > 0 ? 1 : a < 0 ? -1 : 0; }

   return this;
};

/**
 * LayerView
 * Renders the layer to a big surface.
 */
var LayerView = function(layer, opts) {

   this.draw = function(display, offset) {
      display.blit(this.surface, offset);
   };
   
   this.surface = new gamejs.Surface(opts.width * opts.tileWidth, opts.height * opts.tileHeight);
   this.surface.setAlpha(layer.opacity);
   
   layer.gids.forEach(function(row, i) {
      row.forEach(function(gid, j) {
         if (gid ===0) return;

         var tileSurface = opts.tiles.getSurface(gid);
         if (tileSurface) {
            this.surface.blit(tileSurface,
               new gamejs.Rect([j * opts.tileWidth, i * opts.tileHeight], [opts.tileWidth, opts.tileHeight])
            );
         } else {
            gamejs.log('no gid ', gid, i, j, 'layer', i);
         }
      }, this);
   }, this);
   return this;
};