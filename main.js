
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(4.61, 2.74, 8)

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
renderer.shadowMap.enabled = true;

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

class Box extends THREE.Mesh {
    constructor({
        width, height, depth, color = '#00ff00', velocity = { x: 0, y: 0, z: 0 }, position = { x: 0, y: 0, z: 0 }, zAcceleration = false
    }) {
        super(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color }))
        this.width = width
        this.height = height
        this.depth = depth

        this.position.set(position.x, position.y, position.z)

        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;
        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.velocity = velocity
        this.gravity = -0.005;

        this.zAcceleration = zAcceleration
    }

    updateSides() {
        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2
    }

    update(ground) {
        this.updateSides();
        if (this.zAcceleration) {
            this.velocity.z += 0.001
        }
        this.position.x += this.velocity.x
        this.position.z += this.velocity.z
        this.applyGravity(ground)

    }

    applyGravity(ground) {
        this.velocity.y += this.gravity
        // this is whrere we hit grouund 
        if (boxCollision({
            box1: this, box2: ground
        })) {
            const friction = 0.5
            this.velocity.y *= friction
            this.velocity.y = -this.velocity.y
        }
        else {
            this.position.y += this.velocity.y
        }
    }
}

function boxCollision({
    box1, box2
}) {
    // detect collision 
    const zCollision = box1.front >= box2.back && box1.back <= box2.front;
    const xCollision = box1.right >= box2.left && box1.left <= box2.right;
    const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;

    return zCollision && xCollision && yCollision

}


const cube = new Box({ width: 1, height: 1, depth: 1, velocity: { x: 0, y: -0.01, z: 0 } })
cube.castShadow = true
scene.add(cube)


const ground = new Box({ width: 8, height: 0.5, depth: 50, color: '#0369a1', position: { x: 0, y: -2, z: 0 } })

ground.receiveShadow = true;
scene.add(ground)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.y = 2
light.position.z = 2
light.castShadow = true
scene.add(light)

scene.add(new THREE.AmbientLight(0xffffff, 0.5))

camera.position.z = 5

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    },
    s: {
        pressed: false
    }
}

window.addEventListener('keydown', (event) => {
    // console.log(event)
    switch (event.code) {
        case 'KeyA':
            keys.a.pressed = true
            break
        case 'KeyD':
            keys.d.pressed = true
            break
        case 'KeyW':
            keys.w.pressed = true
            break
        case 'KeyS':
            keys.s.pressed = true
            break
        case 'Space':
            cube.velocity.y = 0.18         
            break
    }
})

window.addEventListener('keyup', (event) => {
    // console.log(event)
    switch (event.code) {
        case 'KeyA':
            keys.a.pressed = false
            break
        case 'KeyD':
            keys.d.pressed = false
            break
        case 'KeyW':
            keys.w.pressed = false
            break
        case 'KeyS':
            keys.s.pressed = false
            break
    }
})


const enemies = []

let frames = 0;
let spawnRate = 200
function animate() {
    const animationid = requestAnimationFrame(animate)
    renderer.render(scene, camera)
    // movement
    cube.velocity.x = 0
    cube.velocity.z = 0
    if (keys.a.pressed) {
        cube.velocity.x = -0.05
    } else if (keys.d.pressed) {
        cube.velocity.x = 0.05
    }

    if (keys.w.pressed) {
        cube.velocity.z = -0.05
    } else if (keys.s.pressed) {
        cube.velocity.z = 0.05
    }
    cube.update(ground);
    enemies.forEach(enemy => {
        enemy.update(ground)
        if (boxCollision({ box1: cube, box2: enemy })) {
            console.log("game over")
            window.cancelAnimationFrame(animationid);
        }
    })

    if (frames % spawnRate === 0) {

        if (spawnRate > 20) spawnRate -= 20

        const enemyCube = new Box({ width: 1, height: 1, depth: 1, position: { x: (Math.random() - 0.5) * 8, y: 0, z: -20 }, velocity: { x: 0, y: -0.01, z: 0.005 }, color: 'red', zAcceleration: true })
        enemyCube.castShadow = true
        scene.add(enemyCube)
        enemies.push(enemyCube)
    }
    frames++;
}
animate()