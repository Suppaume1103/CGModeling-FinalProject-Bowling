// 24FI014 稲村 海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private plane!: THREE.Mesh;
    private group!: THREE.Group;

    constructor() {

    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x495ed));
        renderer.shadowMap.enabled = true; //シャドウマップを有効にする

        //カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000); // 透視投影
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const orbitControls = new OrbitControls(camera, renderer.domElement); // マウス操作

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
        const lorder = new THREE.TextureLoader(); // 画像を読み込むlorderの変数
        const texture = lorder.load('src/IMG_3100.PNG'); // 画像を読み込み
        texture.colorSpace = THREE.SRGBColorSpace; // カラースペースを定義(sRGB)
        this.scene = new THREE.Scene();
        this.group = new THREE.Group();
        const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
        const matArray = [];
        // それぞれの面にテクスチャを貼り付け
        matArray.push(new THREE.MeshBasicMaterial({ map: texture }));
        matArray.push(new THREE.MeshBasicMaterial({ map: texture }));
        matArray.push(new THREE.MeshBasicMaterial({ map: texture }));
        matArray.push(new THREE.MeshBasicMaterial({ map: texture }));
        matArray.push(new THREE.MeshBasicMaterial({ map: texture }));
        matArray.push(new THREE.MeshBasicMaterial({ map: texture }));

        // グループを使ってオブジェクトを6X6で生成
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                for (let z = 0; z < 3; z++) {
                    // メッシュの生成
                    const mesh = new THREE.Mesh(geometry, matArray);
                    mesh.castShadow = true;
                    // メッシュの位置を特定
                    mesh.position.set(x * 2 - 2, y * 2 - 2, z * 2 - 2);
                    // メッシュをグループに追加
                    this.group.add(mesh);
                    //　グループをシーンに追加
                    this.scene.add(this.group);
                }
            }
        }

        // 平面の生成
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.receiveShadow = true; //影を受けるようにする
        this.plane.position.y = -5;
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);

        //ライトの設定
        const light = new THREE.DirectionalLight(0xffffff, 3.0); // 平行光源
        light.position.set(1, 1, 1);
        light.target = this.plane;
        light.castShadow = true;
        this.scene.add(light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {
            this.group.rotateX(0.01); // 追加
            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(-3, 3, 3));
    document.body.appendChild(viewport);
}
