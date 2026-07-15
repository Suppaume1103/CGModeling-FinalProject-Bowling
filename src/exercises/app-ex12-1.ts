// 24FI014 稲村海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from 'cannon-es';

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

        // グリッド表示
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);

        // 軸表示
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

        world.defaultContactMaterial.friction = 0.025;
        world.defaultContactMaterial.restitution = 0.9;

        // ドミノの数
        const dominoNum = 20;

        // ドミノ1つ分のサイズ(幅, 高さ, 厚み)
        const dominoWidth = 1;
        const dominoHeight = 2;
        const dominoDepth = 0.25;

        // ドミノを並べる円の半径
        const dominoRadius = 3.5;

        // ドミノのメッシュと物理ボディを生成する
        const createDomino = (angle: number): { mesh: THREE.Mesh; body: CANNON.Body } => {
            const dominoGeometry = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth);
            const dominoMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            const mesh = new THREE.Mesh(dominoGeometry, dominoMaterial);

            // 円周上の位置
            const x = dominoRadius * Math.cos(angle);
            const z = dominoRadius * Math.sin(angle);
            mesh.position.set(x, dominoHeight / 2, z);
            mesh.rotateY(-angle);
            this.scene.add(mesh);

            const dominoShape = new CANNON.Box(new CANNON.Vec3(dominoWidth / 2, dominoHeight / 2, dominoDepth / 2));
            const body = new CANNON.Body({ mass: 1 });
            body.addShape(dominoShape);
            body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
            body.quaternion.set(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w);

            world.addBody(body);
            return { mesh, body };
        };

        // 円周上にドミノを等間隔に並べる
        const dominoAngleStep = (Math.PI * 2) / dominoNum;
        const dominoes = Array.from({ length: dominoNum }, (_, i) => createDomino(i * dominoAngleStep));

        // 最初のドミノに初期角速度を与えて倒れ始めるようにする
        dominoes[0].body.angularVelocity.set(2.5, 0, 0);

        const phongMaterial = new THREE.MeshPhongMaterial();
        const planeGeometry = new THREE.PlaneGeometry(25, 25);
        const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
        planeMesh.material.side = THREE.DoubleSide;
        planeMesh.rotateX(-Math.PI / 2);

        this.scene.add(planeMesh);

        const planeShape = new CANNON.Plane()
        const planeBody = new CANNON.Body({ mass: 0 })
        planeBody.addShape(planeShape)
        planeBody.position.set(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z);
        planeBody.quaternion.set(planeMesh.quaternion.x, planeMesh.quaternion.y, planeMesh.quaternion.z, planeMesh.quaternion.w);

        world.addBody(planeBody)

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {
            world.fixedStep();

            dominoes.forEach(({ mesh, body }) => {
                mesh.position.set(body.position.x, body.position.y, body.position.z);
                mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
            });

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(5, 5, 5));
    document.body.appendChild(viewport);
}
