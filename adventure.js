var get = function(id){ var el = document.getElementById(id); return el; }

if (!Function.prototype.bind) { // check if native implementation available
  Function.prototype.bind = function(){ 
    var fn = this, args = Array.prototype.slice.call(arguments),
        object = args.shift(); 
    return function(){ 
      return fn.apply(object, 
        args.concat(Array.prototype.slice.call(arguments))); 
    }; 
  };
}

var Adventure = function(){
	
	/* CONSTANTS
	Change to alter game-play. A simple change would be to alter KNIGHT_HEALTH to adjust difficulty. 
	I would not change LL or the sprite dimensions unless you plan on changing the sprites. */
	this.isProduction = (new RegExp('mycrazydream')).test(document.location.href);
	this.C = {
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
					: '/images',
		SOUND_DIR: (isProduction===true)
					? '/examples/canvas-adventure/sounds/'
					: '/sounds/',
		LL: $('#lifeLayer'),
		BG_WIDTH: 320
	};
	
	// Canvas layers
	this.ctx = {
		w: get('weaponLayer').getContext("2d"),
		b: get('bgLayer').getContext("2d"),
		k: get('playerLayer').getContext("2d"),
		e: get('enemyLayer').getContext("2d")
	};
	
	// Knight object and sprite
	this.knight = {x: 30, y:60, w:C.KNIGHT_W, h:C.KNIGHT_H, lbl:'knight', is_hurt:false, health: C.KNIGHT_HEALTH, score:0};
	var knightPng = new Image(25,30);
	knightPng.src = this.C.IMG_DIR+'shion3.png';
	this.knight.png = knightPng;
	
	//Knife object and sprite
	this.knife = {x: 0, y: 0, lbl:'weapon'};
	var knifePng = new Image();
	knifePng.src = C.IMG_DIR+'Dagger1.gif';
	this.knife.png = knifePng;
	
	// Background sprite and explosion sprite map
	this.bg = new Image();
	this.bg.src = this.C.IMG_DIR+'dungeon1.png';
	this.explosion = new Image();
	this.explosion.src = C.IMG_DIR+'explosprite.png';
	
	// Enemy sprite and object
	this.enemyPng = new Image(25,30);
	this.enemyPng.src = this.C.IMG_DIR+'badguy.png';
	this.enemy_on_screen = false;
	
	
	
	this.ctx.e.current = {}
	this.ctx.w.current = {}
	this.ctx.k.current = this.knight;

    //TODO add sound features
    this.sound = {
		death: 'death.wav',
		damage: 'damage.wav',
		explosion: 'explosion.wav',
		hero_footsteps: 'hero_footsteps.wav',
		hero_hurt: 'hero_hurt.wav',
		howl_close: 'howl_close.wav',
		howl_distant: 'howl_distant.wav',
		monster_stalk: 'monster_stalk.wav'
	};
	this.soundKey = {};
}

Adventure.prototype.createEnemy = function(){
	return {x: this.C.CANVAS_W, y: undefined, w:this.C.ENEMY_W, h:this.C.ENEMY_H, lbl:'enemy', png:this.enemyPng};
}

Adventure.prototype.drawSprite = function(sprite){
	var c = this.ctx[sprite.lbl.substring(0,1)];
	c.save();
	c.drawImage(sprite.png, sprite.x, sprite.y);
	c.restore();
}

Adventure.prototype.removeEnemy = function(sprite){
	this.enemy_on_screen = false;
	this.ctx.e.clearRect(0,0,.this.C.CANVAS_W,this.C.CANVAS_H);
	this.ctx.e.current = {};
}

Adventure.prototype.updateScore = function(){ 
	 $('#scoreLayer').innerHTML = 'Score: '+ this.ctx.k.current.score;
}
	
Adventure.prototype.moveEnemy = function(sprite){
	var that = this;
	if(sprite.x > 0)
	{
		sprite.x-=10;
		this.ctx.e.clearRect(0,0,this.C.CANVAS_W,this.C.CANVAS_H);
		this.drawSprite.bind(Adventure,sprite);
		if(!this.ctx.k.current.is_hurt)
		if(Math.abs(sprite.x-this.ctx.k.current.x)<=30 && Math.abs(sprite.y-this.ctx.k.current.y)<=30) {
			this.hurtKnight.bind(Adventure,this.ctx.k.current);
		}
		sprite.to = setTimeout(function(e){ Adventure.prototype.moveEnemy.bind(Adventure,sprite) }, this.C.ENEMY_SPEED);
	}
	else
	{
		clearTimeout(this.ctx.e.current.to);
		this.ctx.e.clearRect(0,0,this.C.CANVAS_W,this.C.CANVAS_H);
		this.removeEnemy.bind(Adventure);
		this.ctx.k.current.score -= 50;
		Adventure.prototype.updateScore.bind(Adventure);
	}	
}

