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

        this.scene.add(this.createChabashira());
        this.scene.add(this.createCup());
        this.scene.add(this.createTea());

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

    private createChabashira = () => {
        const size = 0.02;

        const shape = new THREE.Shape();
        shape.moveTo(-size, -size);
        shape.lineTo(size, -size);
        shape.lineTo(size, size);
        shape.lineTo(-size, size);
        shape.lineTo(-size, -size);

        const extrudeSettings = {
            depth: 0.6,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.01,
            bevelSegments: 1,
            curveSegments: 1,
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshPhongMaterial({
            color: 0xb8d200,
            flatShading: true,
        });

        const tofu = new THREE.Mesh(geometry, material);
        tofu.position.y = -0.5;
        tofu.castShadow = true;
        return tofu;
    }

    // お茶の水面
    private createTea = () => {
        const waterY = -0.15;
        const radius = Math.sqrt(1 - waterY * waterY);

        const geometry = new THREE.CircleGeometry(radius, 8);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshPhongMaterial({
            color: 0xc4c46a,
            flatShading: true,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
        });

        const tea = new THREE.Mesh(geometry, material);
        tea.position.y = waterY;
        return tea;
    }

    // 茶碗
    private createCup = () => {
        const points: THREE.Vector2[] = [];
        const arcSegments = 26;

        for (let i = 0; i <= arcSegments; i++) {
            points.push(new THREE.Vector2(Math.cos(Math.PI / 2 * i / (arcSegments - 1) - Math.PI / 2),
                Math.sin(Math.PI / 2 * i / (arcSegments - 1) - Math.PI / 2)));
        }

        const geometry = new THREE.LatheGeometry(points, 26);

        const material = new THREE.MeshPhongMaterial({
            color: 0x8b5a2b,
            flatShading: true,
            side: THREE.DoubleSide,
        });

        const tray = new THREE.Mesh(geometry, material);
        tray.position.y = 0.0;
        return tray;
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(-1.3, 1.0, 2.0));
    document.body.appendChild(viewport);
}
