// 24FI014 稲村 海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui';
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { createNoise3D } from 'simplex-noise';


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

        // materialの生成
        const paramMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff, side: THREE.DoubleSide, flatShading: true });
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

        // 生成する図形をまとめるグループ
        const geometriesGroup = (fn: (u: number, v: number, target: THREE.Vector3) => void) => {
            const geometry = new ParametricGeometry(fn, 30, 30);
            const group = new THREE.Group();
            group.add(new THREE.Mesh(geometry, paramMaterial));
            group.add(new THREE.LineSegments(geometry, lineMaterial));
            return group;
        };

        // 波打つ平面
        const myWave = (u: number, v: number, target: THREE.Vector3) => {
            const r = 30;
            const x = u * r - r / 2;
            const z = v * r - r / 2;
            const d = Math.sqrt(x * x + z * z);
            const y = Math.sin(d) * 2;
            target.set(x, y, z);
        };

        // クラインの壺
        const myKlein = (u: number, v: number, target: THREE.Vector3) => {
            const uRad = u * 2 * Math.PI;
            const vRad = v * 2 * Math.PI;
            const r = 4 - 2 * Math.cos(uRad);
            let x = 6 * Math.cos(uRad) * (1 + Math.sin(uRad)) + r * Math.cos(uRad) * Math.cos(vRad);;
            let y = 16 * Math.sin(uRad) + r * Math.sin(uRad) * Math.cos(vRad);
            const z = r * Math.sin(vRad);
            if (uRad >= Math.PI && uRad <= Math.PI * 2) {
                x = 6 * Math.cos(uRad) * (1 + Math.sin(uRad)) + r * Math.cos(vRad + Math.PI);
                y = 16 * Math.sin(uRad);
            }
            target.set(x, y, z);
        };

        // なだらかな地形
        const noise3D = createNoise3D();
        const myPerlin = (u: number, v: number, target: THREE.Vector3) => {
            const r = 30;
            const x = u * r - r / 2;
            const z = v * r - r / 2;
            const y = noise3D(x * 0.1, 0, z * 0.1) * 2;
            target.set(x, y, z);
        }

        const waveGroup = geometriesGroup(myWave);
        const kleinGroup = geometriesGroup(myKlein);
        const perlinGroup = geometriesGroup(myPerlin);
        this.scene.add(waveGroup);
        this.scene.add(kleinGroup);
        this.scene.add(perlinGroup);

        // 初期はクラインの壺となだらかな地形は非表示
        kleinGroup.visible = false;
        perlinGroup.visible = false;

        // GUIの設定
        const gui = new GUI(); // GUI用のインスタンスの作成
        const guiObj = { size: "Wave" }; // GUIのパラメータ
        gui.add(guiObj, "size", ["Wave", "Klein", "Perlin"]); // トップダウンリストを追加


        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {
            requestAnimationFrame(update);

            // トップダウンリストの変更時の操作
            if (guiObj.size === "Wave") {
                waveGroup.visible = true;
                kleinGroup.visible = false;
                perlinGroup.visible = false;
            } else if (guiObj.size === "Klein") {
                waveGroup.visible = false;
                kleinGroup.visible = true;
                perlinGroup.visible = false;
            } else {
                waveGroup.visible = false;
                kleinGroup.visible = false;
                perlinGroup.visible = true;
            }
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
