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

    update(context) {
        context.translate(this.x, this.y);
        context.rotate(this.angle);
        context.fillStyle = "red";
        context.fillRect(0, 0, this.width, this.height);

        const look_height = 1200;
        const look_width = 3;
        // context.fillRect(2.5, (this.width - look_width)/2, look_height, look_width);

        context.setTransform(1, 0, 0, 1, 0, 0);
    }
}

class RayCast {
    level_map = [
        [1,1,1,1,1,1,1,1],
        [1,0,1,0,0,1,0,1],
        [1,0,1,0,0,0,0,1],
        [1,0,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,1],
        [1,0,1,0,0,1,0,1],
        [1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1],
    ];

    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 1200;
        this.canvas.height = 600;
        this.ratioX = this.canvas.width / this.level_map.length / 2;
        this.ratioY = this.canvas.height / this.level_map[0].length;
        this.keys = [];
        this.player = new Player();

        this.context = this.canvas.getContext("2d");

        this.canvas.style.border = "1px solid";
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(this.updateScreen.bind(this), HERTZ);

        window.addEventListener('keydown', function (e) {
            if (this.keys.indexOf(e.key) === -1) {
                this.keys.push(e.key);
            }
        }.bind(this))
        window.addEventListener('keyup', function (e) {
            this.keys = this.keys.filter((key) => key !== e.key);
        }.bind(this))
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    draw2dScene = () => {
        const drawSquare = (i, j) => {
            // draw square border
            this.context.strokeStyle = 'blue';
            this.context.strokeRect(
                i * this.ratioX,
                j * this.ratioY,
                this.ratioX,
                this.ratioY
            );

            // draw square
            if (this.level_map[j][i] === 1) {
                this.context.fillStyle = "white";
            } else {
                this.context.fillStyle = "black";
            }
            this.context.fillRect(
                i * this.ratioX,
                j * this.ratioY,
                this.ratioX,
                this.ratioY
            );
        };

        for (let i = 0; i < this.level_map.length; i++) {
            for (let j = 0; j < this.level_map[i].length; j++) {
                drawSquare(i,j)
            }
        }
    }

    draw3dScene = (points) => {
        const DELTA_MOVE = this.canvas.width / 2;
        this.context.strokeStyle = 'blue';
        const HEIGHT_OFFSET = 160;

        for (let i = 0; i < 60; i++) {
            let distance = this.pointDistance([this.player.x, this.player.y], points[i]);
            
            const distance_player_ray_angle = this.player.angle - points[i][2];

            distance = distance * Math.cos(distance_player_ray_angle);

            let line_height = (this.ratioX * this.canvas.height) / distance
            if (line_height > this.canvas.height) {
                line_height = this.canvas.height;
            }

            const lineOffset = HEIGHT_OFFSET - line_height / 2;

            if (points[i][3] === 1) {
                this.context.fillStyle = "#008817ff";
            } else {
                this.context.fillStyle = "#00ff2a";
            }

            this.context.fillRect(
                (i*10) + DELTA_MOVE,
                lineOffset,
                5,
                line_height,
            );
        }
    }

    updateScreen() {
        this.clear();

        this.draw2dScene();

        if (this.keys) {
            if (this.keys.includes("w")) {
                this.player.move_up();
            }
            if (this.keys.includes("a")) {
                this.player.move_left();
            }
            if (this.keys.includes("d")) {
                this.player.move_right();
            }
            if (this.keys.includes("s")) {
                this.player.move_down();
            }
        }
        const points = this.drawRayCast2D(this.player);
        this.player.update(this.context);

        this.context.fillStyle = "green";
        for (let b of points) {
            this.context.beginPath(); // Start a new path
            this.context.moveTo(this.player.x, this.player.y); // Move the pen to (30, 50)
            this.context.lineTo(b[0], b[1]); // Draw a line to (150, 100)
            this.context.stroke(); // Render the path
        }

        this.draw3dScene(points);
    }

