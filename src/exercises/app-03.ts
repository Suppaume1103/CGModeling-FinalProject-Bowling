import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";


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
        // GUIの設定

        // ParametricGeometryを作成するための関数
        // ParametricGeometryの仕様で変数u,vは0～1まで変化する
        const myPlane = (u: number, v: number, target: THREE.Vector3) => {
            const r = 10;
            const uRad = u * 2 * Math.PI;
            const vRad = v * Math.PI - Math.PI / 2;
            const x = r * Math.cos(uRad) * Math.cos(vRad);
            const y = r * Math.sin(uRad) * Math.cos(vRad);
            const z = r * Math.sin(vRad);
            target.set(x, y, z);
        }

        const paramGeometry = new ParametricGeometry(myPlane, 30, 30); // 10,10はそれぞれuとvの分割数
        const paramMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff, side: THREE.DoubleSide, flatShading: true });
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        const group = new THREE.Group();
        group.add(new THREE.Mesh(paramGeometry, paramMaterial));
        group.add(new THREE.LineSegments(paramGeometry, lineMaterial));

        this.scene.add(group);

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

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(-15, 15, 15));
    document.body.appendChild(viewport);
}
