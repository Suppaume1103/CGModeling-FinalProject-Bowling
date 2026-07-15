// 24FI014 稲村海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private light!: THREE.Light;
    private cloud1!: THREE.Points;
    private cloud2!: THREE.Points;
    private particleVelocity1!: THREE.Vector3[];
    private particleVelocity2!: THREE.Vector3[];

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

        const textureLoader = new THREE.TextureLoader();
        const texture1 = textureLoader.load("./src/app-ex09-ouyou-1.png");
        const texture2 = textureLoader.load("./src/app-ex09-ouyou-2.png");

        // パーティクルグループを生成する共通関数
        const createParticleGroup = (texture: THREE.Texture, particleNum: number): [THREE.Points, THREE.Vector3[]] => {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.PointsMaterial({ size: 1, map: texture, blending: THREE.NoBlending, color: 0xffffff, depthWrite: false, transparent: true });
            const velocities: THREE.Vector3[] = [];
            const positions = new Float32Array(particleNum * 3);
            let idx = 0;
            for (let i = 0; i < particleNum; i++) {
                positions[idx++] = 10 * Math.random() - 5;
                positions[idx++] = 10 * Math.random() - 5;
                positions[idx++] = 10 * Math.random() - 5;
                velocities.push(new THREE.Vector3(0, -Math.random() * 100, 0));
            }
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const cloud = new THREE.Points(geometry, material);
            return [cloud, velocities];
        };

        // テクスチャ1のグループ（50個）
        [this.cloud1, this.particleVelocity1] = createParticleGroup(texture1, 50);
        this.scene.add(this.cloud1);

        // テクスチャ2のグループ（50個）
        [this.cloud2, this.particleVelocity2] = createParticleGroup(texture2, 50);
        this.scene.add(this.cloud2);

        // ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const timer = new THREE.Timer();

        const updateCloud = (cloud: THREE.Points, velocities: THREE.Vector3[], delta: number) => {
            const positions = cloud.geometry.getAttribute('position');
            for (let i = 0; i < positions.count; i++) {
                positions.setY(i, positions.getY(i) + velocities[i].y * delta);
                // 下限を超えたら上部にリセット
                if (positions.getY(i) < -5) {
                    positions.setX(i, 10 * Math.random() - 5);
                    positions.setY(i, 5);
                    positions.setZ(i, 10 * Math.random() - 5);
                }
            }
            positions.needsUpdate = true;
        };

        const update: FrameRequestCallback = (_time) => {
            timer.update();
            const delta = timer.getDelta();
            updateCloud(this.cloud1, this.particleVelocity1, delta);
            updateCloud(this.cloud2, this.particleVelocity2, delta);
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
