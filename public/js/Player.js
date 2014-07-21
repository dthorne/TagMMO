/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, borderX, borderY, picture) {
	var playerImage = new Image;
	playerImage.src = "images/" + picture;
	var playerImageFrozen = new Image;
	playerImageFrozen.src = "images/frozen_" + picture;
	
	var x = startX,
		name = picture,
		y = startY,
		bX = borderX,
		bY = borderY,
		source = picture,
		frozen = false,
		id,
		moveAmount = 5;

	var update = function(keys) {
		if(!frozen)
		{
			// Up key takes priority over down
			if (keys.up && y > 10) {
				y -= moveAmount;
				return true;
			} else if (keys.down && y < bY - playerImage.height) {
				y += moveAmount;
				return true;
			};

			// Left key takes priority over right
			if (keys.left && x > 8) {
				x -= moveAmount;
				return true;
			} else if (keys.right && x < bX - playerImage.width) {
				x += moveAmount;
				return true;
			};
		}
		return false;
	};

	var draw = function(ctx) {
		if(!frozen) {
			ctx.drawImage(playerImage, x,y,100,100);
		}
		else
		{
			ctx.drawImage(playerImageFrozen, x,y,100,100);
		}
	};

	// Getters and setters
	var getX = function() {
		return x;
	};

	var getY = function() {
		return y;
	};

	var setX = function(newX) {
		x = newX;
	};

	var setY = function(newY) {
		y = newY;
	};
	
	var getName = function() {
		return name;
	};
	
	var setFrozen = function(isFrozen) {
		frozen = isFrozen;
	}
	
	return {
		getName: getName,
		getX: getX,
		getY: getY,
		setX: setX,
		setY: setY,
		setFrozen: setFrozen,
		update: update,
		draw: draw
	}
};