Adventure.prototype.enemyAttack = function(){
	var that = this;
	this.ctx.e.current = new this.createEnemy.bind(Adventure);
	this.ctx.e.current.y = this.generateRandomEntry();
	if(typeof this.ctx.e.current.y!=='undefined'){
		setTimeout(function(){ that.moveEnemy.bind(Adventure,that.ctx.e.current) },this.C.ENEMY_SPEED);
		this.enemy_on_screen = true;
	}
}
	
//Get the game animation going, and continuing as the background is one scrolling sprite.
Adventure.prototype.tryAnim = function(i){
	var that = this, i;
	if(i > -322){
		this.ctx.b.save();
		this.ctx.b.drawImage(this.bg, i, 0);
		if(Math.random()>.998 && i%2==0 && !this.enemy_on_screen){ enemyAttack() }
		setTimeout(function(){ Adventure.prototype.tryAnim.bind(Adventure,i-2) },10);
		this.ctx.b.restore();
	}
	else {
		this.ctx.b.save();
		setTimeout(function(){ Adventure.prototype.tryAnim.bind(Adventure,this.C.BG_WIDTH) },10);
		this.ctx.b.restore();
	}
}

Adventure.prototype.moveSprite = function(sprite,dir){
	var c = this.ctx[sprite.lbl.substring(0,1)];
	c.clearRect(sprite.x,sprite.y,sprite.w,sprite.h);
	switch(dir)
	{	
		case 'u':
			if(sprite.y > 30){ sprite.y-=10; }
		break;
		case 'd':
			if(sprite.y < 120){ sprite.y+=10; }
		break;
		case 'l':
			if(sprite.x > 30){ sprite.x-=10; }
		break;
		case 'r':
			if(sprite.x < 120){ sprite.x+=10; }
		break;
		default: //move nowhere
	}
	this.drawSprite.bind(Adventure,sprite);
}

//Player controls
Adventure.prototype.doKeyDown = function(e) {
	var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
	e.preventDefault();
	switch(charCode)
	{
		case 38: this.moveSprite.bind(Adventure,this.ctx.k.current,'u'); break;
		case 40: this.moveSprite.bind(Adventure,this.ctx.k.current,'d'); break;
		case 37: this.moveSprite.bind(Adventure,this.ctx.k.current,'l'); break;
		case 39: this.moveSprite.bind(Adventure,this.ctx.k.current,'r'); break;
		case 83: 
			clearTimeout(this.ctx.w.current.to);
			this.ctx.w.current = {};
			this.shootKnife(this.ctx.k.current.x+5, this.ctx.k.current.y+5);
		break;
		case 32: if(!this.jumping){ this.jumpKnight.bind(Adventure,0) }; break;
	}
}

Adventure.prototype.moveKnife = function(){
	if(this.knife.x < this.C.CANVAS_W){
		this.knife.x+=10;
		this.ctx.w.clearRect(0,0,this.C.CANVAS_W,this.C.CANVAS_H);
		this.drawSprite.bind(Adventure,this.knife);
		if(this.ctx.w.current.x && this.ctx.e.current.x){
			if((this.ctx.e.current.x-this.ctx.w.current.x)<=20 &&
				Math.abs(this.ctx.w.current.y-this.ctx.e.current.y)<=30){
				this.destroyEnemy.bind(Adventure);
				this.ctx.k.current.score += 100;
				this.updateScore.bind(Adventure);
			}
		}
		this.ctx.w.current.to = setTimeout(Adventure.prototype.moveKnife.bind(Adventure), 30);
	}
}

Adventure.prototype.shootKnife = function (x,y){
	this.knife.x = x;
	this.knife.y = y;
	this.ctx.w.current = this.knife;
	//playSound() TODO get woosh sound
	this.moveKnife.bind(Adventure);
}
	
    
Adventure.prototype.playSound = function(file, loop) {
		var soundKey = this.C.IMG_DIR+file.split('.')[0];
        this.sound[soundKey] = new Audio(this.C.SOUND_DIR+file);
        this.sound[soundKey].play();
		if(loop===true){
			this.sound[soundKey].addEventListener('ended', function() {
			    this[soundKey].currentTime = 0;
			    this[soundKey].play();
			}, false);
			this.sound[soundKey].play();
		}
    }

