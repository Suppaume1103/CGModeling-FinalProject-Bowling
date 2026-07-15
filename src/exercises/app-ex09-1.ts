// 24FI014 稲村海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private light!: THREE.Light;
    private cloud!: THREE.Points;
    private particleVelocity!: THREE.Vector3[];

    constructor() {

    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x495ed));
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

        const createParticles = () => {
            // ジオメトリ
            const geometry = new THREE.BufferGeometry();
            // マテリアル
            const textureLorder = new THREE.TextureLoader();
            const texture = textureLorder.load("./src/raindrop.png");

            const material = new THREE.PointsMaterial({ size: 1, map: texture, blending: THREE.AdditiveBlending, color: 0xffffff, depthWrite: false, transparent: true, opacity: 0.5 });
            // particle
            this.particleVelocity = [];
            const particleNum = 10000;
            const positions = new Float32Array(particleNum * 3);
            let particleIndex = 0;
            for (let i = 0; i < particleNum; i++) {
                positions[particleIndex++] = 10 * Math.random() - 5;
                positions[particleIndex++] = 10 * Math.random() - 5;
                positions[particleIndex++] = 10 * Math.random() - 5;
                this.particleVelocity.push(new THREE.Vector3(0, - Math.random() * 100, 0));
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            // THREE.Points
            this.cloud = new THREE.Points(geometry, material);
            // シーンへ追加
            this.scene.add(this.cloud);
        }

        createParticles();

        // ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const timer = new THREE.Timer();
        const update: FrameRequestCallback = (_time) => {
            timer.update(); //タイマーの更新
            const delta = timer.getDelta();
            const geom = this.cloud.geometry as THREE.BufferGeometry;
            const positions = geom.getAttribute('position'); // 座標データ

            for (let i = 0; i < positions.count; i++) {
                positions.setY(i, positions.getY(i) + this.particleVelocity[i].y * delta);

                // 下限を超えたら上部にリセット
                if (positions.getY(i) < -5) {
                    positions.setX(i, 10 * Math.random() - 5);
                    positions.setY(i, 5);
                    positions.setZ(i, 10 * Math.random() - 5);
                }
            }
            positions.needsUpdate = true;
            requestAnimationFrame(update);
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
