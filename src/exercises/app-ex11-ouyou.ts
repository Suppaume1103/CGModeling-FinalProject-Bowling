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
            const points = new THREE.Points(geom, material);
            // 形状が変わっても消えないようフラスタムカリングを無効化
            points.frustumCulled = false;
            return points;
        }

        // 全形状共通のパーティクル総数
        const PARTICLE_COUNT = 1000;

        // ジオメトリのposition属性から座標配列を取り出す
        const extractPositions = (source: THREE.BufferGeometry): Float32Array => {
            const src = source.getAttribute('position').array as Float32Array;
            const vertexCount = src.length / 3;
            const positions = new Float32Array(PARTICLE_COUNT * 3);
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const srcIndex = i % vertexCount;
                positions[i * 3] = src[srcIndex * 3];
                positions[i * 3 + 1] = src[srcIndex * 3 + 1];
                positions[i * 3 + 2] = src[srcIndex * 3 + 2];
            }
            return positions;
        }

        const boxPositions = extractPositions(new THREE.BoxGeometry(20, 20, 20, 10, 10, 10));
        const spherePositions = extractPositions(new THREE.SphereGeometry(15, 32, 16));
        const torusPositions = extractPositions(new THREE.TorusGeometry(10, 3, 16, 32));

        // モーフィングさせる形状のリスト(3種類以上を巡回)
        const shapes = [boxPositions, spherePositions, torusPositions];

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(shapes[0].slice(), 3));

        this.cloud = createPoints(geom);
        this.scene.add(this.cloud);

        // 次の形状へのモーフィング処理
        const morphTo = (nextIndex: number) => {
            const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
            const from = Float32Array.from(posAttr.array as Float32Array);
            const to = shapes[nextIndex];
            const proxy = { t: 0 };
            new TWEEN.Tween(proxy, group)
                .to({ t: 1 }, 1000) // モーフィング所要時間
                .delay(1000) // 形状保持時間
                .easing(TWEEN.Easing.Elastic.InOut)
                .onUpdate(() => {
                    const arr = posAttr.array as Float32Array;
                    for (let i = 0; i < arr.length; i++) {
                        arr[i] = from[i] + (to[i] - from[i]) * proxy.t;
                    }
                    posAttr.needsUpdate = true;
                })
                .onComplete(() => morphTo((nextIndex + 1) % shapes.length))
                .start();
        }

        morphTo(1);


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

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 30));
    document.body.appendChild(viewport);
}
