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

        const addSceneFromObjFile = async (objFilePath: string, mtlFilePath: string) => {
            const objDir = objFilePath.substring(0, objFilePath.lastIndexOf("/") + 1);
            const meshStr = await readFile(objFilePath);

            // MTLファイルからテクスチャファイル名を取り出す
            const mtlStr = await readFile(mtlFilePath);
            const textureLoader = new THREE.TextureLoader();
            let texture: THREE.Texture | null = null;
            const mtlLines = mtlStr.split("\n");
            for (let i = 0; i < mtlLines.length; i++) {
                const mtlLine = mtlLines[i];
                const mtlSpaceSplitArray = mtlLine.split(" ");
                const mtlType = mtlSpaceSplitArray[0];
                if (mtlType == "map_Kd") {
                    texture = textureLoader.load(objDir + mtlSpaceSplitArray[1]);
                    break;
                }
            }

            let vertices: number[] = [];
            let uvs: number[] = [];
            let positionBuffer: number[] = [];
            let uvBuffer: number[] = [];

            const meshLines = meshStr.split("\n");
            for (let i = 0; i < meshLines.length; i++) {
                const meshLine = meshLines[i].trim();
                const meshSpaceSplitArray = meshLine.split(" ");

                const meshType = meshSpaceSplitArray[0]; //どの情報を表すか
                if (meshType == "v") { //頂点座標
                    vertices.push(parseFloat(meshSpaceSplitArray[1]));
                    vertices.push(parseFloat(meshSpaceSplitArray[2]));
                    vertices.push(parseFloat(meshSpaceSplitArray[3]));
                } else if (meshType == "vt") { //UV座標
                    uvs.push(parseFloat(meshSpaceSplitArray[1]));
                    uvs.push(parseFloat(meshSpaceSplitArray[2]));
                } else if (meshType == "f") { //面の情報
                    for (let j = 1; j <= 3; j++) {
                        const parts = meshSpaceSplitArray[j].split("/");
                        const vIdx = (parseInt(parts[0]) - 1) * 3; //頂点インデックス
                        positionBuffer.push(vertices[vIdx], vertices[vIdx + 1], vertices[vIdx + 2]);
                        if (parts[1] && parts[1] !== "") {
                            const vtIdx = (parseInt(parts[1]) - 1) * 2; //UVインデックス
                            uvBuffer.push(uvs[vtIdx], uvs[vtIdx + 1]);
                        }
                    }
                }
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionBuffer), 3));
            if (uvBuffer.length > 0) {
                geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvBuffer), 2));
            }
            geometry.computeVertexNormals();
            const material = new THREE.MeshBasicMaterial({ map: texture });
            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
        }

        addSceneFromObjFile("./src/dice.obj", "./src/dice.mtl");

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

async function readFile(path: string): Promise<string> {
    return new Promise((resolve => {
        const loader = new THREE.FileLoader();
        loader.load(path, (data) => {
            if (typeof data === "string") {
                resolve(data);
            } else {
                const decoder = new TextDecoder('utf-8');
                const decodedString = decoder.decode(data);
                resolve(decodedString);
            }
        },
        );
    }));
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 0, 3));
    document.body.appendChild(viewport);
}
