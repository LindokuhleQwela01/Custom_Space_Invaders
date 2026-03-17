    // Get the webgl context
    const canvas = document.querySelector(`canvas`);
    const gl = canvas.getContext(`webgl`);

    //const texture = assignImageToObject(enemyImageSrc);
    //gl.bindTexture(gl.TEXTURE_2D, texture);
    // Vertex Shader
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 texture;
        varying vec2 textureImage;
        uniform mat4 u_translation;
        void main() {
            gl_Position = u_translation * vec4(a_position, 0, 1);
            textureImage = texture;
        }
    `;

    // Fragment Shader
    const fragmentShaderSource = `
    precision mediump float;
    varying vec2 textureImage;
    uniform sampler2D uSampler;
        void main() {
            gl_FragColor = texture2D(uSampler, textureImage);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    
    // Image attributes which store the image's locations
    let playerTexture, enemyTexture, blast, playerBlast;
    playerTexture = initTexture("../Images/player_spaceship.png");
    enemyTexture = initTexture("../Images/enemy_ship.jpg");
    blast = initTexture("../Images/blast.jpg");
    playerBlast = initTexture("../Images/playerBlast.jpg");

    

    // Originally the image is inverted as it is assigned to a shape or object
    // This 1 line allows us to flip the image over correcting its orientation
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Player Ship and bullet size
    const playerVertices = new Float32Array([
        -0.05, -0.05,  
        -0.05, 0.05,  
        0.05,  0.05,
        0.05, -0.05,

        0.00, 0.03,
        0.00, -0.05,
        0.008, -0.05,
        0.008, 0.03
        
    ]);

    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, playerVertices, gl.STATIC_DRAW);

    // Texture buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    const texCoords = new Float32Array([0.0,0.0,  0.0,1.0,   1.0,1.0,  1.0,0.0]);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const translationUniformLocation = gl.getUniformLocation(program, `u_translation`);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positionAttributeLocation = gl.getAttribLocation(program, `a_position`);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    const textureLocation = gl.getAttribLocation(program, `texture`);
    gl.enableVertexAttribArray(textureLocation);
    gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, false, 0, 0);


    // Function that will allow me to add an image on an object drawn on the canvas.
    function initTexture(imageSrc) {
        const texture = gl.createTexture();
        const image = new Image();
    
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
    
        image.src = imageSrc;
        return texture;
    }
    
    let nextLevel, gameOver, playerX = 0, speed, lives = 3, intensity = 0, numberOfEnemies = 0;
    let bullets = [], fire = [], enemyPos = [];
    let newLoc = "../index.html";
    let motion = 0.02;
    let left = 0.0, right = 0.0, sound;
    let mode, gamePlay = true;
        
    // I created 4 levels with each having their own level of intensity.
    // I didn't want to make the game difficult, but rather challenging, simple and easy to win.
    let level = 1;
    let levels = {
        
        1: {
            init: () => {
                intensity = 0.007
                speed = 0.013
                for (let i = -0.8; i < 0.8; i += 0.2) {
                    for (let j = 0.6; j > 0.2; j -= 0.2) {
                        enemyPos.push({ x: i, y: j });
                    }
                }
                
            }
        },

        2: {
            init: () => {
                
                intensity = 0.01
                speed = 0.017
                for (let i = -0.8; i < 0.8; i += 0.2) {
                    for (let j = 0.6; j > 0.2; j -= 0.2) {
                        enemyPos.push({ x: i, y: j });
                    }
                }
            }
        },

        3: {
            init: () => {
                
                intensity = 0.013
                speed = 0.02
                for (let i = -0.8; i < 0.8; i += 0.2) {
                    for (let j = 0.6; j > 0.2; j -= 0.2) {
                        enemyPos.push({ x: i, y: j });
                    }
                }
            }
        },

        4: {
            init: () => {
                
                intensity = 0.017
                speed = 0.023
                for (let i = -0.8; i < 0.8; i += 0.2) {
                    for (let j = 0.6; j > 0.2; j -= 0.2) {
                        enemyPos.push({ x: i, y: j });
                    }
                }
            }
        },

        5: {
            init: () => {
                alert("You WIN!!");
                window.location.replace(newLoc);
            }
        }

    }


    function loadSound(){
        sound = new Audio('../Sounds/blaster.wav');
        sound.play();
        soundOn = false;
    }

    function drawBullets() {
        bullets.forEach((bullet, index) => {
            bullet.y += 0.04;
            soundOn = true;
            bullet = identity(bullet.x, bullet.y);
            
            drawBull(bullet, playerBlast);

            if(bullet.y > 1) {
                bullets.splice(index, 1);
            }
        });
    }

    function enemyBullet(enemy){
        const attack = {
            x: enemy[12],
            y: enemy[13]
        };
        fire.push({x: attack.x, y: attack.y});
    }

    function enemyFire(){
        fire.forEach((shot, index) => {
            shot.y -= speed;
            shot = identity(shot.x, shot.y);
            drawBull(shot, blast);
            
        });
    }

    function drawEnemies() {
        enemyPos.forEach((enemy, index) => {
            enemy.x += motion;
            
            if(enemy.x > 1.4){
                changeDir();
            }
            if(enemy.x < -1.4){
                changeDir();
            }
            enemy = identity(enemy.x, enemy.y);
            drawEveryone(enemy, enemyTexture);
            
            
            if(Math.random() < intensity){
                enemyBullet(enemy);
                loadSound();
            }
        });
    }

    function checkCollisions() {
        bullets.forEach((bullet, bIndex) => {
            enemyPos.forEach((enemy, eIndex) => {
                if (Math.abs(bullet.x - enemy.x) < 0.05 && Math.abs(bullet.y - enemy.y) < 0.05) {
                    enemyPos.splice(eIndex, 1);
                    console.log("enemies: " + numberOfEnemies);
                    bullets.splice(bIndex, 1);
                    sound = new Audio('../Sounds/explosion.wav');
                    sound.play();
                    numberOfEnemies++;
                }
            });
        });

        // Checks if the number of enemies hit is equal to 16, if thats the case, move to the next level.
        if(numberOfEnemies == 16){
            level++;
            numberOfEnemies = 0;
            
            nextLevel = setTimeout(() => {
                levels[level].init();
            }, 2000);
    }
        // Condition for if you get hit by enemy fire
        fire.forEach((flame, aIndex) => {
            if(Math.abs(flame.x - mode[12]) < 0.05 && Math.abs(flame.y - mode[13]) < 0.05){
                fire.splice(aIndex, 1);
                // Pac-man sound for dramatic affect, signifying that you've been hit by the enemy.
                // Wanted to make this as enjoyable as possible by not only stimulating the player visual, but also decided to use sounds.
                sound = new Audio('../Sounds/Pac-ManDeathSound.mp3');
                sound.play();

                // Do whatever is inside the setTimeout function after the specified time in milliseconds.
                nextLevel = setTimeout(() => {
                    alert("GAME OVER"),
                    window.location.replace(newLoc);
                }, 50 /* time in milliseconds */);
                
                // Remove the entire array of enemies once the player is hit by enemy fire.
                enemyPos.forEach((enemy, eIndex) => {
                    enemyPos.splice(eIndex, 16);
                }
        )}
        });

    }

    // With xCo being the matrix for positioning the player or enemy, texture is the skin or image for the player and/or enemy.
    function drawEveryone(xCo, texture){
        gl.useProgram(program);
        gl.uniformMatrix4fv(translationUniformLocation, false, xCo);

        

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    
        const textureUniformLocation = gl.getUniformLocation(program, "u_texture");
        gl.uniform1i(textureUniformLocation, 0);
    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }


    function drawBull(xCo, texture){
        gl.useProgram(program);
        gl.uniformMatrix4fv(translationUniformLocation, false, xCo);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    
        const textureUniformLocation = gl.getUniformLocation(program, "u_texture");
        gl.uniform1i(textureUniformLocation, 0);

        gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
    }
    
    // Main function that calls all the necessary functions to make the magic that is operating, running and animating this program.
    function update() {
        gl.useProgram(program);
        
        if(gamePlay == true){
            if(Math.random() , 0.002){
            enemyFire();
            }
        
            mode = identity(playerX, -0.8);
            console.log("level: " + level);
            drawEveryone(mode, playerTexture);
            drawBullets();
            drawEnemies();
            checkCollisions();
        };

        if(gamePlay == false){
            alert("Restarting...");
            level = 1;
            gamePlay = true;
            location.reload();
        }
        requestAnimationFrame(update);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" && playerX > -0.9){
            playerX -= 0.05;
        }
        if (event.key === "ArrowRight" && playerX < 0.9) playerX += 0.05;
        
        if (event.key === " "){
            bullets.push({ x: playerX, y: -0.75 });
            loadSound();
        }
    });

    // It started as an identity matrix/array, then transitioned into a translation matrix/array.
    // The function identifies as "identity", but translates objects on the canvas.
    function identity(Tx, Ty){
        return new Float32Array([1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        Tx, Ty, 0.0, 1.0]);
    }

    function changeDir(){
        motion *= -1;
    }

    
    levels[level].init();
    update();