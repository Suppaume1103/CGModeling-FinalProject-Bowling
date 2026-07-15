import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private plane!: THREE.Mesh;
    private group!: THREE.Group;

    constructor() {
        
    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x495ed));
        renderer.shadowMap.enabled = true; //シャドウマップを有効にする

        //カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000); // 透視投影
        // const camera = new THREE.OrthographicCamera(width / -150.0, width / 150.0, height / 150.0, height / -150.0, 0.1, 1000); // 平行投影
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const orbitControls = new OrbitControls(camera, renderer.domElement); // マウス操作

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
        this.group = new THREE.Group();

        // const geometry = new THREE.BoxGeometry(1, 1, 1);
        // const geometry = new THREE.SphereGeometry(0.7, 20, 20);
        // const material = new THREE.MeshStandardMaterial({ color: 0x55ff00 });
        // const material = new THREE.MeshNormalMaterial(); // 各面の法線方向のベクトルの方向に色が決まる
        // material.wireframe = true; // ワイヤーフレームで図形を描画
        // 物体を透明に
        // material.opacity = 0.1;
        // material.transparent = true;
        // material.visible = false; // 立体を透明に
        // const material = new THREE.MeshLambertMaterial({color: 0x55ff00}); // 光源に反応するマテリアル
        // const material = new THREE.MeshPhongMaterial({ color: 0x55ff00 }); // 光沢のあるマテリアル
        // // PhongMaterialのプロパティ
        // material.specular = new THREE.Color(0x55ff00);
        // material.flatShading = true;
        // material.metalness = 1500;//値を変えてみましょう
        // material.roughness = 1500;//値を変えてみましょう
        const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
        const matArray = [];
        matArray.push(new THREE.MeshBasicMaterial({ color: 0x009e60 }));
        matArray.push(new THREE.MeshBasicMaterial({ color: 0x0051ba }));
        matArray.push(new THREE.MeshBasicMaterial({ color: 0xffd500 }));
        matArray.push(new THREE.MeshBasicMaterial({ color: 0xff5800 }));
        matArray.push(new THREE.MeshBasicMaterial({ color: 0xc41e3a }));
        matArray.push(new THREE.MeshBasicMaterial({ color: 0xffffff }));

        // // オブジェクトを3x3に並べて生成
        // for (let x = 0; x < 3; x++) {
        //     for (let z = 0; z < 3; z++) {
        //         // メッシュの生成
        //         // const mesh = new THREE.Mesh(geometry, material);
        //         const mesh = new THREE.Mesh(geometry, matArray);
        //         mesh.castShadow = true;
        //         // メッシュの位置を設定
        //         mesh.position.set(x * 2 - 2, 0, z * 2 - 2);
        //         // メッシュをシーンに追加
        //         this.scene.add(mesh);
        //     }
        // }

        // グループを使ってオブジェクトを6X6で生成
        for (let x = 0; x < 3; x++){
            for (let y = 0; y < 3; y++){
                for(let z = 0; z < 3; z++){
                    // メッシュの生成
                    const mesh = new THREE.Mesh(geometry, matArray);
                    mesh.castShadow = true;
                    // メッシュの位置を特定
                    mesh.position.set(x * 2 - 2, y * 2 - 2, z * 2 - 2);
                    // メッシュをグループに追加
                    this.group.add(mesh);
                    //　グループをシーンに追加
                    this.scene.add(this.group);
                }
            }
        }

        // 平面の生成
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.receiveShadow = true; //影を受けるようにする
        this.plane.position.y = -5;
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);

        //ライトの設定
        const light = new THREE.DirectionalLight(0xffffff, 3.0); // 平行光源
        // const light = new THREE.AmbientLight(0xffffff, 0.5) // ライトの色がシーン全体に適用されるライト
        // const light = new THREE.PointLight(0xffffff, 75.0); // 一点から全方向に向かって光を発するライト
        // light.position.set(5, 5, 5);
        // light.castShadow = true;
        // const light = new THREE.SpotLight(0xffffff, 75.0); // 懐中電灯のようにライトの効果が円錐上になるライト
        // light.position.set(5, 5, 5);
        // light.castShadow = true;
        // light.target = this.plane;
        light.position.set(1, 1, 1);
        light.target = this.plane;
        light.castShadow = true;
        this.scene.add(light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {
            this.group.rotateX(0.01); // 追加
            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(-3, 3, 3));
    document.body.appendChild(viewport);
}