    pointDistance(p1, p2) {
        return  Math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2);
    }

    drawRayCast2D(from_object) {
        const NUM_OF_RAYS = 60;
        const ERROR = 10;
        const ONE_DEGREE = Math.PI / 180;

        let points = [];
        let final_points = [];

        const start_angle = from_object.angle - (ONE_DEGREE * 30);

        for (let ray = 0; ray < NUM_OF_RAYS; ray++) {
            const angle = start_angle + (ray * ONE_DEGREE);
            let inverse_tan = 1 / Math.tan(angle);
            let negative_tan = Math.tan(angle);

            for (let i = 1; i < 8; i++) {
                const y_floor = Math.floor(from_object.y / this.ratioX) * this.ratioX;
                const square_delta_y = from_object.y - y_floor;
                const delta_y = -square_delta_y * inverse_tan;

                // horizontal dots
                if (angle >= Math.PI) { // up
                    const x = delta_y + from_object.x - inverse_tan * this.ratioX * (i-1);
                    const y = (Math.floor(from_object.y / this.ratioX)*this.ratioX) - this.ratioX * (i-1);

                    const map_x = Math.floor(x / this.ratioX);
                    const map_y = Math.floor(y / this.ratioX)-1;

                    if (map_x >= 0 && map_y >= 0 && map_x < 8 && map_y < 8) {
                        if (this.level_map[map_y][map_x] === 1) {
                            points.push([x,y,angle,0]);
                        }
                    }
                } else { // down
                    const x = delta_y + from_object.x + inverse_tan * this.ratioX * i - ERROR;
                    const y = Math.floor(from_object.y / this.ratioX)*this.ratioX + this.ratioX * i;

                    const map_x = Math.floor(x / this.ratioX);
                    const map_y = Math.floor(y / this.ratioX);

                    if (map_x >= 0 && map_y >= 0 && map_x < 8 && map_y < 8) {
                        if (this.level_map[map_y][map_x] === 1) {
                            points.push([x,y,angle,0])
                        }
                    }
                }

                const x_floor = Math.floor(from_object.x / this.ratioX) * this.ratioX;
                const square_delta_x = from_object.x - x_floor;
                const delta_x = -square_delta_x * negative_tan;

                // vertical dots
                if (angle >= 3*Math.PI/2 || angle <= Math.PI/2) { // left
                    const x = Math.floor(from_object.x / this.ratioX)*this.ratioX + this.ratioX * i;
                    const y = delta_x + from_object.y + negative_tan * this.ratioX * i;

                    const map_x = Math.floor(x / this.ratioX);
                    const map_y = Math.floor(y / this.ratioX);

                    if (map_x >= 0 && map_y >= 0 && map_x < 8 && map_y < 8) {
                        if (this.level_map[map_y][map_x] === 1) {
                            points.push([x,y,angle,1])
                        }
                    }
                } else { // right
                    const x = ((Math.floor(from_object.x / this.ratioX)*this.ratioX) + this.ratioX) - this.ratioX * i;
                    const y = delta_x + from_object.y - negative_tan * this.ratioX * (i-1) - ERROR;

                    const map_x = Math.floor(x / this.ratioX)-1;
                    const map_y = Math.floor(y / this.ratioX);

                    if (map_x >= 0 && map_y >= 0 && map_x < 8 && map_y < 8) {
                        if (this.level_map[map_y][map_x] === 1) {
                            points.push([x,y,angle,1])
                        }
                    }
                }
            }

            let closest = points.length > 0 ? points[0] : [0,0];
            let min_distance = 1000000;

            for (const point of points) {
                if (this.pointDistance([from_object.x, from_object.y], point) < min_distance) {
                    min_distance = this.pointDistance([from_object.x, from_object.y], point);
                    closest = point;
                }
            }

            final_points.push(closest)
            points = [];
        }

        return final_points
    }
}

const p = new RayCast();