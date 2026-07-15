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

        world.defaultContactMaterial.friction = 0.03;
        world.defaultContactMaterial.restitution = 0.8;

        // const geometry = new THREE.BoxGeometry(1, 1, 1);
        // const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        // const cube = new THREE.Mesh(geometry, material);
        // cube.position.y = 3;
        // this.scene.add(cube);

        // const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));

        // const cubeBody = new CANNON.Body({ mass: 1 });
        // cubeBody.addShape(cubeShape);

        // cubeBody.position.set(cube.position.x, cube.position.y, cube.position.z);
        // cubeBody.quaternion.set(cube.quaternion.x, cube.quaternion.y, cube.quaternion.z, cube.quaternion.w);

        // world.addBody(cubeBody);

        // ドミノの数
        // const dominoNum = 100;

        // // ドミノ1つ分のサイズ(幅, 高さ, 厚み)
        // const dominoWidth = 1;
        // const dominoHeight = 2;
        // const dominoDepth = 0.25;
        // // 隣のドミノとのZ方向の間隔(倒れたときに次のドミノへ届く距離)
        // const dominoSpacing = 0.5;

        // // ドミノのメッシュと物理ボディをまとめて生成する
        // const createDomino = (z: number): { mesh: THREE.Mesh; body: CANNON.Body } => {
        //     const dominoGeometry = new THREE.BoxGeometry(dominoWidth, dominoHeight, dominoDepth);
        //     const dominoMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        //     const mesh = new THREE.Mesh(dominoGeometry, dominoMaterial);
        //     mesh.position.set(0, dominoHeight / 2, z);
        //     this.scene.add(mesh);

        //     // CANNON.Boxはhalf-extents(半径)を渡す
        //     const dominoShape = new CANNON.Box(new CANNON.Vec3(dominoWidth / 2, dominoHeight / 2, dominoDepth / 2));
        //     const body = new CANNON.Body({ mass: 1 });
        //     body.addShape(dominoShape);
        //     body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);

        //     world.addBody(body);
        //     return { mesh, body };
        // };

        // // z軸線上にドミノをdominoNum個並べる(中央揃え)
        // const dominoOffset = ((dominoNum - 1) * dominoSpacing) / 2;
        // const dominoes = Array.from({ length: dominoNum }, (_, i) => createDomino(i * dominoSpacing - dominoOffset));

        // // 最初のドミノを少し傾けて、連鎖的に倒れ始めるようにする
        // // ドミノはz軸方向に並んでいるため、x軸周りに回転させて+z方向(次のドミノ側)へ傾ける
        // dominoes[0].body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.3);

        const carBody = new CANNON.Body({ mass: 5 });

        const carBodyShape = new CANNON.Box(new CANNON.Vec3(4, 0.5, 2));

        carBody.addShape(carBodyShape);

        carBody.position.y = 1;

        const vehicle = new CANNON.RigidVehicle({ chassisBody: carBody });

        vehicle.addToWorld(world);

        const wheelShape = new CANNON.Sphere(1);

        const frontLeftWheelBody = new CANNON.Body({ mass: 1 });
        frontLeftWheelBody.addShape(wheelShape);
        frontLeftWheelBody.angularDamping = 0.4;

        const frontRightWheelBody = new CANNON.Body({ mass: 1 });
        frontRightWheelBody.addShape(wheelShape);
        frontRightWheelBody.angularDamping = 0.4;

        const rearLeftWheelBody = new CANNON.Body({ mass: 1 });
        rearLeftWheelBody.addShape(wheelShape);
        rearLeftWheelBody.angularDamping = 0.4;

        const rearRightWheelBody = new CANNON.Body({ mass: 1 });
        rearRightWheelBody.addShape(wheelShape);
        rearRightWheelBody.angularDamping = 0.4;

        vehicle.addWheel({
            body: frontLeftWheelBody,
            position: new CANNON.Vec3(-2, 0, 2.5)
        });
        vehicle.addWheel({
            body: frontRightWheelBody,
            position: new CANNON.Vec3(-2, 0, -2.5)
        });
        vehicle.addWheel({
            body: rearLeftWheelBody,
            position: new CANNON.Vec3(2, 0, 2.5)
        });
        vehicle.addWheel({
            body: rearRightWheelBody,
            position: new CANNON.Vec3(2, 0, -2.5)
        });

        vehicle.addToWorld(world);

        const wheelGeometry = new THREE.SphereGeometry(1);
        const wheelMaterial = new THREE.MeshNormalMaterial();

        const frontLeftMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.scene.add(frontLeftMesh);

        const frontRightMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.scene.add(frontRightMesh);

        const rearLeftMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.scene.add(rearLeftMesh);

        const rearRightMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.scene.add(rearRightMesh);

        const boxGeometry = new THREE.BoxGeometry(8, 1, 4);
        const boxMaterial = new THREE.MeshNormalMaterial();
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);

        this.scene.add(boxMesh);

        const phongMaterial = new THREE.MeshPhongMaterial();
        const planeGeometry = new THREE.PlaneGeometry(25, 25);
        const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
        planeMesh.material.side = THREE.DoubleSide; // 両面
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

            vehicle.setWheelForce(10, 0);
            vehicle.setWheelForce(10, 1);

            vehicle.setSteeringValue(THREE.MathUtils.degToRad(30), 0);
            vehicle.setSteeringValue(THREE.MathUtils.degToRad(30), 1);

            boxMesh.position.set(carBody.position.x, carBody.position.y, carBody.position.z);
            boxMesh.quaternion.set(carBody.quaternion.x, carBody.quaternion.y, carBody.quaternion.z, carBody.quaternion.w);

            frontLeftMesh.position.set(frontLeftWheelBody.position.x, frontLeftWheelBody.position.y, frontLeftWheelBody.position.z);
            frontLeftMesh.quaternion.set(frontLeftWheelBody.quaternion.x, frontLeftWheelBody.quaternion.y, frontLeftWheelBody.quaternion.z, frontLeftWheelBody.quaternion.w);

            frontRightMesh.position.set(frontRightWheelBody.position.x, frontRightWheelBody.position.y, frontRightWheelBody.position.z);
            frontRightMesh.quaternion.set(frontRightWheelBody.quaternion.x, frontRightWheelBody.quaternion.y, frontRightWheelBody.quaternion.z, frontRightWheelBody.quaternion.w);

            rearLeftMesh.position.set(rearLeftWheelBody.position.x, rearLeftWheelBody.position.y, rearLeftWheelBody.position.z);
            frontLeftMesh.quaternion.set(rearLeftWheelBody.quaternion.x, rearLeftWheelBody.quaternion.y, rearLeftWheelBody.quaternion.z, rearLeftWheelBody.quaternion.w);

            rearRightMesh.position.set(rearRightWheelBody.position.x, rearRightWheelBody.position.y, rearRightWheelBody.position.z);
            rearRightMesh.quaternion.set(rearRightWheelBody.quaternion.x, rearRightWheelBody.quaternion.y, rearRightWheelBody.quaternion.z, rearRightWheelBody.quaternion.w);

            // 物理演算の結果(body)をThree.jsのメッシュに反映する
            // dominoes.forEach(({ mesh, body }) => {
            //     mesh.position.set(body.position.x, body.position.y, body.position.z);
            //     mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
            // });

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
