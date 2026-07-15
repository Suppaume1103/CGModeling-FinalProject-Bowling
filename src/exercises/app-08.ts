import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

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

        let loadOBJ = (objFilePath: string, mtlFilePath: string) => {
            let object = new THREE.Object3D;
            const mtlLoader = new MTLLoader();
            mtlLoader.load(mtlFilePath, (material) => {
                material.preload();
                const objLoader = new OBJLoader();
                objLoader.setMaterials(material);
                objLoader.load(objFilePath, (obj) => {
                    object.add(obj);

                })
            })
            return object;
        }
        const mesh = loadOBJ("objファイルへのパス", "マテリアルファイルへのパス")
        this.scene.add(mesh);

        // const addSceneFromObjFile = async (filePath: string) => {
        //     const meshStr = await readFile(filePath);

        //     let vertices: number[] = [];
        //     let vertexIndices: number[] = [];

        //     const meshLines = meshStr.split("\n");
        //     for (let i = 0; i < meshLines.length; ++i) {
        //         const meshLine = meshLines[i];
        //         const meshSpaceSplitArray = meshLine.split(" ");

        //         const meshType = meshSpaceSplitArray[0]; //どの情報を表すか
        //         if (meshType == "v") { //頂点
        //             vertices.push(parseFloat(meshSpaceSplitArray[1])); //x座標
        //             vertices.push(parseFloat(meshSpaceSplitArray[2])); //y座標
        //             vertices.push(parseFloat(meshSpaceSplitArray[3])); //z座標
        //         } else if (meshType == "f") { //面の情報
        //             const f1 = meshSpaceSplitArray[1].split("/");
        //             const f2 = meshSpaceSplitArray[2].split("/");
        //             const f3 = meshSpaceSplitArray[3].split("/");
        //             vertexIndices.push(parseInt(f1[0]) - 1); //頂点インデックス
        //             vertexIndices.push(parseInt(f2[0]) - 1); //頂点インデックス
        //             vertexIndices.push(parseInt(f3[0]) - 1); //頂点インデックス
        //         }
        //     }

        //     const geometry = new THREE.BufferGeometry();
        //     geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        //     geometry.setIndex(vertexIndices);
        //     geometry.computeVertexNormals();

        //     const material = new THREE.MeshBasicMaterial({});

        //     const mesh = new THREE.Mesh(geometry, material);
        //     this.scene.add(mesh);
        // }

        // addSceneFromObjFile("./src/tri.obj");

        // // 頂点座標の定義
        // // const vertices = new Float32Array([
        // //     -1, 1, 0,
        // //     -1, -1, 0,
        // //     1, -1, 0,
        // //     1, 1, 0,
        // // ]);

        // // 練習 四角形描画
        // // const indices = [
        // //     0,1,2, 3,0,2
        // // ];

        // // 頂点座標
        // const vertices = new Float32Array([
        //     0, 1, 0, //1つ目の頂点座標
        //     -1, -1, 0, //2つ目の頂点座標
        //     1, -1, 0, //3つ目の頂点座標
        // ]);
        // // 頂点インデックス
        // const indices = [
        //     0, 1, 2
        // ];

        // const uvs = new Float32Array([
        //     0.5, 1,
        //     0, 0,
        //     1, 0,
        // ])
        // // const colors = new Float32Array([
        // //     1.0, 0.0, 0.0,
        // //     0.0, 1.0, 0.0,
        // //     0.0, 0.0, 1.0
        // // ])

        // // // 練習2
        // // const colors = new Float32Array([
        // //     1.0, 1.0, 0.0,
        // //     0.0, 0.0, 0.0,
        // //     1.0, 1.0, 1.0
        // // ])



        // const geometry = new THREE.BufferGeometry();
        // geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        // // geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        // geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
        // geometry.setIndex(indices);
        // geometry.computeVertexNormals();

        // const loader = new THREE.TextureLoader();
        // const texture = loader.load('src/parasol.jpg');

        // // const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0, 0) });

        // // const material = new THREE.MeshBasicMaterial({ vertexColors: true });
        // const material = new THREE.MeshBasicMaterial({ map: texture });

        // const mesh = new THREE.Mesh(geometry, material);
        // this.scene.add(mesh);

        const axesBarLength = 10.0;
        this.scene.add(new THREE.AxesHelper(axesBarLength));

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
