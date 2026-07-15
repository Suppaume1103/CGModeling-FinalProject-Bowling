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
        renderer.setClearColor(new THREE.Color(0x495ed));

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
            const addObjectGeometry: THREE.BufferGeometry = new THREE.BoxGeometry(6, 1, 6);
            // Materialの生成
            const meshMaterial: THREE.Material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
            // オブジェクトの生成
            const addObject: THREE.Mesh = new THREE.Mesh(addObjectGeometry, meshMaterial);
            // オブジェクトのシーンへの追加
            this.scene.add(addObject);
        }

        addPlane();

        // ランダムな図形の生成
        const addRandomObject = () => {
            const randval: number = Math.floor(Math.random() * 3); // 0~2の乱数を発生させる。
            let addGeometry: THREE.BufferGeometry = new THREE.BoxGeometry(); // 3つの図形に共通の変数を作る
            const size: number = Math.random() + 0.1; // サイズ 0 ~ 1.1
            // それぞれの図形のgeometryを記述
            switch (randval) {
                case 0:
                    // Geometryを生成をここに記述
                    // Box
                    addGeometry = new THREE.BoxGeometry(size, size, size);
                    break;
                case 1:
                    // Geometryを生成をここに記述
                    // Sphere
                    addGeometry = new THREE.SphereGeometry(size);
                    break;
                case 2:
                    // Geometryを生成をここに記述
                    // Icosahedron
                    addGeometry = new THREE.IcosahedronGeometry(size);
                    break;
            }
            // 以下、その他の設定を記述
            // Materialの生成
            const meshMaterial = new THREE.MeshLambertMaterial({
                color: new THREE.Color(Math.random() % 255, Math.random() % 255, Math.random() % 255), // 色はランダムに
                side: THREE.DoubleSide
            });
            // オブジェクトの生成
            const addObject: THREE.Mesh = new THREE.Mesh(addGeometry, meshMaterial);
            // オブジェクトを移動する
            addObject.position.x = Math.round((Math.random() * 4)) - 2.0; // x -2.0 ~ 2.0
            addObject.position.y = Math.round(Math.random() * 2 + 1); // y 1.0 ~ 3.0
            addObject.position.z = Math.round((Math.random() * 4)) - 2.0; // z -2.0 ~ 2.0
            // オブジェクトのシーンへの追加
            this.scene.add(addObject);
        }

        // ランダムな図形を合計30個生成
        for (let i = 0; i < 30; i++) {
            addRandomObject();
        }

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(-3, 3, 3));
    document.body.appendChild(viewport);
}
