// 24FI014 稲村 海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private light!: THREE.Light;
    constructor() {

    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x0000cd)); // 水中のような青色

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

        // 平面の生成
        const addPlane = () => {
            // Geometryの生成
            // 平面は高さを1とした立方体を用いる
            const addObjectGeometry: THREE.BufferGeometry = new THREE.BoxGeometry(12, 1, 12);
            // Materialの生成
            const meshMaterial: THREE.Material = new THREE.MeshLambertMaterial({
                color: new THREE.Color(0xe8d5a3), // サンゴ礁の砂のような色
                side: THREE.DoubleSide
            });
            // オブジェクトの生成
            const addObject: THREE.Mesh = new THREE.Mesh(addObjectGeometry, meshMaterial);
            // オブジェクトのシーンへの追加
            this.scene.add(addObject);
        }

        addPlane();

        // ランダムな図形の生成
        const addRandomObject = () => {
            const randval: number = Math.floor(Math.random() * 3); // 0~3の乱数を発生させる。
            let addGeometry: THREE.BufferGeometry = new THREE.BufferGeometry(); // 3つの図形に共通の変数を作る
            const size: number = Math.random() + 0.1; // サイズ 0 ~ 1.1
            const coralColor = [ // サンゴの色
                (0xff4444), // 赤
                (0xff7733), // オレンジ
                (0xff66aa), // ピンク
                (0xba55d3), // 紫
                (0x44ffaa), // 緑
            ]
            // それぞれの図形のgeometryを記述
            switch (randval) {
                case 0:
                    // Geometryを生成をここに記述
                    // Sphere(泡を表現)
                    addGeometry = new THREE.SphereGeometry(size * 0.3, 16, 16);
                    break;
                // いろいろな形のサンゴを生成
                case 1:
                    // Geometryを生成をここに記述
                    // TorusKnot(網状のサンゴ)
                    addGeometry = new THREE.TorusKnotGeometry(
                        size * 0.4,
                        size * 0.15,
                        64,
                        8,
                        Math.floor(Math.random() * 3) + 2,
                        Math.floor(Math.random() * 2) + 3,
                    )
                    break;
                case 2:
                    // Geometryを生成をここに記述
                    // Tube(棒状のサンゴ)
                    const curve = new THREE.CatmullRomCurve3([
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(0.2, 0.5, 0.1),
                        new THREE.Vector3(-0.1, 1.0, 0.2),
                    ]);
                    addGeometry = new THREE.TubeGeometry(curve, 20, size * 0.1, 8, false);
                    break;
                case 3:
                    // Geometryを生成をここに記述
                    // Cylinder(柱状のサンゴ)
                    addGeometry = new THREE.CylinderGeometry(
                        size * 0.6,
                        size * 0.3,
                        size * 1.5,
                        8
                    );
                    break;
            }
            // 以下、その他の設定を記述
            // Materialの生成
            const isBubble = randval === 0;
            const meshMaterial: THREE.Material = new THREE.MeshLambertMaterial(
                isBubble
                    ? { // 泡の設定
                        color: new THREE.Color(0X87cefa),
                        transparent: true,
                        opacity: 0.6
                    }
                    : { // サンゴの設定
                        color: new THREE.Color(coralColor[Math.floor(Math.random() * coralColor.length)]),
                        transparent: false,
                        opacity: 1.0,
                    }
            );
            // オブジェクトの生成
            const addObject: THREE.Mesh = new THREE.Mesh(addGeometry, meshMaterial);
            // オブジェクトを移動する
            addObject.position.x = Math.round((Math.random() * 7)) - 3.5; // x -3.5 ~ 3.5
            addObject.position.z = Math.round((Math.random() * 7)) - 3.5; // z -3.5 ~ 3.5

            // 高さのみ個別設定にする
            if (isBubble) {
                // 泡はランダムな高さで生成
                addObject.position.y = Math.random() * 4 + 0.5; // y 0.5 ~ 4.5
            } else {
                // サンゴは平面の上に設置
                addObject.position.y = 0.5 + size * 0.6;
            }

            // オブジェクトのシーンへの追加
            this.scene.add(addObject);
        }

        // ランダムな図形を合計100個生成
        for (let i = 0; i < 100; i++) {
            addRandomObject();
        }

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff, 0.5);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 環境光を追加
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambientLight);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(-3, 3, 3));
    document.body.appendChild(viewport);
}
