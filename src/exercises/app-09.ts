import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private light!: THREE.Light;
    private cloud!: THREE.Points;

    constructor() {

    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.shadowMap.enabled = true; //シャドウマップを有効にする

        //カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const orbitControls = new OrbitControls(camera, renderer.domElement);

        this.createScene();
        // 毎フレームのupdateを呼んで，render
        // reqestAnimationFrame により次フレームを呼ぶ
        const render: FrameRequestCallback = (_time) => {
            orbitControls.update();

            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    }

    // シーンの作成(全体で1回)
    private createScene = () => {
        this.scene = new THREE.Scene();

        const generateSprite = () => {
            //新しいキャンバスの作成
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;

            //円形のグラデーションの作成
            const context = canvas.getContext('2d')!;
            const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.2, 'rgba(0,0,255,1)');
            gradient.addColorStop(0.4, 'rgba(0, 0,64,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,1)');

            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            //テクスチャの生成
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        const createPoints = (geom: THREE.BufferGeometry) => {
            geom.deleteAttribute('uv');
            const material = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.5,
                map: generateSprite(),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            return new THREE.Points(geom, material);
        }

        this.cloud = createPoints(new THREE.TorusGeometry(1, 0.4, 6, 6));
        this.scene.add(this.cloud);

        // const createParticles = () => {
        //     // ジオメトリ
        //     const geometry = new THREE.BufferGeometry();
        //     // マテリアル
        //     const textureLorder = new THREE.TextureLoader();
        //     const texture = textureLorder.load("./src/raindrop.png");

        //     const material = new THREE.PointsMaterial({ size: 1, map: texture, blending: THREE.AdditiveBlending, color: 0xffffff, depthWrite: false, transparent: true, opacity: 0.5 });
        //     // particle
        //     this.particleVelocity = [];
        //     const particleNum = 10000;
        //     const positions = new Float32Array(particleNum * 3);
        //     let particleIndex = 0;
        //     for (let i = 0; i < particleNum; i++) {
        //         positions[particleIndex++] = 10 * Math.random() - 5;
        //         positions[particleIndex++] = 10 * Math.random() - 5;
        //         positions[particleIndex++] = 10 * Math.random() - 5;
        //         this.particleVelocity.push(new THREE.Vector3(0, - Math.random() * 0.5 - 0.25, 0));
        //     }
        //     geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        //     // THREE.Points
        //     this.cloud = new THREE.Points(geometry, material);
        //     // シーンへ追加
        //     this.scene.add(this.cloud);
        // }

        // createParticles();

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {
            // this.cloud.rotation.x += 0.01;
            // this.cloud.rotation.y += 0.01;
            // this.cloud.rotation.z += 0.01;
            // const geom = this.cloud.geometry as THREE.BufferGeometry;
            // const positions = geom.getAttribute('position'); // 座標データ

            // for (let i = 0; i < positions.count; i++) {
            //     positions.setY(i, positions.getY(i) + this.particleVelocity[i].y);
            // }
            // positions.needsUpdate = true;
            // timer.update(); //タイマーの更新
            // const deltaTime = timer.getDelta();
            // const speed = 5.0;
            // this.cloud.position.y += speed * deltaTime;
            // requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 10));
    document.body.appendChild(viewport);
}
