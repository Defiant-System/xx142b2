
let STATE_TITLE = 0
let STATE_FADEIN = 1
let STATE_PLAY = 2
let STATE_DEAD = 3
let STATE_FADEOUT = 4
let STATE_COMPLETE = 5

let STATE_LEVEL = 6


class Gaming {
	constructor(levels) {
		this.player;
		this.ghosts = [];
		this.currentTick = 0;
		this.history = [];
		this.currentLevel = 0;
		this.fadeTimer = 0;
		this.levelTimer = 0;
		this.state = STATE_TITLE;

		this.el = xx142b2.content;

		this.level;
		this.levels = levels;
		this.buttons = {}

		this.loadLevel(this.currentLevel);

		//stores incrementing value (in seconds) until the next tick, when it's then decremented by 1 tick's length
		this.accumulator = 0;
		this.previous;

		let Self = this;

		this.fpsControl = karaqu.FpsControl({
			fps: 60,
			callback(time=0) {
				if (Self.previous === undefined) {
					Self.previous = time;
				}
				let delta = (time - Self.previous) / 1e3;
				Self.accumulator += delta;

				if (Self.accumulator > 1.0 / settings_tps) {
					Self.accumulator -= 1.0 / settings_tps;
					Self.tick();
				}
				if (Self.accumulator > 1.0 / settings_tps) {
					Self.accumulator = 1.0 / settings_tps;
				}

				Self.draw(Self.accumulator, time / 1e3, delta);
				Self.previous = time;
			}
		});
	}

	get paused() {
		return this._pause;
	}

	over() {
		this.el.data({ show: "intro" });
		// reset values
		this.state = STATE_TITLE;
		this.fadeTimer = 0;
		this.fpsControl.stop();
		this._pause = true;
	}

	start() {
		this.el.data({ show: "level" });
		// game values
		this.state = STATE_LEVEL;
		this.levelTimer = 2;
		this.fpsControl.start();
	}

	pause() {
		this.el.data({ show: "pause" });
		// pause game
		this.fpsControl.stop();
		this._pause = true;
	}

	resume() {
		this.el.data({ show: "game" });
		// resume game
		this.fpsControl.start();
		this._pause = false;
	}

	reset() {
		for (let g of this.ghosts) {
			g.reset();
		}
		this.ghosts.push(new Ghost(this.history, this.level));
		if (this.ghosts.length > settings_maxGhosts) {
			this.ghosts.shift();
		}
		this.currentTick = 0;
		this.history = [];

		//reset level and player
		this.level.reset();
		this.player = new Player(this.level);
		this.state = STATE_FADEIN;
		Draw.scale = 1.5;
	}

	die() {
		if (this.state !== STATE_PLAY) return;
		Sounds.death();
		this.state = STATE_DEAD;
	}

	draw(accumulator, frameTime, timeDelta) {
		Draw.accumulator = accumulator;
		switch (this.state) {
			case STATE_TITLE:
				break;
			case STATE_LEVEL:
				if (this.levelTimer < 0) {
					this.el.data({ show: "game" });
					this.state = STATE_FADEIN;
					this.fadeTimer = 1.0;
					this._pause = false;
				}
				break;
			case STATE_FADEIN:
			case STATE_FADEOUT:
			case STATE_DEAD:
			case STATE_PLAY:
				Draw.setCamera(this.player.position, this.player.movementVector);
				Draw.bg();
				Draw.level(this.level.getLevel(), frameTime, timeDelta, this.state);
				Draw.player(this.player);
				if (this.state === STATE_PLAY) {
					for (let g of this.ghosts) {
						Draw.ghost(g);
					}
				}
				if (this.state === STATE_FADEOUT && this.fadeTimer < 0) {
					this.loadLevel(this.currentLevel + 1);
					this.state = STATE_LEVEL;
					this.levelTimer = 2;
					this.el.data({ show: "level" });
				}
				Draw.timer(this.currentTick / settings_tps);
				break;
			case STATE_COMPLETE:
				this._pause = true;
				this.fpsControl.stop();
				this.el.data({ show: "congrats" });
				break;
		}
	}

	tick() {
		if (this.state === STATE_LEVEL) {
			if (this.levelTimer > 0) {
				this.levelTimer -= 1 / settings_tps;
			}
		}

		if (this.state === STATE_FADEIN || this.state === STATE_FADEOUT) {
			if (this.fadeTimer > 0) {
				this.fadeTimer -= 1 / settings_tps;
			}
		}

		if (this.state === STATE_DEAD) {
			let mv = new Vec2(0, 0);
			while (mv.len() < 40 && this.currentTick > 0) {
				--this.currentTick;
				mv = mv.sub(this.history[this.currentTick]);
			}
			Draw.scale /= 0.95;
			this.player.forceMove(mv);
			if (this.currentTick === 0) {
				this.reset();
			}
			return;
		}

		if (this.state === STATE_PLAY) {
			if (this.level.completed) {
				this.state = STATE_FADEOUT;
				this.fadeTimer = 1.0;
				this.player.movementVector = new Vec2(0, 0); //stops flickering while fading out

				Sounds.win();
				return;
			}
			if (this.currentTick === settings_timeToDie * settings_tps) {
				this.die();
				return;
			}
			this.history[this.currentTick] = this.player.move(this.buttons);
			for (let g of this.ghosts) {
				g.tick(this.currentTick);
			}
			++this.currentTick;
		}

		// if (this.state === STATE_FADEOUT && this.fadeTimer <= 0) {
		// 	if (this.level.last) {
		// 		console.log("started won");
		// 	} else {
		// 		this.loadLevel(this.currentLevel + 1);
		// 		this.state = STATE_FADEIN;
		// 		this.fadeTimer = 1.0;
		// 	}
		// }
	}

	loadLevel(index) {
		this.currentLevel = index;
		if (index >= this.levels.length) {
			this.state = STATE_COMPLETE;
			return;
		}
		this.level = new Level(this.levels[index]);
		this.history = [];
		this.player = new Player(this.level);
		this.ghosts = [];
		this.currentTick = 0;
		Draw.resetCamera();

		// output level info on screen
		this.el.find("#level").html(this.level.last ? "Memory Core" : `Level ${index+1}`);

	}
}
