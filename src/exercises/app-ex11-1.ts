// 24FI014 稲村 海音
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as TWEEN from "@tweenjs/tween.js";

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

        // グループの生成
        const group = new TWEEN.Group();


        // ひし形(四隅)の軌跡を巡回するアニメーションを作成する関数
        const createDiamondLoopTween = (
            cube: THREE.Mesh,
            corners: { x: number, y: number }[],
            segmentDuration: number,
            cornerDelay: number
        ) => {
            const tweeninfo = { x: corners[0].x, y: corners[0].y };
            cube.position.x = tweeninfo.x;
            cube.position.y = tweeninfo.y;

            const updatePosition = () => {
                cube.position.x = tweeninfo.x;
                cube.position.y = tweeninfo.y;
            }

            // 各頂点を結ぶTweenを作り,次の頂点へ向かわせる
            const tweens = corners.map((_, i) => {
                const next = corners[(i + 1) % corners.length];
                return new TWEEN.Tween(tweeninfo)
                    .delay(cornerDelay)
                    .to({ x: next.x, y: next.y }, segmentDuration)
                    .easing(TWEEN.Easing.Elastic.Out)
                    .onUpdate(updatePosition);
            });

            // 全Tweenを連結してループさせる
            tweens.forEach((tween, i) => {
                tween.chain(tweens[(i + 1) % tweens.length]);
                group.add(tween);
            });

            tweens[0].start();
        }

        // redCude
        const redCudeGeometry = new THREE.BoxGeometry();
        const redCubeMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

        const redCube = new THREE.Mesh(redCudeGeometry, redCubeMaterial)
        this.scene.add(redCube);
        
        // ひし形の軌跡
        createDiamondLoopTween(
            redCube,
            [
                { x: 0.0, y: 5.0 },
                { x: 5.0, y: 0.0 },
                { x: 0.0, y: -5.0 },
                { x: -5.0, y: 0.0 },
            ],
            1000,
            200
        );

        // greenCube
        const greenCubeGeometry = new THREE.BoxGeometry();
        const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
        const greenCube = new THREE.Mesh(greenCubeGeometry, greenMaterial);
        this.scene.add(greenCube);

        createDiamondLoopTween(
            greenCube,
            [
                { x: 0.0, y: -5.0 },
                { x: -5.0, y: 0.0 },
                { x: 0.0, y: 5.0 },
                { x: 5.0, y: 0.0 },
            ],
            1000,
            200
        );

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {

            requestAnimationFrame(update);
            group.update(_time);//追加分

        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    // カメラ設定
    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 10));
    document.body.appendChild(viewport);
}