Adventure.prototype.stopSound = function(file) {
	var soundKey = file.toString().split('.')[0];
	if(this.sound[soundKey]!==undefined){ this.sound[soundKey].stop() }
}

// Give enemies random entry to surprise player
Adventure.prototype.generateRandomEntry = function(){ return Math.floor(Math.random() * (140 - 40 + 1)) + 40; }
	
	
	
	
// Added jump ability to hero
Adventure.prototype.jumpKnight = function(x){
	var canvas = this.ctx.k,
		sprite = this.ctx.k.current;
	if(x>10){ this.jumping=false;return; }
	else if(x===0){
		this.jumping=true;
		this.originalX = sprite.x;
		this.originalY = sprite.y;
	}
	c.clearRect(sprite.x,sprite.y,sprite.w,sprite.h);
	
	var y = Math.pow(x-5,2)+this.originalY-25;
	sprite.x+=1;
	sprite.y=y;

	this.drawSprite.bind(Adventure,sprite);
	setTimeout(function(){ Adventure.prototype.jumpKnight.bind(Adventure,x+1) },50);
}

// Our hero is dead, what shall we do but inform the player in an obvious manner
Adventure.prototype.killKnight = function(){
	var that = this;
	clearTimeout(this.ctx.k.current.to);
	window.removeEventListener('keydown',this.doKeyDown,true);
	var body = document.getElementsByTagName('body')[0];
	var mask = document.createElement('div');
	var gameOver = document.createElement('h1');
	this.playSound('death.wav',false);
	gameOver.style.opacity=0;
	var lD = $(this.C.LL).html('<span class="dead">d</span> <span class="dead">e</span> <span class="dead">a</span> <span class="dead">d</span>');
	var complete=0;
	$(this.C.LL).children('span').each(function(i){$(this).animate({opacity:'.6'},5000,that.gameOverMask.bind(Adventure,gameOver,mask,body))});
}
	
Adventure.prototype.gameOverMask = function (gameOver,mask,body){
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
Adventure.prototype.hurtKnight = function(knight){
	var that = this;
	knight.health--;
	if(knight.health<=0){
		knight.is_hurt=true;
		this.killKnight.bind(Adventure);
	}
	else{
		this.playSound.bind(Adventure,'hurt.wav',false);
		var lifeStr = 'Life: ';
		for(var i=0;i<knight.health;i++){ lifeStr+=' &hearts;' }
		this.C.LL.html(lifeStr);
		knight.is_hurt=true;
		this.ctx.k.globalAlpha = .5;
		this.moveSprite.bind(Adventure,knight);
		
		setTimeout(function(){ 
			knight.is_hurt=false;
			that.ctx.k.globalAlpha=1;
			that.moveSprite.bind(Adventure,knight)},
		2000);
	}
}

//little bit of currying
Adventure.prototype.moveKnight = function(dir){ this.moveSprite.bind(Adventure,knight, dir) }
	
	
	
// Explosion animation through image map
Adventure.prototype.explode = function(x,y){
	var that = this;
	if(x==3){this.playSound.bind.(Adventure,'explosion.wav',false)}
	x--;
	if(x===-1){
		y--;
		x=3;
	}
	
	if(y>=0){ 
			this.ctx.e.drawImage(
				this.explosion,
				x*30,
				y*30,
				30,
				30,
				this.ctx.e.current.x,
				this.ctx.e.current.y,
				30,
				30
			);
			this.ctx.e.current.to = setTimeout(
				function(){Adventure.prototype.explode.bind(Adventure,x,y)},30
			);
	}
	else{ 
		clearTimeout(that.ctx.e.current.to);
		this.removeEnemy.bind(Adventure); 
	}
}
	
Adventure.prototype.destroyEnemy = function(){
	clearTimeout(this.ctx.e.current.to);
	clearTimeout(this.ctx.w.current.to);
	this.ctx.w.current = {};
	this.ctx.e.clearRect(0,0,this.C.CANVAS_W,this.C.CANVAS_H);
	this.explode.bind(Adventure,4,3);
}
	
	

	
	
}