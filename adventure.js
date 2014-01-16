var get = function(id){ var el = document.getElementById(id); return el; }

var Adventure = function(){
	
	/* Constants
	Change to alter gameplay. Simple change would be to alter KNIGHT_HEALTH to adjust difficulty. 
	I would not change LL or the sprite dimensions unless you plan on changing the sprites. */
	var isProduction = (new RegExp('mycrazydream')).test(document.location.href);
	var C = {
		URL: document.location.href,
		CANVAS_W: 300,
		CANVAS_H: 160,
		KNIGHT_W: 25,
		KNIGHT_H: 30,
		KNIGHT_HEALTH: 5,
		ENEMY_W: 30,
		ENEMY_H: 30,
		ENEMY_SPEED: 50,
		IMG_DIR: (isProduction===true)
					? '/examples/canvas-adventure/images/'
					: '/images/',
		SOUND_DIR: (isProduction===true)
					? '/examples/canvas-adventure/sounds/'
					: '/sounds/',
		LL: $('#lifeLayer'),
		BG_WIDTH: 320
	};
	
	var that = this; //identifier so the functions don't get uppity
	
	// Knight object and sprite
	var knight = {x: 30, y:60, w:C.KNIGHT_W, h:C.KNIGHT_H, lbl:'knight', is_hurt:false, health: C.KNIGHT_HEALTH, score:0};
	var knightPng = new Image(25,30);
	knightPng.src = C.IMG_DIR+'shion3.png';
	knight.png = knightPng;
	
	//Knife object and sprite
	var knife = {x: 0, y: 0, lbl:'weapon'};
	var knifePng = new Image();
	knifePng.src = C.IMG_DIR+'Dagger1.gif';
	knife.png = knifePng;
	
	// Background sprite and explosion sprite map
	var bg = new Image();
	bg.src = C.IMG_DIR+'dungeon1.png';
	var explosion = new Image();
	explosion.src = C.IMG_DIR+'explosprite.png';
	
	// Enemy sprite and object
	var enemyPng = new Image(25,30);
	enemyPng.src = C.IMG_DIR+'badguy.png';
	var enemy_on_screen = false;
	var createEnemy = function(){
		return {x: C.CANVAS_W, y: undefined, w:C.ENEMY_W, h:C.ENEMY_H, lbl:'enemy', png:enemyPng};
	}
	
	Adventure.prototype.paused = false;
	
	//TODO add sound features
    var sound = {
		death: 'death.wav',
		damage: 'damage.wav',
		explosion: 'explosion.wav',
		hero_footsteps: 'hero_footsteps.wav',
		hero_hurt: 'hero_hurt.wav',
		howl_close: 'howl_close.wav',
		howl_distant: 'howl_distant.wav',
		monster_stalk: 'monster_stalk.wav'
	},
	key = {};
	
	var ctx = {};
	ctx.w = get('weaponLayer').getContext("2d");
	ctx.w.current = {};
	ctx.b = get('bgLayer').getContext("2d");
	ctx.k = get('playerLayer').getContext("2d");
	ctx.k.current = knight;
	ctx.e = get('enemyLayer').getContext("2d");
	ctx.e.current = {};
    
	var playSound = function(file, loop) {
		key = C.IMG_DIR+file.split('.')[0];
        sound[key] = new Audio(C.SOUND_DIR+file);
        sound[key].play();
		if(loop===true){
			sound[key].addEventListener('ended', function() {
			    this[key].currentTime = 0;
			    this[key].play();
			}, false);
			sound[key].play();
		}
    }

    var stopSound = function(file) {
		key = file.toString().split('.')[0];
        if(sound[key]!==undefined){ sound[key].stop() }
    }

	// Give enemies random entry to surprise player
	var generateRandomEntry = function(){ return Math.floor(Math.random() * (140 - 40 + 1)) + 40; }
	
	
	var enemyAttack = function(){
		var that = this;
		ctx.e.current = new createEnemy();
		ctx.e.current.y = generateRandomEntry();
		if(typeof ctx.e.current.y!=='undefined'){
			ctx.e.current.to = setTimeout(
				function(){ moveEnemy(ctx.e.current) },
				C.ENEMY_SPEED
			);
			enemy_on_screen = true;
		}
	}
	
	// Added jump ability to hero
	var jumpKnight = function(x){
		var c = ctx.k,
			o = ctx.k.current;
		if(x>10){ this.jumping=false;return; }
		else if(x===0){
			this.jumping=true;
			this.originalX = o.x;
			this.originalY = o.y;
		}
		c.clearRect(o.x,o.y,o.w,o.h);
		
		var y = Math.pow(x-5,2)+this.originalY-25;
		o.x+=1;
		o.y=y;

		Adventure.prototype.drawSprite(o);
		setTimeout(function(){ jumpKnight(x+1) },50);
	}
	
	

	var moveSprite = function(o,dir){
		var c = ctx[o.lbl.substring(0,1)];
		c.clearRect(o.x,o.y,o.w,o.h);
		switch(dir)
		{	
			case 'u':
				if(o.y > 30){ o.y-=10; }
			break;
			case 'd':
				if(o.y < 120){ o.y+=10; }
			break;
			case 'l':
				if(o.x > 30){ o.x-=10; }
			break;
			case 'r':
				if(o.x < 120){ o.x+=10; }
			break;
			default://move nowhere
		}
		Adventure.prototype.drawSprite(o);
	}

	// Our hero is dead, what shall we do but inform the player in an obvious manner
	var killKnight = function(){
		clearTimeout(ctx.k.current.to);
		window.removeEventListener('keydown',that.doKeyDown,true);
		var body = document.getElementsByTagName('body')[0];
		var mask = document.createElement('div');
		var gameOver = document.createElement('h1');
		playSound('death.wav',false);
		gameOver.style.opacity=0;
		var lD = $(C.LL).html('<span class="dead">d</span> <span class="dead">e</span> <span class="dead">a</span> <span class="dead">d</span>');
		var complete=0;
		$(C.LL).children('span').each(
			function(i){
				$(this).animate({opacity:'.6'}, 
				5000,
				gameOverMask(gameOver,mask,body))
			}
		);
	}
	
	var gameOverMask = function (gameOver,mask,body){
		gameOver.innerHTML 		 		= 'Game Over';
		gameOver.style.backgroundColor  = '#FF0000',
		gameOver.style.fontSize  		= '13em';
		gameOver.style.color	 		= 'DarkRed'
		gameOver.style.margin			= '0px';
		mask.style.width 		 		= '100%';
		mask.style.height 		 		= '100%';
		mask.style.position 	 		= 'absolute';
		mask.style.zIndex 		 		= '1000';
		mask.appendChild(gameOver);
		var maskDom = body.insertBefore(mask,body.firstChild);
		$(gameOver).animate({
			opacity: ".5"
		}, 3000, function(){});
	}
	
	// Collision detection, deplete hero's life. Kill him if life reaches 0.
	var hurtKnight = function(o){
		o.health--;
		if(o.health<=0){
			o.is_hurt=true;
			killKnight();
		}
		else{
			playSound('hurt.wav',false);
			var lifeStr = 'Life: ';
			for(var i=0;i<o.health;i++){ lifeStr+=' &hearts;' }
			C.LL.html(lifeStr);
			o.is_hurt=true;
			ctx.k.globalAlpha = .5;
			moveSprite(o);
 			
			setTimeout(function(){ 
				o.is_hurt=false;
				ctx.k.globalAlpha=1;
				moveSprite(o)},
			2000);
		}
	}
	
	//little bit of currying
	var moveKnight = function(dir){ moveSprite(knight, dir) }
	
	var moveEnemy = function(o){
		if(o.x > 0)
		{
			o.x-=10;
			ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			Adventure.prototype.drawSprite(o);
			if(!ctx.k.current.is_hurt)
			if(Math.abs(o.x-ctx.k.current.x)<=30 && Math.abs(o.y-ctx.k.current.y)<=30) {
				hurtKnight(ctx.k.current);
			}
			o.to = setTimeout(function(e){ moveEnemy(o) }, C.ENEMY_SPEED);
		}
		else
		{
			clearTimeout(ctx.e.current.to);
			ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			removeEnemy();
			ctx.k.current.score -= 50;
			updateScore(ctx.k.current.score);
		}	
	}
	
	// Explosion animation through image map
	var explode = function(x,y){
        if(x==3){playSound('explosion.wav',false)}
		x--;
		if(x===-1){
			y--;
			x=3;
		}
		
		if(y>=0){ 
				ctx.e.drawImage(
					explosion,
					x*30,
					y*30,
					30,
					30,
					ctx.e.current.x,
					ctx.e.current.y,
					30,
					30
				);
			    ctx.e.current.to = setTimeout(
					function(){explode(x,y)},30
				);
		}
		else{ 
			clearTimeout(ctx.e.current.to);
			removeEnemy() 
		}
	}
	
	var destroyEnemy = function(){
		clearTimeout(ctx.e.current.to);
		clearTimeout(ctx.w.current.to);
		ctx.w.current = {};
		ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
		explode(4,3);
	}
	
	var removeEnemy = function(o){
		enemy_on_screen = false;
		ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
		ctx.e.current = {};
	}

	var updateScore = function(score){
		 $('#scoreLayer').html('Score: '+ score.toString());
	}
	var moveKnife = function(){
		if(knife.x < C.CANVAS_W){
			knife.x+=10;
			ctx.w.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			Adventure.prototype.drawSprite(knife);
			if(ctx.w.current.x && ctx.e.current.x){
				if((ctx.e.current.x-ctx.w.current.x)<=20 &&
					Math.abs(ctx.w.current.y-ctx.e.current.y)<=30){
					destroyEnemy();
					ctx.k.current.score += 100;
					updateScore(ctx.k.current.score);
				}
			}
			ctx.w.current.to = setTimeout(moveKnife, 30);
		}
	}

	var shootKnife = function (x,y){
		knife.x = x;
		knife.y = y;
		ctx.w.current = knife;
		//playSound() TODO get woosh sound
		moveKnife();
	}
	
	var pause = function(){
		Adventure.prototype.paused=!Adventure.prototype.paused;
		if(Adventure.prototype.paused===false){
			Adventure.prototype.animate(320);
			Adventure.prototype.animate(0);
			if(enemy_on_screen===true){
				//restore enemy approach
				ctx.e.current.to = setTimeout(
					function(){ moveEnemy(ctx.e.current) },
					C.ENEMY_SPEED
				);
			}
		}
		else{
			if(enemy_on_screen===true){
				//pause enemy
				clearTimeout(ctx.e.current.to);
			}
		}
	}
	
	Adventure.prototype.drawSprite = function(sprite){
		var c = ctx[sprite.lbl.substring(0,1)];
		c.save();
		c.drawImage(sprite.png, sprite.x, sprite.y);
		c.restore();
	};
	
	//Get the game animation going, and continuing as the background 
	//is one scrolling sprite.
	Adventure.prototype.animate = function(i){
		if(!Adventure.prototype.paused){//stop constant animation
			if(i > -322){
				ctx.b.save();
				ctx.b.drawImage(bg, i, 0);
				if(Math.random()>.998 && i%2==0 && !enemy_on_screen){
					 enemyAttack() 
				}
				ctx.b.to1 = setTimeout(
					function(){ Adventure.prototype.animate(i-2) },
					10
				);
				ctx.b.restore();
			}
			else {
				ctx.b.save();
				ctx.b.to2 = setTimeout(
					function(){ Adventure.prototype.animate(C.BG_WIDTH) },
					10
				);
				ctx.b.restore();
			}
		}
	}
	
	//Player controls
	Adventure.prototype.doKeyDown = function(e) {
		var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
		e.preventDefault();
		if(Adventure.prototype.paused===false){//don't respond to controls, we're frozen
			switch(charCode)
			{
				case 38: 
				moveSprite(ctx.k.current,'u'); 
				break;
				case 40: moveSprite(ctx.k.current,'d'); break;
				case 37: moveSprite(ctx.k.current,'l'); break;
				case 39: moveSprite(ctx.k.current,'r'); break;
				case 83: 
					clearTimeout(ctx.w.current.to);
					ctx.w.current = {};
					shootKnife(ctx.k.current.x+5, ctx.k.current.y+5);
				break;
				case 80: pause(); break; 
				case 32: if(!this.jumping){ jumpKnight(0) }; break;
			}
		}else if(charCode===80){
			pause();
		}
		
	}
	return {
		'ctx':ctx, 
		'explosion': explosion, 
		'animate': Adventure.prototype.animate,
		'doKeyDown': Adventure.prototype.doKeyDown,
		'drawSprite': Adventure.prototype.drawSprite
	};
}