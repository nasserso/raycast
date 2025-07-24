const HERTZ = 1000/20;
const PLAYER_SPEED = 5;
const PLAYER_ANGLE_SPEED = 0.1;

class Player {
    constructor() {
        this.x = 300;
        this.y = 300;
        this.angle = 3 * Math.PI / 2;
        this.delta_x = Math.cos(this.angle) * PLAYER_SPEED;
        this.delta_y = Math.sin(this.angle) * PLAYER_SPEED;
        this.width = 10;
        this.height = 10;
    }

    isLookingVertical(angle_variation) {
        return (
            this.angle - angle_variation >= Math.PI * 5/4 && this.angle - angle_variation <= 7*Math.PI/4 ||
            this.angle - angle_variation >= Math.PI /4 && this.angle - angle_variation <= 3*Math.PI/4
        );
    }

    drawRayCast2D(level_map) {
        const NUM_OF_RAYS = 1;
        const ERROR = 10;

        // TODO acertar smp o outro lado com rounding
        // verificar de onde vem e arredondar pra baixo ou cima :)

        let ans = [];


        for (let ray = 0; ray < NUM_OF_RAYS; ray++) {
            const dista = 75;
            const angle_variation = 0;
            
            if (this.isLookingVertical(angle_variation)) {
                // horizontal
                let inverse_tan = -1 / Math.tan(this.angle);

                // pegar os horizontais
                for (let i = 1; i < 8; i++) {
                    if (this.angle >= 3*Math.PI/4 && this.angle <= Math.PI*7/4) {
                        const error = Math.floor(this.y / 75)*75 - this.x;

                        ans.push([
                            this.x + inverse_tan * (this.y + dista * i - this.y + error),
                            Math.floor(this.y / 75)*75 - dista*i,
                            // (Math.floor(this.y-dista*i)/75)*75
                        ]);
                    } else {
                        ans.push([
                            this.x - inverse_tan * (this.y + dista * i - this.y) - ERROR,
                            (Math.floor(this.y+dista*i)/75)*75
                        ]);
                    }

                }


            } else {
                // vertical
                let negative_tan = Math.tan(this.angle);

                for (let i = 1; i < 8; i++) {
                    if (this.angle <= Math.PI/2 || this.angle >= 3*Math.PI/2) {
                        ans.push([
                            this.x + dista * i,
                            this.y + negative_tan * (this.x + dista * i - this.x)
                        ]);
                    } else {
                        ans.push([
                            this.x - dista * i,
                            this.y + negative_tan * (this.x - dista * i - this.x)-ERROR
                        ]);
                    }
                }
            }
        }
        return ans
    }

    move_up() {
        this.x += this.delta_x;
        this.y += this.delta_y;
    }
    move_down() {
        this.x -= this.delta_x;
        this.y -= this.delta_y;
    }
    move_left() {
        this.angle -= PLAYER_ANGLE_SPEED;
        if (this.angle < 0) {
            this.angle += 2 * Math.PI;
        }
        this.delta_x = Math.cos(this.angle) * PLAYER_SPEED;
        this.delta_y = Math.sin(this.angle) * PLAYER_SPEED;
    }
    move_right() {
        this.angle += PLAYER_ANGLE_SPEED;
        if (this.angle > 2 * Math.PI) {
            this.angle -= 2 * Math.PI;
        }
        this.delta_x = Math.cos(this.angle) * PLAYER_SPEED;
        this.delta_y = Math.sin(this.angle) * PLAYER_SPEED;// 
    }

    update(context, s) {
        context.translate(this.x, this.y);
        context.rotate(this.angle);
        context.fillStyle = "red";
        context.fillRect(0, 0, this.width, this.height);

        const look_height = 1200;
        const look_width = 3;
        context.fillRect(2.5, (this.width - look_width)/2, look_height, look_width);

        context.setTransform(1, 0, 0, 1, 0, 0);

        context.fillStyle = "green";
        for (let b of s) {
            context.fillRect(b[0], b[1], 10, 10);
        }
    }
}

class RayCast {
    level_map = [
        [1,1,1,1,1,1,1,1],
        [1,0,1,0,0,0,0,1],
        [1,0,1,0,0,0,0,1],
        [1,0,1,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1],
    ]

    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 1200;
        this.canvas.height = 600;
        this.ratioX = this.canvas.width / this.level_map.length / 2;
        this.ratioY = this.canvas.height / this.level_map[0].length;
        this.key = null;
        this.player = new Player();

        this.context = this.canvas.getContext("2d");

        this.canvas.style.border = "1px solid";
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(this.updateScreen.bind(this), HERTZ);

        window.addEventListener('keydown', function (e) {
            this.key = e.key;
        }.bind(this))
        window.addEventListener('keyup', function (e) {
            this.key = null;
        }.bind(this))
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    draw2dScene = () => {
        for (let i = 0; i < this.level_map.length; i++) {
            for (let j = 0; j < this.level_map[i].length; j++) {
                if (this.level_map[j][i] === 1) {
                    this.context.fillStyle = "white";
                } else {
                    this.context.fillStyle = "black";
                }
                this.context.strokeStyle = 'blue';
                this.context.strokeRect(
                    i * this.ratioX,
                    j * this.ratioY,
                    this.ratioX,
                    this.ratioY
                );
                this.context.border = "1px solid gray"
                this.context.fillRect(
                    i * this.ratioX,
                    j * this.ratioY,
                    this.ratioX,
                    this.ratioY
                );
            }
        }
    }

    updateScreen() {
        this.clear();

        this.draw2dScene();

        if (this.key) {
            if (this.key === "w") {
                this.player.move_up();
            }
            if (this.key === "a") {
                this.player.move_left();
            }
            if (this.key === "d") {
                this.player.move_right();
            }
            if (this.key == "s") {
                this.player.move_down();
            }
        }
        const s = this.player.drawRayCast2D(this.level_map);
        // this.drawRayCast2D(this.player);
        this.player.update(this.context, s);
    }
}

const p = new RayCast();