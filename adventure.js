var get = function(id){ var el = document.getElementById(id); return el; }

var Adventure = function(){

	var C = {
		CANVAS_W: 300,
		CANVAS_H: 160,
		KNIGHT_W: 25,
		KNIGHT_H: 30,
		KNIGHT_HEALTH: 5,
		ENEMY_W: 30,
		ENEMY_H: 30,
		ENEMY_SPEED: 50
	}
	
	var knight = {x: 30, y:60, w:C.KNIGHT_W, h:C.KNIGHT_H, lbl:'knight', is_hurt:false, health: C.KNIGHT_HEALTH, score:0};
	var knightPng = new Image(25,30);
	knightPng.src = 'shion3.png';
	knight.png = knightPng;
	
	var knife = {x: 0, y: 0, lbl:'weapon'};
	var knifePng = new Image();
	knifePng.src = 'Dagger1.gif';
	knife.png = knifePng;
	
	var bg = new Image();
	bg.src = 'dungeon1.png';
	var explosion = new Image();
	explosion.src = 'explosprite.png';
	
	var enemyPng = new Image(25,30);
	enemyPng.src = 'badguy.png';
	var enemy_on_screen = false;
	var createEnemy = function(){
		return {x: C.CANVAS_W, y: undefined, w:C.ENEMY_W, h:C.ENEMY_H, lbl:'enemy', png:enemyPng};
	}
	
	var ctx = {
		w: get('weaponLayer').getContext("2d"),
		b: get('bgLayer').getContext("2d"),
		k: get('playerLayer').getContext("2d"),
		e: get('enemyLayer').getContext("2d")
	}
	ctx.e.current = {}
	ctx.w.current = {}
	ctx.k.current = knight;

	var tryAnim = function(i){

		if(i > -322){
			ctx.b.save();
			ctx.b.drawImage(bg, i, 0);
			if(Math.random()>.998 && i%2==0 && !enemy_on_screen){ enemyAttack() }
			setTimeout(function(){ tryAnim(i-2) },10);
			ctx.b.restore();
		}
		else {
			ctx.b.save();
			setTimeout(function(){ tryAnim(320) },10);
			ctx.b.restore();
		}
	}


    //TODO add sound features
    var sndLib = {};
    function playSound(file) {
        sndLib[file] = new Audio(file);
        sndLib[file].play();
    }

    function stopSound(file) {
        if(sndLib[file]){ sndLib[file].stop() }
    }
	
	var generateRandomEntry = function(){ return Math.floor(Math.random() * (140 - 40 + 1)) + 40; }
	
	var enemyAttack = function(){
		ctx.e.current = new createEnemy();
		ctx.e.current.y = generateRandomEntry();
		if(typeof ctx.e.current.y!=='undefined'){
			setTimeout(function(){ moveEnemy(ctx.e.current) },C.ENEMY_SPEED);
			enemy_on_screen = true;
		}
	}

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

		drawSprite(o);
		setTimeout(function(){ jumpKnight(x+1) },50);
	}
	
	var drawSprite = function(o){
		var c = ctx[o.lbl.substring(0,1)];
		c.save();
		c.drawImage(o.png, o.x, o.y);
		c.restore();
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
		drawSprite(o);
	}
	
	var killKnight = function(){
		clearTimeout(ctx.k.current.to);
		window.removeEventListener('keydown',doKeyDown,true);
		var body = document.getElementsByTagName('body')[0];
		var mask = document.createElement('div');
		var gameOver = document.createElement('h1');
		gameOver.innerHTML = 'Game Over';
		gameOver.style.color = 'DarkRed';
		gameOver.style.fontSize = '10em';
		gameOver.style.margin = '40px auto auto';
		mask.style.backgroundColor = '#FF0000';
		mask.style.opacity = '.5';
		mask.style.width = '100%';
		mask.style.height = '100%';
		mask.style.position = 'absolute';
		mask.style.zIndex = '1000';
		mask.appendChild(gameOver);
		var maskDom = body.insertBefore(mask,body.firstChild);
	}
	
	var hurtKnight = function(o){
		o.health--;
		if(o.health<=0){
			o.is_hurt=true;
			killKnight();
		}
		else{
			var lifeStr = 'Life: ';
			for(var i=0;i<o.health;i++){ lifeStr+=' &hearts;' }
			get('lifeLayer').innerHTML = lifeStr;
			o.is_hurt=true;
			ctx.k.globalAlpha = .5;
			moveSprite(o);
			setTimeout(function(){o.is_hurt=false;ctx.k.globalAlpha=1;moveSprite(o)},2000);
		}
	}
	
	//little bit of currying
	var moveKnight = function(dir){ moveSprite(knight, dir) }
	
	var moveEnemy = function(o){
		if(o.x > 0)
		{
			o.x-=10;
			ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			drawSprite(o);
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
			updateScore();
		}	
	}
	
	var explode = function(x,y){
        if(x==3){playSound('bomb-03.wav')}
		x--;
		if(x===-1){
			y--;
			x=3;
		}
		
		if(y>=0){ 
			ctx.e.drawImage(explosion,x*30,y*30,30,30,ctx.e.current.x,ctx.e.current.y,30,30);
			ctx.e.current.to = setTimeout(function(){explode(x,y)},30) 
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

	var updateScore = function(){ get('scoreLayer').innerHTML = 'Score: '+ ctx.k.current.score }
	var moveKnife = function(){
		if(knife.x < C.CANVAS_W){
			knife.x+=10;
			ctx.w.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			drawSprite(knife);
			if(ctx.w.current.x && ctx.e.current.x){
				if((ctx.e.current.x-ctx.w.current.x)<=20 &&
					Math.abs(ctx.w.current.y-ctx.e.current.y)<=30){
					destroyEnemy();
					ctx.k.current.score += 100;
					updateScore();
				}
			}
			ctx.w.current.to = setTimeout(moveKnife, 30);
		}
	}

	var shootKnife = function (x,y){
		knife.x = x;
		knife.y = y;
		ctx.w.current = knife;
		moveKnife();
	}

	var doKeyDown = function(e) {
		var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
		e.preventDefault();
		switch(charCode)
		{
			case 38: moveSprite(ctx.k.current,'u'); break;
			case 40: moveSprite(ctx.k.current,'d'); break;
			case 37: moveSprite(ctx.k.current,'l'); break;
			case 39: moveSprite(ctx.k.current,'r'); break;
			case 83: 
				clearTimeout(ctx.w.current.to);
				ctx.w.current = {};
				shootKnife(ctx.k.current.x+5, ctx.k.current.y+5);
			break;
			case 32: if(!this.jumping){ jumpKnight(0) }; break;
		}
	}
	
	window.addEventListener('keydown',doKeyDown,true);
	
	var init = function() {
	 	tryAnim(320);
		tryAnim(0);
		drawSprite(ctx.k.current);
	}
	
	explosion.onload = init;
}
