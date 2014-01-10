var get = function(id){ var el = document.getElementById(id); return el; }

var Adventure = function(){
	
	/* Constants
	Change for alter gameplay. Simple change would be to alter KNIGHT_HEALTH to adjust difficulty. 
	I would not change LL or the sprite dimensions unless you plan on changing the sprites. */
	var C = {
		CANVAS_W: 300,
		CANVAS_H: 160,
		KNIGHT_W: 25,
		KNIGHT_H: 30,
		KNIGHT_HEALTH: 5,
		ENEMY_W: 30,
		ENEMY_H: 30,
		ENEMY_SPEED: 50,
		IMG_DIR: '/images/',
		LL: $('#lifeLayer'),
		BG_WIDTH: 320
	}
	
	var that = this; //identifier so the functions don't get uppity
	
	this.drawSprite = function(o){
		var c = that.ctx[o.lbl.substring(0,1)];
		c.save();
		c.drawImage(o.png, o.x, o.y);
		c.restore();
	}
	
	//Get the game animation going, and continuing as the background is one scrolling sprite.
	this.tryAnim = function(i){

		if(i > -322){
			that.ctx.b.save();
			that.ctx.b.drawImage(bg, i, 0);
			if(Math.random()>.998 && i%2==0 && !enemy_on_screen){ enemyAttack() }
			setTimeout(function(){ that.tryAnim(i-2) },10);
			that.ctx.b.restore();
		}
		else {
			that.ctx.b.save();
			setTimeout(function(){ that.tryAnim(C.BG_WIDTH) },10);
			that.ctx.b.restore();
		}
	}
	
	//Player controls
	this.doKeyDown = function(e) {
		var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
		e.preventDefault();
		switch(charCode)
		{
			case 38: moveSprite(that.ctx.k.current,'u'); break;
			case 40: moveSprite(that.ctx.k.current,'d'); break;
			case 37: moveSprite(that.ctx.k.current,'l'); break;
			case 39: moveSprite(that.ctx.k.current,'r'); break;
			case 83: 
				clearTimeout(that.ctx.w.current.to);
				that.ctx.w.current = {};
				shootKnife(that.ctx.k.current.x+5, that.ctx.k.current.y+5);
			break;
			case 32: if(!this.jumping){ jumpKnight(0) }; break;
		}
	}
	
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
	this.explosion = new Image();
	this.explosion.src = C.IMG_DIR+'explosprite.png';
	
	// Enemy sprite and object
	var enemyPng = new Image(25,30);
	enemyPng.src = C.IMG_DIR+'badguy.png';
	var enemy_on_screen = false;
	var createEnemy = function(){
		return {x: C.CANVAS_W, y: undefined, w:C.ENEMY_W, h:C.ENEMY_H, lbl:'enemy', png:enemyPng};
	}
	
	// Canvas layers
	this.ctx = {
		w: get('weaponLayer').getContext("2d"),
		b: get('bgLayer').getContext("2d"),
		k: get('playerLayer').getContext("2d"),
		e: get('enemyLayer').getContext("2d")
	}
	this.ctx.e.current = {}
	this.ctx.w.current = {}
	this.ctx.k.current = knight;

    //TODO add sound features
    var sndLib = {};
    function playSound(file) {
        sndLib[file] = new Audio(file);
        sndLib[file].play();
    }

    function stopSound(file) {
        if(sndLib[file]){ sndLib[file].stop() }
    }
	
	// Give enemies random entry to surprise player
	var generateRandomEntry = function(){ return Math.floor(Math.random() * (140 - 40 + 1)) + 40; }
	
	
	var enemyAttack = function(){
		that.ctx.e.current = new createEnemy();
		that.ctx.e.current.y = generateRandomEntry();
		if(typeof that.ctx.e.current.y!=='undefined'){
			setTimeout(function(){ moveEnemy(that.ctx.e.current) },C.ENEMY_SPEED);
			enemy_on_screen = true;
		}
	}
	
	// Added jump ability to hero
	var jumpKnight = function(x){
		var c = that.ctx.k,
			o = that.ctx.k.current;
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

		that.drawSprite(o);
		setTimeout(function(){ jumpKnight(x+1) },50);
	}
	
	

	var moveSprite = function(o,dir){
		var c = that.ctx[o.lbl.substring(0,1)];
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
		that.drawSprite(o);
	}

	// Our hero is dead, what shall we do but inform the player in an obvious manner
	var killKnight = function(){
		clearTimeout(that.ctx.k.current.to);
		window.removeEventListener('keydown',that.doKeyDown,true);
		var body = document.getElementsByTagName('body')[0];
		var mask = document.createElement('div');
		var gameOver = document.createElement('h1');
		gameOver.style.opacity=0;
		var lD = $(C.LL).html('<span class="dead">d</span> <span class="dead">e</span> <span class="dead">a</span> <span class="dead">d</span>');
		var complete=0
		$(C.LL).children('span').each(function(i){$(this).animate({opacity:'.6'},5000,gameOverMask(gameOver,mask,body))});
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
			var lifeStr = 'Life: ';
			for(var i=0;i<o.health;i++){ lifeStr+=' &hearts;' }
			C.LL.html(lifeStr);
			o.is_hurt=true;
			that.ctx.k.globalAlpha = .5;
			moveSprite(o);
			setTimeout(function(){o.is_hurt=false;that.ctx.k.globalAlpha=1;moveSprite(o)},2000);
		}
	}
	
	//little bit of currying
	var moveKnight = function(dir){ moveSprite(knight, dir) }
	
	var moveEnemy = function(o){
		if(o.x > 0)
		{
			o.x-=10;
			that.ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			that.drawSprite(o);
			if(!that.ctx.k.current.is_hurt)
			if(Math.abs(o.x-that.ctx.k.current.x)<=30 && Math.abs(o.y-that.ctx.k.current.y)<=30) {
				hurtKnight(that.ctx.k.current);
			}
			o.to = setTimeout(function(e){ moveEnemy(o) }, C.ENEMY_SPEED);
		}
		else
		{
			clearTimeout(that.ctx.e.current.to);
			that.ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			removeEnemy();
			that.ctx.k.current.score -= 50;
			updateScore();
		}	
	}
	
	// Explosion animation through image map
	var explode = function(x,y){
        if(x==3){playSound(C.IMG_DIR+'bomb.wav')}
		x--;
		if(x===-1){
			y--;
			x=3;
		}
		
		if(y>=0){ 
			that.ctx.e.drawImage(that.explosion,x*30,y*30,30,30,that.ctx.e.current.x,that.ctx.e.current.y,30,30);
			that.ctx.e.current.to = setTimeout(function(){explode(x,y)},30) 
		}
		else{ 
			clearTimeout(that.ctx.e.current.to);
			removeEnemy() 
		}
	}
	
	var destroyEnemy = function(){
		clearTimeout(that.ctx.e.current.to);
		clearTimeout(that.ctx.w.current.to);
		that.ctx.w.current = {};
		that.ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
		explode(4,3);
	}
	
	var removeEnemy = function(o){
		enemy_on_screen = false;
		that.ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
		that.ctx.e.current = {};
	}

	var updateScore = function(){ $('#scoreLayer').innerHTML = 'Score: '+ that.ctx.k.current.score }
	var moveKnife = function(){
		if(knife.x < C.CANVAS_W){
			knife.x+=10;
			that.ctx.w.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			that.drawSprite(knife);
			if(that.ctx.w.current.x && that.ctx.e.current.x){
				if((that.ctx.e.current.x-that.ctx.w.current.x)<=20 &&
					Math.abs(that.ctx.w.current.y-that.ctx.e.current.y)<=30){
					destroyEnemy();
					that.ctx.k.current.score += 100;
					updateScore();
				}
			}
			that.ctx.w.current.to = setTimeout(moveKnife, 30);
		}
	}

	var shootKnife = function (x,y){
		knife.x = x;
		knife.y = y;
		that.ctx.w.current = knife;
		moveKnife();
	}
}