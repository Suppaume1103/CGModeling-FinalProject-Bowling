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

        // メッシュの生成
        const geometry = new THREE.ConeGeometry(0.25, 1);
        const redMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
        const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
        const blueMaterial = new THREE.MeshPhongMaterial({ color: 0x0000FF });
        const redCone = new THREE.Mesh(geometry, redMaterial);
        const greenCone = new THREE.Mesh(geometry, greenMaterial);
        const blueCone = new THREE.Mesh(geometry, blueMaterial);

        //モデルの座標移動
        redCone.translateX(0.5);
        redCone.rotateZ(-Math.PI / 2);
        greenCone.translateY(0.5);
        blueCone.translateZ(0.5);
        blueCone.rotateX(Math.PI / 2);

        //グループにして一つのオブジェクトとして扱う
        const obj: THREE.Group = new THREE.Group();
        obj.add(redCone);
        obj.add(greenCone);
        obj.add(blueCone);
        this.scene.add(obj);

        // グリッド表示
        const gridHelper = new THREE.GridHelper(10,);
        this.scene.add(gridHelper);

        // 軸表示
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);


        // エルミート曲線
        const hermite = (p0: THREE.Vector3, v0: THREE.Vector3,
            p1: THREE.Vector3, v1: THREE.Vector3, t: number): THREE.Vector3 => {
            const result = p0.clone().multiplyScalar((2.0 * t + 1) * (1.0 - t) * (1.0 - t))
                .add(v0.clone().multiplyScalar(t * (1.0 - t) * (1.0 - t)))
                .add(p1.clone().multiplyScalar(t * t * (3.0 - 2.0 * t)))
                .add(v1.clone().multiplyScalar(- t * t * (1.0 - t)));
            return result;
        }

        // 通過点の定義
        const points: THREE.Vector3[] = [
            new THREE.Vector3(0, 0, -4),   // P0
            new THREE.Vector3(0, 0, 2),    // P1
            new THREE.Vector3(2, 0, 2),    // P2
            new THREE.Vector3(0, 2, 0),    // P3
            new THREE.Vector3(-4, 2, 0),   // P4
        ];

        // 速度ベクトルの定義
        const velocities: THREE.Vector3[] = [];
        velocities.push(points[1].clone().sub(points[0]));
        for (let i = 1; i < points.length - 1; i++) {
            velocities.push(points[i + 1].clone().sub(points[i - 1]));
        }
        velocities.push(points[points.length - 1].clone().sub(points[points.length - 2]));

        // セグメント定義
        const numSegments = points.length - 1;


        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        const timer = new THREE.Timer();
        let t = 0;
        let seg = 0;

        const update: FrameRequestCallback = (_time) => {
            timer.update();
            t += timer.getDelta();
            if (t >= 1.0) {
                t -= 1.0;
                seg = (seg + 1) % numSegments;
            }

            const pos = hermite(points[seg], velocities[seg], points[seg + 1], velocities[seg + 1], t);
            obj.position.copy(pos);
            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(5, 7, 5));
    document.body.appendChild(viewport);
}
