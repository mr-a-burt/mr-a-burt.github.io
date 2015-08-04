// prey constants
var PREY_MIN = 3;
var PREY_MAX = 360; // requires restart to adjust
var PREY_GROWTH_RATE = 2; // multiplier for the surviving prey  //^
var PREY_SURVIVAL_RATE = 0.5; // multiplier for survival when prey pop reaches max //^
var PREY_RANGE = 30;  // max movement (+ve or -ve) in either direction

// predator constants
var PRED_MIN = 1;
var PRED_MIN_EAT = 3;  //^
var PRED_MAX_EAT = 9; //^
var PRED_REPRO_PREY = 3; // number of prey per baby //^
var PRED_REPRO_MAX = 3; // max number of babies
var PRED_RANGE = 300;  // max movement (+ve or -ve) in either direction

// starting values;
var STARTING_PREY = 3; //^
var STARTING_PRED = 1; //^

// sim boundaries
var X_MIN = 20;
var X_MAX = 580;
var Y_MIN = 20;
var Y_MAX = 580;

function preload() {
    
    game.load.image('predator', 'owl.png');
    game.load.image('prey','mouse.png');
    game.load.image('sim_area', 'sim_area.png');
    game.load.image('sidebar', 'sidebar.png');
    game.load.image('btn_next', 'next.png');
    game.load.image('btn_reset', 'reset.png');
}

// groups
var preyGroup;
var predGroup;

// counter
var generationCounter;

// buttons
var restartButton;
var nextButton;

// adapting lables
var generationLable;
var preyLivingLable;
var preyConsumedLable;
var predLivingLable;
var predBabiesLable;
var predStarvedLable;

var lableX = 615;
var lableYStart = 30;
var lableYInc = 60;
var generationLableText = "Generation: ";
var preyLivingLableText =   "Prey Living:   ";
var consumedLableText = "Prey Consumed: ";
var predLivingLableText =   "Predators Living:   ";
var predBabiesLableText = "Baby Predators: "
var starvedLableText =  "Predators Starved:  ";

function create() {
    game.add.image(0,0, 'sim_area');
    game.add.image(600,0, 'sidebar');
    
    generationLable = game.add.text(lableX, lableYStart + lableYInc * 0, generationLableText + 0, {fontSize: '16px', fill: '#000' });
    preyLivingLable = game.add.text(lableX, lableYStart + lableYInc * 1, preyLivingLableText + STARTING_PREY, {fontSize: '16px', fill: '#000' });
    preyConsumedLable = game.add.text(lableX, lableYStart + lableYInc * 2, consumedLableText + 0, {fontSize: '16px', fill: '#000' });
    predLivingLable = game.add.text(lableX, lableYStart + lableYInc * 3, predLivingLableText + STARTING_PRED, {fontSize: '16px', fill: '#000' });
    predBabiesLable = game.add.text(lableX, lableYStart + lableYInc * 4, predBabiesLableText + 0, {fontSize: '16px', fill: '#000' });
    predStarvedLable = game.add.text(lableX, lableYStart + lableYInc * 5, starvedLableText + 0, {fontSize: '16px', fill: '#000' });
    
    var btn_reset = game.add.button(625, 510, 'btn_reset', resetSim, this, 0, 0, 0, 0);
    var btn_next = game.add.button(625, 420, 'btn_next', nextGen, this, 0, 0, 0, 0);
    
    createPreyGroup();
    predGroup = game.add.group();
    
    startSim();
}

function createPreyGroup() {
    preyGroup = game.add.group();
    preyGroup.createMultiple(PREY_MAX * 2, 'prey');
    preyGroup.setAll('anchor.x', 0.5);
    preyGroup.setAll('anchor.y', 0.5);
}

function startSim() {
    generationCounter = 0;
    // spawn prey
    for (var i = 0; i < STARTING_PREY; i++) {
        createPrey();
    }
    // spawn predator
	for (i = 0; i < STARTING_PRED; i++) {
		createPredator();
	}
	console.log("Generation","Living Prey","Consumed Prey","Living Predators","Baby Predators","Starved Predators");
	console.log(0,STARTING_PREY,0,STARTING_PRED,0,0);
}

