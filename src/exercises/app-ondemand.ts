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

        // const points: THREE.Vector2[] = [];
        // const pointNum = 10000;
        // for (let i = 0; i < pointNum; i++) {
        //     points.push(new THREE.Vector2(Math.cos(Math.PI * i / (pointNum - 1) - Math.PI / 2),
        //         Math.sin(Math.PI * i / (pointNum - 1) - Math.PI / 2)));
        // }

        // // points.push(new THREE.Vector2(0, -0.5));
        // // points.push(new THREE.Vector2(0.5, 0));
        // // points.push(new THREE.Vector2(0.0, 0.5));

        // const laticeGeometry = new THREE.LatheGeometry(points);
        // const laticeMaterial = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
        // const lathemMesh = new THREE.Mesh(laticeGeometry, laticeMaterial);
        // this.scene.add(lathemMesh);

        // const sphereGeometry = new THREE.SphereGeometry(0.025);
        // const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        // for (let i = 0; i < points.length; i++) {
        //     const mesh = new THREE.Mesh(sphereGeometry, redMaterial);
        //     mesh.position.set(points[i].x, points[i].y, 0);
        //     this.scene.add(mesh);
        // }

        // const drawShape = () => {
        //     const shape = new THREE.Shape();
        //     shape.moveTo(1, 1);
        //     shape.lineTo(1, -1);
        //     shape.lineTo(-1, -1);
        //     shape.lineTo(-1, 1);
        //     return shape;
        // }

        const drawShape = () => {
            const shape = new THREE.Shape();
            shape.moveTo(1, 1);
            shape.lineTo(1, -1);
            shape.quadraticCurveTo(0, -2, -1, -1);
            shape.lineTo(-1, 1);

            const hole = new THREE.Path();
            hole.absellipse(0, 0, 0.25, 0.25, 0, Math.PI * 2, false, 0);
            shape.holes.push(hole);

            return shape;
        }

        // const extrudeSettings = {
        //     steps: 2,
        //     depth: 4,
        //     bevelEnabled: false,
        //     bevelThickness: 4,
        //     bevelSize: 2,
        //     bevelSegments: 3
        // };

        const shapeGeometry = new THREE.ShapeGeometry(drawShape());
        // const shapeGeometry = new THREE.ExtrudeGeometry(drawShape(), extrudeSettings)
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
        const meshMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff, side: THREE.DoubleSide, flatShading: true });

        const group = new THREE.Group();
        group.add(new THREE.Mesh(shapeGeometry, meshMaterial));
        group.add(new THREE.LineSegments(shapeGeometry, lineMaterial));

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

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 3));
    document.body.appendChild(viewport);
}
