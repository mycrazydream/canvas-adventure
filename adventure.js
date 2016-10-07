var get = function(id){ var el = document.getElementById(id); return el; }

var Adventure = function(){
	
	/* Constants
	Change to alter gameplay. Simple change would be to alter CHIEF_HEALTH to adjust difficulty. 
	I would not change LL or the sprite dimensions unless you plan on changing the sprites. */
	var isProduction = (new RegExp('mycrazydream')).test(document.location.href);
	var C = {
		URL: document.location.href,
		CANVAS_W: 300,
		CANVAS_H: 160,
		CHIEF_W: 30,
		CHIEF_H: 45,
		CHIEF_HEALTH: 5,
		ENEMY_W: 30,
		ENEMY_H: 30,
		ENEMY_SPEED: 50,
		IMG_DIR: (isProduction===true)
					? '/game/images/'
					: '/images/',
		SOUND_DIR: (isProduction===true)
					? '/game/sounds/'
					: '/sounds/',
		SPRITE_DIR: (isProduction===true)
					? '/game/sprites/'
					: '/sprites/',
		LL: $('#lifeLayer'),
		BG_WIDTH: 320,
		DIFFICULTY: 1 //Enter 1-5, 1 being easiest 5 being hardest
	};
	
	var that = this; //identifier so the functions don't get uppity
	
	var resetControls = function(){
		this.left = this.right = this.up = this.down = false;
		this.controls = false;
	}
	resetControls();
	
	// masterChief object and sprite
	var masterChief = {
		x:60,
		y:100,
		frameX: 30, 
		frameY: 0, 
		w:C.CHIEF_W, 
		h:C.CHIEF_H, 
		lbl:'master_chief', 
		is_hurt:false, 
		health: C.CHIEF_HEALTH, 
		score:0,
		panel: {
			frames:6,
			rows:1,
			columns:6,
			w:30,
			h:45
		},
		png: (function(){
			var masterChiefPng = new Image(30,45);
			masterChiefPng.src = C.SPRITE_DIR+'mc_running.png';
			return masterChiefPng;
		})()
	};
	
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
	ctx.m = get('playerLayer').getContext("2d");
	ctx.m.current = masterChief;
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
	var generateRandomEntry = function(){ 
		return Math.floor(Math.random() * (140 - 40 + 1)) + 40; 
	}
	
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
	var jumpMasterChief = function(x){
		var c = ctx.m,
			o = ctx.m.current;
		if(x>10){ that.jumping=false;return; }
		else if(x===0){
			that.jumping=true;
			this.originalX = o.x;
			this.originalY = o.y;
		}
		c.clearRect(o.x,o.y,o.w,o.h);
		
		var y = Math.pow(x-5,2)+this.originalY-25;
		o.x+=1;
		o.y=y;

		Adventure.prototype.drawSprite(o);
		setTimeout(function(){ jumpMasterChief(x+1) },50);
	}
	
	

	var moveSprite = function(sprite,dir,panel){
		var c = ctx[sprite.lbl.substring(0,1)];
		c.clearRect(sprite.x,sprite.y,sprite.w,sprite.h);
		switch(dir)
		{	
			case 'u':
				if(sprite.y > 30){
					this.up = true; 
					sprite.y-=4; 
				}
			break;
			case 'd':
				if(sprite.y < 120){ 
					this.down = true;
					sprite.y+=4; 
				}
			break;
			case 'l':
				if(sprite.x > 30){ 
					this.left = true;
					sprite.x-=4; 
				}
			break;
			case 'r':
				if(sprite.x < 120){ 
					this.right = true;
					sprite.x+=4; 
				}
			break;
			default://move nowhere
		}
		this.controls=true;
		Adventure.prototype.drawSprite(sprite);
		resetControls();
	}

	// Our hero is dead, what shall we do but inform the player in an obvious manner
	var killMasterChief = function(){
		clearTimeout(ctx.m.current.to);
		window.removeEventListener('keydown',that.doKeyDown,true);
		var body = document.getElementsByTagName('body')[0];
		var mask = document.createElement('div');
		var gameOver = document.createElement('h1');
		playSound('death.wav',false);
		pause();
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
		gameOver.innerHTML				= 'Game Over<br>Click to reload';
		gameOver.style.backgroundColor	= '#FF0000',
		gameOver.style.fontSize			= '13em';
		gameOver.style.color			= 'DarkRed';
		gameOver.style.width			= '100%';
		gameOver.style.height			= '100%';
		gameOver.style.margin			= '0px';
		gameOver.style.cursor			= "pointer";
		mask.style.width				= '100%';
		mask.style.height				= '100%';
		mask.style.position				= 'absolute';
		mask.style.zIndex				= '1000';
		mask.appendChild(gameOver);
		var maskDom = body.insertBefore(mask,body.firstChild);
		$(gameOver).animate({
			opacity: ".5"
		}, 3000, function(){});
		$(gameOver).on("click",function(){document.location.reload()})
	}
	
	// Collision detection, deplete hero's life. Kill him if life reaches 0.
	var hurtMasterChief = function(o){
		o.health--;
		if(o.health<=0){
			o.is_hurt=true;
			killMasterChief();
		}
		else{
			playSound('hurt.wav',false);
			var lifeStr = 'Life: ';
			for(var i=0;i<o.health;i++){ lifeStr+=' &hearts;' }
			C.LL.html(lifeStr);
			o.is_hurt=true;
			ctx.m.globalAlpha = .5;
			moveSprite(o);
 			
			setTimeout(function(){ 
				o.is_hurt=false;
				ctx.m.globalAlpha=1;
				moveSprite(o)},
			2000);
		}
	}
	
	//little bit of currying
	var moveMasterChief = function(dir){ moveSprite(masterChief, dir) }
	
	var moveEnemy = function(o){
		if(o.x > 0)
		{
			o.x-=10;
			ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			Adventure.prototype.drawSprite(o);
			if(!ctx.m.current.is_hurt)
			if(Math.abs(o.x-ctx.m.current.x)<=30 && Math.abs(o.y-ctx.m.current.y)<=30) {
				hurtMasterChief(ctx.m.current);
			}
			o.to = setTimeout(function(e){ moveEnemy(o) }, C.ENEMY_SPEED);
		}
		else
		{
			clearTimeout(ctx.e.current.to);
			ctx.e.clearRect(0,0,C.CANVAS_W,C.CANVAS_H);
			removeEnemy();
			ctx.m.current.score -= 50;
			updateScore(ctx.m.current.score);
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
					ctx.m.current.score += 100;
					updateScore(ctx.m.current.score);
				}
			}
			ctx.w.current.to = setTimeout(moveKnife, 30);
		}
	}

	//TODO add upgrade ability to shoot multiple knives on screen
	var shootKnife = function (x,y){
		knife.x = x;
		knife.y = y;
		ctx.w.current = knife;
		//playSound() TODO get woosh sound
		moveKnife();
	}
	
	//TODO add pause sound and visual cue
	var pause = function(){
		Adventure.prototype.paused=!Adventure.prototype.paused;
		if(Adventure.prototype.paused===false){
			Adventure.prototype.animateBG(320);
			Adventure.prototype.animateBG(0);
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
	
	var animateSprite = function(canvas, sprite, frame){
		if(frame>sprite.panel.frames){ frame = 0; }
		canvas.save();
		canvas.drawImage(sprite.png, sprite.frameX*frame, sprite.frameY, sprite.panel.w, sprite.panel.h, sprite.x, sprite.y, sprite.panel.w, sprite.panel.h);
		canvas.restore();
		if(this.controls===true){
			this.heroTO = setTimeout(function(){ animateSprite(canvas,sprite,++frame); }, 500);
		}
		else{
			this.controls = false;
			clearTimeout(this.heroTO);
		}
	}
	
	Adventure.prototype.drawSprite = function(sprite){
		$("#canvasCt").focus();
		var c = ctx[sprite.lbl.substring(0,1)];

		if($.type(sprite.panel)==='object'){
			if($.type(sprite.panel.w)!=='number' || $.type(sprite.panel.h)!=='number'){ 
				throw new TypeError('sprite.panel.w or sprite.panel.h are not numbers') 
			}
			else { //animate our image using sprite panel
				animateSprite(c,sprite,0);
			}
		}
		else{
			c.save();
			c.drawImage(sprite.png, sprite.x, sprite.y);
			c.restore();
		}
	};
	
	var start 	= null;
	var bgs		= [document.getElementById("bgLayer"), document.getElementById("bgLayer2")]
	//Get the game animation going, and continuing as the background 
	//is one scrolling sprite.
	Adventure.prototype.animateBG = function(timestamp){
		if(!Adventure.prototype.paused){//stop constant animation
			if (!start) start = 0;
			start++;
			
			bgs[0].style.left = (0-(start*4)) + "px";
			bgs[1].style.left = (300-(start*4)) + "px";
			
			function reset(bg,bg2){
				bg.style.left 	= "300px";
				bg2.style.left 	= "0px";
				start			= 0;
				return [bg2,bg]
			}
			var difficulty = 0;
			switch(C.DIFFICULTY){
				case 2:
					difficulty = .95;
				break;
				case 3:
					difficulty = .925;
				break;
				case 4:
					difficulty = .9;
				break;
				case 5:
					difficulty = .875;
				break;
				case 1:
				default:
					difficulty = .975;
				break;
			}
			if(Math.random()>difficulty && start%2==0 && !enemy_on_screen){
				 enemyAttack() 
			}
			
			if (bgs[1].style.left.replace('px','')*1 <= 0 && bgs[0].style.left === '-300px') {
				bgs = reset(bgs[0], bgs[1]);
			}
			
			window.requestAnimationFrame(Adventure.prototype.animateBG);
			/*
			if(i >= -320){
				console.log(i)
				ctx.b.save();
				ctx.b.drawImage(bg, i, 0);
				
				ctx.b.to1 = setTimeout(
					function(){ Adventure.prototype.animateBG(i-2) },
					5
				);
				ctx.b.restore();
			}
			else {
				console.log(i)
				ctx.b.save();
				ctx.b.to2 = setTimeout(
					function(){ Adventure.prototype.animateBG(C.BG_WIDTH) },
					5
				);
				ctx.b.restore();
			}
			*/
		}
	}
	
	//Player controls
	Adventure.prototype.doKeyDown = function(e) {
		var charCode = e.keyCode;
		e.preventDefault();

		if(Adventure.prototype.paused===false){//don't respond to controls, we're frozen
		
			switch(charCode)
			{
				case 38: 
					if(!this.up){ moveSprite(ctx.m.current,'u') }
				break;
				case 40: 
					if(!this.down){ moveSprite(ctx.m.current,'d') }
				break;
				case 37: 
					if(!this.left){ moveSprite(ctx.m.current,'l') }
				break;
				case 39: 
					if(!this.right){ moveSprite(ctx.m.current,'r') }
				break;
				case 83: 
					clearTimeout(ctx.w.current.to);
					ctx.w.current = {};
					shootKnife(ctx.m.current.x+5, ctx.m.current.y+5);
				break;
				case 80: pause(); break; 
				case 32: if(!that.jumping){ jumpMasterChief(0) }; break;
			}
		}else if(charCode===80){
			pause();
		}
	}
	
	return {
		'ctx':ctx, 
		'explosion': explosion, 
		'animateBG': Adventure.prototype.animateBG,
		'doKeyDown': Adventure.prototype.doKeyDown,
		'drawSprite': Adventure.prototype.drawSprite
	};
}
