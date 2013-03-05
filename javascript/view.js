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
	
	this.handle = function(event) {
		if (event.type === gamejs.event.KEY_DOWN) {
			if (event.key === gamejs.event.K_LEFT) {
				offset[0] += map.tileWidth;
			} else if (event.key === gamejs.event.K_RIGHT) {
				offset[0] -= map.tileWidth;
			} else if (event.key === gamejs.event.K_DOWN) {
				offset[1] -= map.tileHeight;
			} else if (event.key === gamejs.event.K_UP) {
				offset[1] += map.tileHeight;
			}
		}
	};
	
	this.update = function(dt) {
		
	}
	
	this.draw = function(display) { 
		layerViews.forEach(function(layerView) {
			layerView.draw(display, offset);
		}, this);
	};
	
	this.getTileIndex = function(pos) {
	
		var x = Math.floor(pos[0] / map.tileWidth);
		var y = Math.floor(pos[1] / map.tileHeight);
		
		return [x, y];
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
		
		return !this.getTileProperty(topleft, "collide") && !this.getTileProperty(topmiddle, "collide") 
			&& !this.getTileProperty(topright, "collide") && !this.getTileProperty(middleleft, "collide") 
			&& !this.getTileProperty(middleright, "collide") && !this.getTileProperty(bottomleft, "collide") 
			&& !this.getTileProperty(bottommiddle, "collide") && !this.getTileProperty(bottomright, "collide") ;
	};
	
	this.tryMove = function(sprite, x, y) {
	
		if (x != 0)  {

			if (this.canMove(sprite, x, 0)) {
				sprite.rect.moveIp(x, 0);
			}
			else {
				//TODO
			}
		}
		
		if (y != 0)  {
		
			if (this.canMove(sprite, 0, y)) {
				sprite.rect.moveIp(0, y);
			}
			else if (sprite.rect.bottom % map.tileHeight != 0) {
				y = this.getTileIndex(sprite.rect.bottomleft)[1] * map.tileHeight;
				sprite.rect.bottom = y + 16;
			}
		}
	}
	
	this.move = function(sprite, x, y) {
	
		var step = 16;
		
		//X-axis
		while(Math.abs(x) > step) {
		
			this.tryMove(sprite, 0, step);
			x > 0 ? x -= step : x += step;
		}
		this.tryMove(sprite, x, 0);
		
		//Y-axis
		while(Math.abs(y) > step) {
		
			this.tryMove(sprite, 0, step);
			y > 0 ? y -= step : y += step;
		}
		this.tryMove(sprite, 0, y);
	}

   return this;
};

/**
 * LayerView
 * Renders the layer to a big surface.
 */
var LayerView = function(layer, opts) {

   this.draw = function(display, offset) {
      display.blit(this.surface, offset);
   }
   
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