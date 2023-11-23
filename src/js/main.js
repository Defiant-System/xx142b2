
@import "./classes/vectors.js"
@import "./classes/drawing.js"
@import "./classes/gaming.js"
@import "./classes/player.js"
@import "./classes/ghost.js"
@import "./classes/level.js"

@import "./modules/math.js"
@import "./modules/settings.js"
@import "./modules/jsfxr.js"
@import "./modules/shaders.js"
@import "./modules/levels.js"
@import "./modules/sound.js"
@import "./modules/mat4.js"
@import "./modules/collision.js"
@import "./modules/build3d.js"

@import "./modules/test.js"

let Draw;
let Game;
let levelIndex = 0;


const xx142b2 = {
	init() {
		// fast references
		this.content = window.find("content");
		// init game
		Draw = new Drawing(window.find("canvas.cvs"));
		Game = new Gaming(levels);
		Game.loadLevel(levelIndex);


		// DEV-ONLY-START
		Test.init(this);
		// DEV-ONLY-END
	},
	dispatch(event) {
		switch (event.type) {
			case "window.init":
				break;
			case "open-help":
				karaqu.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = xx142b2;
