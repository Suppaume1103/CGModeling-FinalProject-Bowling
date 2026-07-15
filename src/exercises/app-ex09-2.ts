// 24FI014 稲村海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private light!: THREE.Light;
    private clouds!: THREE.Object3D[];

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

            //白い光のグラデーションを作成
            const context = canvas.getContext('2d')!;
            const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(0.7, 'rgba(128,128,128,0.3)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            //テクスチャの生成
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        const spriteTexture = generateSprite();

        const createPoints = (geom: THREE.BufferGeometry, color: number) => {
            geom.deleteAttribute('uv');
            const material = new THREE.PointsMaterial({
                color: color,
                size: 0.5,
                map: spriteTexture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            return new THREE.Points(geom, material);
        }

        // 異なる色・サイズのトーラスを3つ生成
        const pointConfigs: { geom: THREE.BufferGeometry; color: number }[] = [
            { geom: new THREE.TorusGeometry(5, 0.8, 6, 20), color: 0xff4444 }, // 赤
            { geom: new THREE.TorusGeometry(3, 0.8, 6, 20), color: 0x44ff44 }, // 緑
            { geom: new THREE.TorusGeometry(1, 0.8, 6, 20), color: 0x4488ff }, // 青
        ];
        this.clouds = pointConfigs.map(({ geom, color }) => {
            const points = createPoints(geom, color);
            this.scene.add(points);
            return points;
        });

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        
        const timer = new THREE.Timer();
        const update: FrameRequestCallback = (_time) => {
            timer.update(); //タイマーの更新
            const deltaTime = timer.getDelta();
            const elapsedTime = timer.getElapsed();
            const speed = 1.0;

            // 赤: Y軸を中心にゆっくり公転
            this.clouds[0].rotation.y += speed * deltaTime * 0.5;

            // 緑: X軸回転 + サイン波で上下移動
            this.clouds[1].rotation.x += speed * deltaTime * 0.8;
            this.clouds[1].position.y = Math.sin(speed * elapsedTime * 1.2) * 2;

            // 青: 高速Z軸スピン + スケールが変化
            this.clouds[2].rotation.z += speed * deltaTime * 2.0;
            const pulse = 1 + 0.4 * Math.sin(speed * elapsedTime * 3.0);
            this.clouds[2].scale.set(pulse, pulse, pulse);

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
