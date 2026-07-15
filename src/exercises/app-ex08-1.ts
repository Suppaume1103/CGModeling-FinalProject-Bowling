// 24FI014 稲村海音
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
        const vertices = new Float32Array([
            // 前面
            -0.5, 0.5, 0.5,  // 0: 左上前
            -0.5, -0.5, 0.5,  // 1: 左下前
            0.5, -0.5, 0.5,  // 2: 右下前
            0.5, 0.5, 0.5,  // 3: 右上前

            // 後面
            -0.5, 0.5, -0.5,  // 4: 左上後
            -0.5, -0.5, -0.5,  // 5: 左下後
            0.5, -0.5, -0.5,  // 6: 右下後
            0.5, 0.5, -0.5,  // 7: 右上後
        ]);

        const indices = [
            0, 1, 2, 0, 2, 3,  // 前面
            4, 7, 6, 4, 6, 5,  // 後面
            4, 0, 3, 4, 3, 7,  // 上面
            1, 5, 6, 1, 6, 2,  // 下面
            4, 5, 1, 4, 1, 0,  // 左面
            3, 2, 6, 3, 6, 7,  // 右面
        ];

        const colors = new Float32Array([
            1.0, 0.0, 0.0, // 0: 左上前 (赤)
            1.0, 1.0, 0.0, // 1: 左下前 (イエロー)
            0.0, 1.0, 0.0,  // 2: 右下前 (緑)
            0.0, 0.0, 0.0, // 3: 右上前 (黒)

            1.0, 0.0, 1.0, // 4: 左上後 (マゼンタ)
            1.0, 1.0, 1.0, // 5: 左下後 (白)
            0.0, 1.0, 1.0, // 6: 右下後 (シアン)
            0.0, 0.0, 1.0, // 7: 右上後 (青)
        ])

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshBasicMaterial({ vertexColors: true });

        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);

        const axesBarLength = 10.0;
        this.scene.add(new THREE.AxesHelper(axesBarLength));

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}


window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 3));
    document.body.appendChild(viewport);
}
