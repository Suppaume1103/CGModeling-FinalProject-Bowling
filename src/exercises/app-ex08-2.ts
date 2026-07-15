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
            const meshStr = await readFile(objFilePath);
            const mtlStr = await readFile(mtlFilePath);
            const materials: Record<string, THREE.Color> = {};
            let currentMtlName = "";
            const mtlLines = mtlStr.split("\n")
            for (let i = 0; i < mtlLines.length; i++) {
                const mtlLine = mtlLines[i];
                const mtlSpaceSplitArray = mtlLine.split(" ");

                const mtlType = mtlSpaceSplitArray[0];
                if (mtlType == "newmtl") {
                    currentMtlName = mtlSpaceSplitArray[1];
                } else if (mtlType == "Kd" && currentMtlName) {
                    materials[currentMtlName] = new THREE.Color(
                        parseFloat(mtlSpaceSplitArray[1]),
                        parseFloat(mtlSpaceSplitArray[2]),
                        parseFloat(mtlSpaceSplitArray[3])
                    );
                }
            }
            
            let vertices: number[] = [];
            let vertexIndices: number[] = [];
            let faceColors: THREE.Color[] = [];
            let currentColor = new THREE.Color(1, 1, 1);

            const meshLines = meshStr.split("\n");
            for (let i = 0; i < meshLines.length; i++) {
                const meshLine = meshLines[i];
                const meshSpaceSplitArray = meshLine.split(" ");

                const meshType = meshSpaceSplitArray[0]; //どの情報を表すか
                if (meshType == "v") { //頂点
                    vertices.push(parseFloat(meshSpaceSplitArray[1])); //x座標
                    vertices.push(parseFloat(meshSpaceSplitArray[2])); //y座標
                    vertices.push(parseFloat(meshSpaceSplitArray[3])); //z座標
                } else if (meshType == "usemtl") {
                    currentColor = materials[meshSpaceSplitArray[1]] ?? new THREE.Color(1, 1, 1);
                } else if (meshType == "f") { //面の情報
                    const f1 = meshSpaceSplitArray[1].split("/");
                    const f2 = meshSpaceSplitArray[2].split("/");
                    const f3 = meshSpaceSplitArray[3].split("/");
                    vertexIndices.push(parseInt(f1[0]) - 1); //頂点インデックス
                    vertexIndices.push(parseInt(f2[0]) - 1); //頂点インデックス
                    vertexIndices.push(parseInt(f3[0]) - 1); //頂点インデックス
                    faceColors.push(currentColor, currentColor, currentColor);
                }
            }
            const colorsArray = new Float32Array(vertices.length);
            for (let i = 0; i < vertexIndices.length; i++) {
                const idx = vertexIndices[i];
                colorsArray[idx * 3 + 0] = faceColors[i].r;
                colorsArray[idx * 3 + 1] = faceColors[i].g;
                colorsArray[idx * 3 + 2] = faceColors[i].b;
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
            geometry.setIndex(vertexIndices);
            geometry.computeVertexNormals();
            const material = new THREE.MeshBasicMaterial({ vertexColors: true });
            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
        }

        addSceneFromObjFile("./src/tri_mat.obj", "./src/tri_mat.mtl");

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