function createPredator() {
    var x = game.rnd.integerInRange(X_MIN, X_MAX);
    var y = game.rnd.integerInRange(Y_MIN, Y_MAX);
    var predator = predGroup.getFirstExists(false);
    if (predator) {
        predator.reset(x,y);
    } else {
        predator = predGroup.create(x, y, 'predator');
        predator.anchor.setTo(0.5,0.5);
    }
    predator.consumed = 0;
    predator.starved = false;
    predator.adult = false;
    predator.scale.setTo(0.5, 0.5);
}

function createPrey() {
    var x = game.rnd.integerInRange(X_MIN, X_MAX);
    var y = game.rnd.integerInRange(Y_MIN, Y_MAX);
    var prey = preyGroup.getFirstExists(false);
    if (prey) {
        prey.reset(x,y);
        prey.eaten = false;
    }
}

function update() {

}

var countConsumed;
var countStarved;
var preyPop;
var predAdultPop;
var predBabyPop;

function nextGen() {
    cleanUp();
    generationCounter++;
    countConsumed = 0;
    countStarved = 0;
    // move animals
    movePrey();
    movePredator();
    // manage populations
    preyPop = 0;
    var prey;
    for (var i = 0; i < preyGroup.length; i++) {
        prey = preyGroup.getAt(i);
        if (prey.alive && !prey.consumed) {
            preyPop++;
        }
    }
    if (preyPop > PREY_MAX) { 
		preyStarvation();
		huntingTime();
	} else {
		huntingTime();
		preyGrowth();
	}
	predatorPopulation();
	
    generationLable.text = generationLableText + generationCounter;
    preyLivingLable.text = preyLivingLableText + preyPop;
    preyConsumedLable.text = consumedLableText + countConsumed;
    predLivingLable.text = predLivingLableText + predAdultPop;
    predBabiesLable.text = predBabiesLableText + predBabyPop;
    predStarvedLable.text = starvedLableText + countStarved;
	console.log(generationCounter,preyPop,countConsumed,predAdultPop,predBabyPop,countStarved);
}

function preyStarvation() {	
    var dPop = preyPop * PREY_SURVIVAL_RATE;
    var dead;
	var d = 0;
	while (preyPop > dPop) {
        dead = preyGroup.getAt(d);
		if (dead) {
			if (dead.alive && !dead.consumed) {
				dead.kill();
				preyPop--;
			}
        }
		d++;
    } 
}

function preyGrowth() {
	preyPop = 0;
    var prey;
    for (var i = 0; i < preyGroup.length; i++) {
        prey = preyGroup.getAt(i);
        if (prey.alive && !prey.consumed) {
            preyPop++;
        }
    }
	if (preyPop < PREY_MIN) {
        while (preyPop < PREY_MIN) {
            createPrey();
            preyPop++;
        }
    } else {
		var gPop = preyPop * PREY_GROWTH_RATE;
		while (preyPop < gPop) {
			createPrey();
			preyPop++;
		}
	}
}

function predatorPopulation() {
    var predator;
    for (var i = 0; i < predGroup.length; i++) {
        predator = predGroup.getAt(i);
        if (predator.alive && predator.adult) {
            //console.log("predator " + i + " consumed " + predator.consumed);
            if (predator.consumed < PRED_MIN_EAT) {
                countStarved++;
                predator.starved = true;
            } else {
                var babies = predator.consumed / PRED_REPRO_PREY;
                if (babies > PRED_REPRO_MAX) {
                    babies = PRED_REPRO_MAX;
                }
                for (var b = 1; b <= babies; b++) {
                    createPredator();
                }
            }
            predator.consumed = 0;
        }
    }
    predAdultPop = 0;
    predBabyPop = 0;
    for (var j = 0; j < predGroup.length; j++) {
        var pred = predGroup.getAt(j);
        if (pred.alive) {
            if (pred.adult && !pred.starved) {
                predAdultPop++;
            } else if (!pred.adult) {
                predBabyPop++;
            }
        }
    }
    while ((predAdultPop + predBabyPop) < PRED_MIN) {
        createPredator();
        predBabyPop++;
    }
}

