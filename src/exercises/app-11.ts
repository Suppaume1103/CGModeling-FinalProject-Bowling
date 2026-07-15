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

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material)
        this.scene.add(cube);

        // Tweenでコントロールする変数の定義
        const tweeninfo = { scale: 1.0 };

        //  Tweenでパラメータの更新の際に呼び出される関数
        const updateScale = () => {
            cube.scale.x = tweeninfo.scale;
        }

        // //  Tweenでパラメータの更新の際に呼び出される関数
        // const updateScale = () => {
        //     cube.scale.x = tweeninfo.scaleX;
        //     cube.scale.y = tweeninfo.scaleY;
        // }

        // Tweenの作成
        // const tween = new TWEEN.Tween(tweeninfo).to({ scaleX: 3, scaleY: 5 }, 1000).onUpdate(updateScale);

        // const tweenBack = new TWEEN.Tween(tweeninfo).to({ scaleX: 1, scaleY: 5 }, 1000).onUpdate(updateScale);

        const tween = new TWEEN.Tween(tweeninfo).to({ scale: 5 }, 1000).easing(TWEEN.Easing.Elastic.Out).onUpdate(updateScale);
        const tweenBack = new TWEEN.Tween(tweeninfo).delay(500).to({ scale: 1 }, 1000).onUpdate(updateScale);

        tween.chain(tweenBack);



        // グループの生成
        const group = new TWEEN.Group();
        group.add(tween);
        group.add(tweenBack); // 追加分
        tweenBack.chain(tween);

        // アニメーションの開始
        tween.start();

        const greenCubeGeometry = new THREE.BoxGeometry();
        const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
        const greenCube = new THREE.Mesh(greenCubeGeometry, greenMaterial);
        this.scene.add(greenCube);

        let greenCubeTweeninfo = { scale: 1.0 };
        let updateGreenCubeScale = () => {
            greenCube.scale.y = greenCubeTweeninfo.scale;
        }

        const greenCubeTween = new TWEEN.Tween(greenCubeTweeninfo).to({ scale: 5 }, 1000).easing(TWEEN.Easing.Elastic.Out).onUpdate(updateGreenCubeScale);
        const greenCubeBack = new TWEEN.Tween(greenCubeTweeninfo).delay(500).to({ scale: 1 }, 1000).onUpdate(updateGreenCubeScale);

        greenCubeTween.chain(greenCubeBack);
        greenCubeBack.chain(greenCubeTween);

        group.add(greenCubeBack);
        group.add(greenCubeTween);

        greenCubeTween.start();

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

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 10));
    document.body.appendChild(viewport);
}
