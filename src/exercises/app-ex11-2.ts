// 24FI014 稲村 海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as TWEEN from "@tweenjs/tween.js";

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

        // Tweenをまとめて管理するグループ
        const group = new TWEEN.Group();

        const generateSprite = () => {
            //新しいキャンバスの作成
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;

            //円形のグラデーションの作成
            const context = canvas.getContext('2d')!;
            const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.2, 'rgba(255,0,0,1)');
            gradient.addColorStop(0.4, 'rgba(64, 0,0,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,1)');

            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            //テクスチャの生成
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        const createParticles = () => {
            // ジオメトリ
            const geometry = new THREE.BufferGeometry();

            const material = new THREE.PointsMaterial({ size: 1, map: generateSprite(), blending: THREE.AdditiveBlending, color: 0xffffff, depthWrite: false, transparent: true, opacity: 0.6 });

            const particleNum = 3000;
            const positions = new Float32Array(particleNum * 3);

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            this.cloud = new THREE.Points(geometry, material);
            this.scene.add(this.cloud);

            const sphereRadius = 10;

            for (let i = 0; i < particleNum; ++i) {
                // tweeninfoの作成
                const tweeninfo = { x: 0, y: 0, z: 0, index: i };

                // Tweenでパラメータの更新の際に呼び出される関数の作成
                const onUpdateParticle = (obj: typeof tweeninfo) => {
                    const positions = (this.cloud.geometry as THREE.BufferGeometry).getAttribute('position');
                    positions.setX(obj.index, obj.x);
                    positions.setY(obj.index, obj.y);
                    positions.setZ(obj.index, obj.z);
                    positions.needsUpdate = true;
                }

                // 球面上の座標値の作成(遷移先の作成)
                // 球のパラメータ表現 (r, theta, phi) からxyzを求める
                const theta = Math.random() * Math.PI * 2;       // 経度方向
                const phi = Math.acos(2 * Math.random() - 1);    // 緯度方向(一様分布)
                const target = {
                    x: sphereRadius * Math.sin(phi) * Math.cos(theta),
                    y: sphereRadius * Math.sin(phi) * Math.sin(theta),
                    z: sphereRadius * Math.cos(phi),
                };

                // 遷移時間
                const duration = 1500;

                // Tweenの作成(球面上への遷移と、原点への遷移を作る)
                // 中心(原点)に集まった後、1秒間そこに留まってから再び広がる
                const tweenToSurface = new TWEEN.Tween(tweeninfo, group)
                    .delay(500)
                    .to({ x: target.x, y: target.y, z: target.z }, duration)
                    .easing(TWEEN.Easing.Elastic.Out)
                    .onUpdate(onUpdateParticle);

                const tweenToOrigin = new TWEEN.Tween(tweeninfo, group)
                    .delay(500)
                    .to({ x: 0, y: 0, z: 0 }, duration)
                    .easing(TWEEN.Easing.Elastic.In)
                    .onUpdate(onUpdateParticle);

                // アニメーションのループの作成
                tweenToSurface.chain(tweenToOrigin);
                tweenToOrigin.chain(tweenToSurface);

                // アニメーションの実行
                tweenToSurface.start();
            }
        }

        createParticles();

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const timer = new THREE.Timer();
        const update: FrameRequestCallback = (time) => {
            const delta = timer.getDelta();
            this.cloud.rotation.x += 0.5 * delta;
            this.cloud.rotation.y += 0.2 * delta;
            group.update(time);
            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 20));
    document.body.appendChild(viewport);
}