function movePrey() {
    for (var i = 0; i < preyGroup.length; i++) {
        var prey = preyGroup.getAt(i);
        if (prey.alive) {
            var dx = game.rnd.integerInRange(-PREY_RANGE, PREY_RANGE);
            var dy = game.rnd.integerInRange(-PREY_RANGE, PREY_RANGE);
            prey.x += dx;
            prey.y += dy;
            if (prey.x < X_MIN) {
                prey.x = X_MIN;
            } else if (prey.x > X_MAX) {
                prey.x = X_MAX;
            }
            if (prey.y < Y_MIN) {
                prey.y = Y_MIN;
            } else if (prey.y > Y_MAX) {
                prey.y = Y_MAX;
            }
        }
    }
}

function movePredator() {
    for (var i = 0; i < predGroup.length; i++) {
        var pred = predGroup.getAt(i);
        if (pred) {
			if (pred.alive) {
				var dx = game.rnd.integerInRange(-PRED_RANGE, PRED_RANGE);
				var dy = game.rnd.integerInRange(-PRED_RANGE, PRED_RANGE);
				pred.x += dx;
				pred.y += dy;
				if (pred.x < X_MIN) {
					pred.x = X_MIN;
				} else if (pred.x > X_MAX) {
					pred.x = X_MAX;
				}
				if (pred.y < Y_MIN) {
					pred.y = Y_MIN;
				} else if (pred.y > Y_MAX) {
					pred.y = Y_MAX;
				}
            }
        }
    }
}

function huntingTime() {
	var predator;
	var prey;
    for (var i = 0; i < predGroup.length; i++) {
        predator = predGroup.getAt(i);
        if (predator.alive) {
            for (var j = 0; j < preyGroup.length; j++) {
                prey = preyGroup.getAt(j);
				if (prey) {
					if (prey.alive) {
						if (checkOverlap(predator,prey)) {
							if (prey.eaten) {
								// don't eat it again
							} else if (predator.consumed < PRED_MAX_EAT) {
								predator.consumed++;
								prey.eaten = true;
								countConsumed++;
							}
                        }
                    }
                }
            }
        }
    }
}


// copied from Phaser example http://phaser.io/examples/v2/sprites/overlap-without-physics
function checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();

    return Phaser.Rectangle.intersects(boundsA, boundsB);
}

function cleanUp() {
	var predator;
    for (var i = 0; i < predGroup.length; i++) {
        predator = predGroup.getAt(i);
		if (predator) {
			if (predator.alive) {
				if (predator.starved) {
					predator.kill();
				} else if (!predator.adult) {
					predator.adult = true;
					predator.scale.setTo(1,1);
				}
            }
        }
    }
	var prey;
    for (i = 0; i < preyGroup.length; i++) {
        prey = preyGroup.getAt(i);
		if (prey) {
			if (prey.alive) {
				if (prey.eaten) {
					prey.kill();
				}
            }
        }
    }
}

function resetSim() {
	var prey;
    for (var i = 0; i < preyGroup.length; i++) {
		prey = preyGroup.getAt(i);
		if (prey) {
			prey.kill();
		}
    }
	var pred;
    for (i = 0; i < predGroup.length; i++) {
        pred = predGroup.getAt(i);
		if (pred) {
			pred.kill();
		}
    }
	updateAssumptions();
	generationLable.text = generationLableText + 0;
    preyLivingLable.text = preyLivingLableText + STARTING_PREY;
    preyConsumedLable.text = consumedLableText + 0;
    predLivingLable.text = predLivingLableText + STARTING_PRED;
    predBabiesLable.text = predBabiesLableText + 0;
    predStarvedLable.text = starvedLableText + 0;
    startSim();
}

function updateAssumptions() {
	// predators 
	STARTING_PRED = parseInt(document.getElementById("predStarting").value);
	PRED_MIN_EAT = parseInt(document.getElementById("predMinEat").value);
	PRED_MAX_EAT = parseInt(document.getElementById("predMaxEat").value);
	PRED_REPRO_PREY = parseInt(document.getElementById("predBabyRate").value);
	PRED_REPRO_MAX = parseInt(PRED_MAX_EAT / PRED_REPRO_PREY);
	// prey
	STARTING_PREY = parseInt(document.getElementById("preyStarting").value);
	PREY_GROWTH_RATE = parseFloat(document.getElementById("preyGrowthRate").value);
	PREY_SURVIVAL_RATE = parseFloat(document.getElementById("preyStarveRate").value);
}