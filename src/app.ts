import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";

class ThreeJSContainer {
    private scene!: THREE.Scene;
    private world!: CANNON.World;

    // ボウリングレーンの寸法定数
    private readonly LANE_WIDTH = 1.05; // レーン幅(m)
    private readonly LANE_LENGTH = 18.29; // ファールゾーンからヘッドピンまでの長さ(m)
    private readonly PIN_DECK_DEPTH = 2.0; // ピンデッキ部分の奥行き(m)
    private readonly GUTTER_WIDTH = 0.23; // ガーター幅(m)

    // ボウリングピンの寸法定数
    private readonly PIN_HEIGHT = 0.381; // ピンの高さ(m)
    private readonly PIN_SPACING = 0.305; // ピンの間隔(m)
    private readonly PIN_MASS = 0.5; // ピンの質量(kg)
    private readonly PIN_CENTER_HEIGHT = 0.16; // ピンの重心とみなす高さ(底からの距離、m)

    // 側壁の寸法定数
    private readonly WALL_HEIGHT = 0.5 // 壁の高さ(m)
    private readonly WALL_THICKNESS = 0.05 // 壁の厚み(m)

    // ボールの寸法定数
    private readonly BALL_RADIUS = 0.108; // ボールの半径(m)
    private readonly BALL_MASS = 7.0; // ボールの質量(kg)

    // 物理演算用の固定タイムステップ
    private readonly FIXED_TIME_STEP = 1 / 60; // 60fps相当の固定タイムステップ
    private readonly MAX_SUB_STEPS = 3; // 1フレームあたりの最大サブステップ数

    // メッシュと物理ボディの対応を紐づけて管理するペア
    private pinPairs: { mesh: THREE.Mesh; body: CANNON.Body }[] = [];
    private ballPair!: { mesh: THREE.Mesh; body: CANNON.Body };

    // 物理マテリアルの定義(摩擦・反発係数を設定するために使用)
    private laneMaterial = new CANNON.Material("laneMaterial");
    private gutterMaterial = new CANNON.Material("gutterMaterial");
    private pinMaterial = new CANNON.Material("pinMaterial");
    private ballMaterial = new CANNON.Material("ballMaterial");
    private wallMaterial = new CANNON.Material("wallMaterial");

    // 投球関連の定数
    private readonly THROW_SPEED_DEFAULT = 9.0; // 初速度の初期値(m/s)
    private readonly THROW_ANGLE_RANGE = 2.5; // 投球角度の範囲(度)
    private readonly SPIN_STRENGTH_MAX = 90.0;     // Y軸回転の範囲(rad/s)

    // カメラ関連の定数
    private readonly FIXED_CAMERA_HEIGHT = 1.2; // 定点カメラの高さ(m)
    private readonly FIXED_CAMERA_Z_OFFSET = 2.5; // ファウルラインから手前側への距離(m)

    // ボタンのDOM要素
    private throwButton!: HTMLButtonElement; // 投球ボタンのDOM要素
    private throwAngleInput!: HTMLInputElement; // 投球角度のスライダーのDOM要素
    private spinInput!: HTMLInputElement; // 投球回転のスライダーのDOM要素
    private pinCountDisplay!: HTMLDivElement; // 倒れたピン数を表示するラベルのDOM要素

    // 全ボディが静止状態かどうかのフラグ
    private allAsleep: boolean = false;

    // ピン・ボールの初期位置をリセット用に保持
    private pinInitialPositions: THREE.Vector3[] = [];
    private readonly BALL_INITIAL_POSITION = new THREE.Vector3(0, 0.108, 0.3);

    // ボールがレーンから落ちたとみなすY座標(落下判定に用いる)
    private readonly FALL_THRESHOLD_Y = -2.0;

    // 静止判定用のタイマーと閾値
    private stillnessTimer: number = 0;
    private readonly STILLNESS_SPEED_THRESHOLD = 0.1; // この速度以下ならほぼ静止とみなす
    private readonly STILLNESS_DURATION = 0.55; // この秒数、静止し続けたら終了と判定

    // 投球処理用の関数: GUIで指定された角度・回転と、固定の初速度でボールに速度・角速度を与える
    private throwBall = () => {
        const body = this.ballPair.body;

        // 初速度は固定値を使用する
        const throwSpeed = this.THROW_SPEED_DEFAULT;

        // GUIで指定された角度を使用する
        const angleDeg = Number(this.throwAngleInput.value);
        const angleRad = THREE.MathUtils.degToRad(angleDeg);

        // 進行方向はマイナスZ方向(奥、ピン側)が基準
        // 角度分だけX方向にも速度成分を持たせる
        const vx = Math.sin(angleRad) * throwSpeed;
        const vz = -Math.cos(angleRad) * throwSpeed;

        body.velocity.set(vx, 0, vz);

        // GUIで指定された回転を使用する
        const angularY = Number(this.spinInput.value);

        body.angularVelocity.set(0, angularY, 0);

        // スリープ状態のままだと速度を与えても動かないため、明示的に起こす
        body.wakeUp();
    }

    // 側壁の物理ボディーを作成
    private createSideWallBodies = () => {
        const totalDepth = this.LANE_LENGTH + this.PIN_DECK_DEPTH;
        const shape = new CANNON.Box(
            new CANNON.Vec3(this.WALL_THICKNESS / 2, this.WALL_HEIGHT / 2, totalDepth / 2)
        );

        // ガーターのさらに外側に配置
        const offsetX = this.LANE_WIDTH / 2 + this.GUTTER_WIDTH + this.WALL_THICKNESS / 2;

        const bodyLeft = new CANNON.Body({ mass: 0, shape: shape, material: this.wallMaterial });
        bodyLeft.position.set(-offsetX, this.WALL_HEIGHT / 2 - 0.06, -totalDepth / 2);
        this.world.addBody(bodyLeft);

        const bodyRight = new CANNON.Body({ mass: 0, shape: shape, material: this.wallMaterial });
        bodyRight.position.set(offsetX, this.WALL_HEIGHT / 2 - 0.06, -totalDepth / 2);
        this.world.addBody(bodyRight);
    }

    // 側壁のメッシュを作成
    private createSideWalls = () => {
        const totalDepth = this.LANE_LENGTH + this.PIN_DECK_DEPTH;
        const geometry = new THREE.BoxGeometry(this.WALL_THICKNESS, this.WALL_HEIGHT, totalDepth);
        const material = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

        const offsetX = this.LANE_WIDTH / 2 + this.GUTTER_WIDTH + this.WALL_THICKNESS / 2;

        const wallLeft = new THREE.Mesh(geometry, material);
        wallLeft.position.set(-offsetX, this.WALL_HEIGHT / 2 - 0.06, -totalDepth / 2);
        wallLeft.receiveShadow = true;
        wallLeft.castShadow = true;
        this.scene.add(wallLeft);

        const wallRight = new THREE.Mesh(geometry.clone(), material);
        wallRight.position.set(offsetX, this.WALL_HEIGHT / 2 - 0.06, -totalDepth / 2);
        wallRight.receiveShadow = true;
        wallRight.castShadow = true;
        this.scene.add(wallRight);
    }


    constructor() {

    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x101820));
        renderer.shadowMap.enabled = true; //シャドウマップを有効にする

        // 定点カメラの設定(レーンを正面から見通す固定位置)
        const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
        camera.position.set(
            0,
            this.FIXED_CAMERA_HEIGHT,
            this.FIXED_CAMERA_Z_OFFSET
        );
        // レーンの奥、ピンの位置あたりを注視点にする
        const lookAtTarget = new THREE.Vector3(0, 0.2, -this.LANE_LENGTH);
        camera.lookAt(lookAtTarget);

        // ズームのみ可能なOrbitControls(回転・パンは無効化し、視点は固定のまま)
        const orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.target.copy(lookAtTarget);
        orbitControls.enableRotate = false;
        orbitControls.enablePan = false;
        orbitControls.enableZoom = true;
        orbitControls.minDistance = 1.5;    // これ以上は寄れない
        orbitControls.maxDistance = 15;     // これ以上は離れられない
        orbitControls.update();

        const timer = new THREE.Timer();

        this.createScene();
        this.createPhysicsWorld();
        this.createThrowControls(renderer.domElement.parentElement);
        this.createPinCountDisplay(renderer.domElement.parentElement);
        this.createThrowButton(renderer.domElement.parentElement);

        // 毎フレームのupdateを呼んで，render
        // reqestAnimationFrame により次フレームを呼ぶ
        const render: FrameRequestCallback = (_time) => {
            timer.update();
            const delta = timer.getDelta();

            // const flyControls = new FlyControls(camera, renderer.domElement);
            // flyControls.update(delta); // FlyControlsの更新(カメラ移動)

            // 物理演算のワールドを固定タイムステップで更新
            this.world.step(this.FIXED_TIME_STEP, delta, this.MAX_SUB_STEPS);

            // 物理演算の結果をThree.jsメッシュに反映
            this.syncMeshesWithBodies();

            // 全ボディの静止状態を毎フレームチェックする
            this.checkAllsleep(delta);
            this.updatePinCountDisplay();

            renderer.render(this.scene, camera);
            requestAnimationFrame(render);

        }
        requestAnimationFrame(render);

        renderer.domElement.style.position = "fixed";
        renderer.domElement.style.left = "50%";
        renderer.domElement.style.top = "50%";
        renderer.domElement.style.transform = "translate(-50%, -50%)";
        renderer.domElement.style.display = "block";
        renderer.domElement.style.margin = "0";
        return renderer.domElement;
    }

    // 投球ボタンの作成
    private createThrowButton = (parent: HTMLElement | null) => {
        const button = document.createElement("button");
        button.textContent = "ボールを投げる";
        button.style.position = "absolute";
        button.style.left = "50%";
        button.style.bottom = "24px";
        button.style.transform = "translateX(-50%)";
        button.style.width = "240px";
        button.style.height = "72px";
        button.style.padding = "0 8px";
        button.style.fontSize = "24px";
        button.style.fontWeight = "700";
        button.style.cursor = "pointer";
        button.style.display = "block";
        button.style.zIndex = "10";
        button.style.color = "#ffffff";
        button.style.background = "rgb(214, 8, 8)";
        button.style.border = "1px solid rgba(255, 255, 255, 0.25)";
        button.style.borderRadius = "8px";
        button.style.backdropFilter = "blur(6px)";
        button.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.35)";
        button.style.boxSizing = "border-box";

        button.addEventListener("click", () => {
            this.resetAndThrow();
        });

        if (parent) {
            parent.style.position = "relative";
            parent.appendChild(button);
        } else {
            document.body.appendChild(button);
        }

        this.throwButton = button;
    }

    // 投球前に角度と回転を選ぶためのGUIを作成
    private createThrowControls = (parent: HTMLElement | null) => {
        const panel = document.createElement("div");
        panel.style.position = "fixed";
        panel.style.top = "24px";
        panel.style.left = "24px";
        panel.style.zIndex = "10";
        panel.style.minWidth = "240px";
        panel.style.padding = "16px";
        panel.style.borderRadius = "12px";
        panel.style.background = "rgba(16, 24, 32, 0.82)";
        panel.style.color = "#ffffff";
        panel.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.35)";
        panel.style.backdropFilter = "blur(6px)";

        const title = document.createElement("div");
        title.textContent = "投球設定";
        title.style.fontSize = "16px";
        title.style.fontWeight = "700";
        title.style.marginBottom = "12px";
        panel.appendChild(title);

        const createRow = (labelText: string) => {
            const row = document.createElement("div");
            row.style.marginBottom = "12px";

            const label = document.createElement("label");
            label.style.display = "block";
            label.style.marginBottom = "6px";
            label.style.fontSize = "14px";
            row.appendChild(label);

            const value = document.createElement("span");
            value.style.float = "right";
            value.style.fontVariantNumeric = "tabular-nums";
            label.appendChild(document.createTextNode(labelText));
            label.appendChild(value);

            const input = document.createElement("input");
            input.type = "range";
            input.style.width = "100%";
            row.appendChild(input);

            return { row, value, input };
        };

        const angleRow = createRow("投球角度 (度)");
        angleRow.input.min = (-this.THROW_ANGLE_RANGE).toString();
        angleRow.input.max = this.THROW_ANGLE_RANGE.toString();
        angleRow.input.step = "0.1";
        angleRow.input.value = "0";
        angleRow.value.textContent = angleRow.input.value;
        angleRow.input.addEventListener("input", () => {
            angleRow.value.textContent = angleRow.input.value;
        });
        panel.appendChild(angleRow.row);


        const spinRow = createRow("回転 (rad/s)");
        spinRow.input.min = (-this.SPIN_STRENGTH_MAX).toString();
        spinRow.input.max = this.SPIN_STRENGTH_MAX.toString();
        spinRow.input.step = "0.1";
        spinRow.input.value = "10";
        spinRow.value.textContent = spinRow.input.value;
        spinRow.input.addEventListener("input", () => {
            spinRow.value.textContent = spinRow.input.value;
        });
        panel.appendChild(spinRow.row);

        this.throwAngleInput = angleRow.input;
        this.spinInput = spinRow.input;

        if (parent) {
            parent.style.position = "relative";
            parent.appendChild(panel);
        } else {
            document.body.appendChild(panel);
        }
    }

    // 倒れたピン数を表示するラベルを作成
    private createPinCountDisplay = (parent: HTMLElement | null) => {
        const display = document.createElement("div");
        display.style.position = "fixed";
        display.style.top = "24px";
        display.style.right = "24px";
        display.style.zIndex = "10";
        display.style.minWidth = "180px";
        display.style.padding = "14px 16px";
        display.style.borderRadius = "12px";
        display.style.background = "rgba(16, 24, 32, 0.82)";
        display.style.color = "#ffee00";
        display.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.35)";
        display.style.backdropFilter = "blur(6px)";
        display.style.fontSize = "15px";
        display.style.fontWeight = "700";
        display.style.textAlign = "center";

        if (parent) {
            parent.appendChild(display);
        } else {
            document.body.appendChild(display);
        }

        this.pinCountDisplay = display;
        this.updatePinCountDisplay();
    }

    // 倒れたピン数を計算して表示を更新する
    private updatePinCountDisplay = () => {
        const knockedDownCount = this.pinPairs.filter(({ body }) => this.isPinKnockedDown(body)).length;
        const totalCount = this.pinPairs.length;

        this.pinCountDisplay.textContent = `倒れたピン数: ${knockedDownCount} / ${totalCount}`;
    }

    // ピンが倒れているかを判定する
    private isPinKnockedDown = (body: CANNON.Body) => {
        const upVector = new CANNON.Vec3(0, 1, 0);
        const worldUpVector = new CANNON.Vec3();
        body.quaternion.vmult(upVector, worldUpVector);

        return worldUpVector.y < 0.7 || body.position.y < this.PIN_CENTER_HEIGHT * 0.6;
    }

    // レーン外に落ちて自由落下し続けているボールを強制的に停止させる
    private handleBallFall = () => {
        if (this.ballPair.body.position.y < this.FALL_THRESHOLD_Y) {
            this.ballPair.body.velocity.set(0, 0, 0);
            this.ballPair.body.angularVelocity.set(0, 0, 0);
            this.ballPair.body.sleep();
        }
    }

    // 全ボディー(ボール+ピン)の速度を見て、一定時間「ほぼ静止」が続いたら終了と判定し、ボタンを表示する
    private checkAllsleep = (delta: number) => {
        // レーン外に落ちて自由落下し続けているボールがあれば、強制停止させる
        this.handleBallFall();

        const ballSpeed = this.ballPair.body.velocity.length();
        const pinSpeeds = this.pinPairs.map(({ body }) => body.velocity.length());
        const maxSpeed = Math.max(ballSpeed, ...pinSpeeds);

        if (maxSpeed < this.STILLNESS_SPEED_THRESHOLD) {
            // 全体が「ほぼ静止」の間、タイマーを進める
            this.stillnessTimer += delta;
        } else {
            // どれかが動いていたらタイマーをリセット
            this.stillnessTimer = 0;
        }

        const nowAllAsleep = this.stillnessTimer >= this.STILLNESS_DURATION;

        if (nowAllAsleep && !this.allAsleep) {
            this.throwButton.style.display = "block";
        }

        this.allAsleep = nowAllAsleep;
    }

    // ピン・ボールを初期位置に戻し、ボタンを隠して再投球する
    private resetAndThrow = () => {
        this.throwButton.style.display = "none";

        // ピンを初期位置・初期姿勢に戻す
        this.pinPairs.forEach(({ body }, index) => {
            const initialPos = this.pinInitialPositions[index];
            body.position.set(initialPos.x, initialPos.y + this.PIN_CENTER_HEIGHT, initialPos.z);
            body.quaternion.set(0, 0, 0, 1);
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
            body.wakeUp();
        });

        this.ballPair.body.position.set(
            this.BALL_INITIAL_POSITION.x,
            this.BALL_INITIAL_POSITION.y,
            this.BALL_INITIAL_POSITION.z
        );
        this.ballPair.body.quaternion.set(0, 0, 0, 1);
        this.ballPair.body.velocity.set(0, 0, 0);
        this.ballPair.body.angularVelocity.set(0, 0, 0);
        this.ballPair.body.wakeUp();

        this.allAsleep = false;
        this.stillnessTimer = 0; // 静止判定タイマーもリセット

        this.throwBall();
    }

    // 物理演算のワールドを作成し、レーン・ガーター・バックボード・ピン・ボールの物理ボディを生成する
    private createPhysicsWorld = () => {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0), // 重力加速度を設定
        });

        // ピンの全て倒れた状態を検出するために、ワールド全体でスリープを許可する
        this.world.allowSleep = true;

        // 貫通対策のためsolverの反復回数を標準より引き上げる
        (this.world.solver as CANNON.GSSolver).iterations = 15;

        // レーン・ガーター・バックボードの物理ボディを作成
        this.createLaneBody();
        this.createGutterBodies();
        this.createBackboardBody();
        this.createSideWallBodies();

        // ピン・ボールの物理ボディを、既存のThree.jsメッシュと紐付けて生成
        this.createPinBodies();
        this.createBallBody();

        // 接触時の摩擦・反発係数をペアごとに設定
        this.setupContactMaterials();
    }

    // レーンの物理ボディと既存のThree.jsメッシュを紐付けて生成
    private createLaneBody = () => {
        const totalDepth = this.LANE_LENGTH + this.PIN_DECK_DEPTH;
        const shape = new CANNON.Box(
            new CANNON.Vec3(this.LANE_WIDTH / 2, 0.025, totalDepth / 2)
        );
        const body = new CANNON.Body({ mass: 0, shape: shape, material: this.laneMaterial });
        body.position.set(0, -0.025, -totalDepth / 2);
        this.world.addBody(body);
    }

    // ガーターの物理ボディと既存のThree.jsメッシュを紐付けて生成
    private createGutterBodies = () => {
        const totalDepth = this.LANE_LENGTH + this.PIN_DECK_DEPTH;
        const shape = new CANNON.Box(
            new CANNON.Vec3(this.GUTTER_WIDTH / 2, 0.04, totalDepth / 2)
        );
        const offsetX = (this.LANE_WIDTH + this.GUTTER_WIDTH) / 2;

        const bodyLeft = new CANNON.Body({ mass: 0, shape: shape, material: this.gutterMaterial });
        bodyLeft.position.set(-offsetX, -0.06, -totalDepth / 2);
        this.world.addBody(bodyLeft);

        const bodyRight = new CANNON.Body({ mass: 0, shape: shape, material: this.gutterMaterial });
        bodyRight.position.set(offsetX, -0.06, -totalDepth / 2);
        this.world.addBody(bodyRight);
    }

    // バックボードの物理ボディと既存のThree.jsメッシュを紐付けて生成
    private createBackboardBody = () => {
        const totalWidth = this.LANE_WIDTH + this.GUTTER_WIDTH * 2;
        const totalDepth = this.LANE_LENGTH + this.PIN_DECK_DEPTH;
        const backboardThickness = 0.1;
        const overlap = 0.05; // レーンと重なる量(隙間防止用の余裕)
        const shape = new CANNON.Box(
            new CANNON.Vec3(totalWidth / 2, 0.8, 0.05)
        );
        const body = new CANNON.Body({ mass: 0, shape: shape });
        body.position.set(0, 0.75, -totalDepth - backboardThickness / 2 + overlap);
        this.world.addBody(body);
    }

    // ピンの物理ボディと既存のThree.jsメッシュを紐付けて生成
    // ボディーの原点(重心)はピンの底面ではなく、PIN_CENTER_HEIGHTの高さに設定
    private createPinBodies = () => {
        this.pinPairs.forEach(({ mesh }, index) => {
            // 円柱部分: ピンの胴体〜首元をおおまかに覆う
            const cylinderShape = new CANNON.Cylinder(0.03, 0.045, this.PIN_HEIGHT * 0.75, 12);

            // 球部分: ピンの頭部(丸い部分)を覆う
            const sphereShape = new CANNON.Sphere(0.038);

            const body = new CANNON.Body({
                mass: this.PIN_MASS,
                material: this.pinMaterial,
            });

            // 各形状は重心(PIN_CENTER_HEIGHT)からの相対位置で配置する
            const cylinderOffsetY = this.PIN_HEIGHT * 0.375 - this.PIN_CENTER_HEIGHT;
            const sphereOffsetY = this.PIN_HEIGHT * 0.9 - this.PIN_CENTER_HEIGHT;

            body.addShape(cylinderShape, new CANNON.Vec3(0, cylinderOffsetY, 0));
            body.addShape(sphereShape, new CANNON.Vec3(0, sphereOffsetY, 0));

            // ボディーの原点は「重心の高さ」に設定(メッシュの底面位置 + PIN_CENTER_HEIGHT)
            body.position.set(
                mesh.position.x,
                mesh.position.y + this.PIN_CENTER_HEIGHT,
                mesh.position.z
            );

            body.angularDamping = 0.15; // ピンが倒れた後の回転を減衰させるために設定
            body.linearDamping = 0.05; // ピンが倒れた後の転がりを減衰させるために設定
            body.allowSleep = true; // 倒れて静止したピンはスリープ状態にして計算負荷を減らす
            body.sleepSpeedLimit = 0.25; // 微振動が残っていても早めにスリープへ移行させる
            body.sleepTimeLimit = 0.25; // スリープ状態に入るまでの時間の閾値を少し短くする

            this.world.addBody(body);
            this.pinPairs[index].body = body;

            // リセット用に、メッシュ生成時点の初期位置を記録する
            this.pinInitialPositions.push(mesh.position.clone());
        });
    }

    // ボールの物理ボディの作成と既存のThree.jsメッシュとの紐付けて生成
    private createBallBody = () => {
        const shape = new CANNON.Sphere(this.BALL_RADIUS);
        const body = new CANNON.Body({
            mass: this.BALL_MASS,
            shape: shape,
            material: this.ballMaterial,
        });
        body.position.set(
            this.ballPair.mesh.position.x,
            this.ballPair.mesh.position.y,
            this.ballPair.mesh.position.z
        );

        // 摩擦がほぼゼロのレーン上でも自然に減速して静止できるよう、わずかな減衰を追加
        body.linearDamping = 0.04;
        body.angularDamping = 0.04;

        body.allowSleep = true; // ボールが静止した場合はスリープ状態にして計算負荷を減らす
        body.sleepSpeedLimit = 0.18; // スリープ状態に入る速度の閾値を設定
        body.sleepTimeLimit = 0.35; // スリープ状態に入るまでの時間の閾値を設定

        this.world.addBody(body);
        this.ballPair.body = body;
    }

    // 各接触ペアの摩擦・反発係数を設定
    private setupContactMaterials = () => {

        // レーン~ボール: オイルレーンの滑りを表現するために摩擦を低めに設定
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.laneMaterial, this.ballMaterial,
            { friction: 0.015, restitution: 0.08 }
        ));

        // レーン~ピン: ピンの土台の安定感のために摩擦は中程度に設定
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.laneMaterial, this.pinMaterial,
            { friction: 0.16, restitution: 0.06 }
        ));

        // ガーター~ボール: 落ちたら転がりやすいよう摩擦は高めに設定
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.gutterMaterial, this.ballMaterial,
            { friction: 0.6, restitution: 0.05 }
        ));

        // ピン~ピン: 衝突で弾き合う挙動
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.pinMaterial, this.pinMaterial,
            { friction: 0.1, restitution: 0.20 }
        ));

        // ピン~ボール: ボールが当たった時にピンを弾き飛ばす挙動
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.pinMaterial, this.ballMaterial,
            { friction: 0.1, restitution: 0.25 }
        ));

        // 壁~ボール: 跳ね返りを抑え、摩擦を高めにして早く減速させる
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.wallMaterial, this.ballMaterial,
            { friction: 0.5, restitution: 0.02 }
        ));
    }

    // 物理演算の結果をThree.jsメッシュの位置・回転に反映
    // ピンはボディーの原点(重心)とメッシュの原点(底面)がズレているため、オフセット補正して同期する
    private syncMeshesWithBodies = () => {
        const localBottomOffset = new CANNON.Vec3(0, -this.PIN_CENTER_HEIGHT, 0);
        const worldOffset = new CANNON.Vec3();

        this.pinPairs.forEach(({ mesh, body }) => {

            // ボディーの重心位置からメッシュの底面位置へのオフセットを計算
            body.quaternion.vmult(localBottomOffset, worldOffset);

            mesh.position.set(
                body.position.x + worldOffset.x,
                body.position.y + worldOffset.y,
                body.position.z + worldOffset.z
            );

            // ボディーの回転をメッシュに反映
            mesh.quaternion.set(
                body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w
            );
        });

        //　ボールをボディーの位置・回転に同期
        this.ballPair.mesh.position.set(
            this.ballPair.body.position.x,
            this.ballPair.body.position.y,
            this.ballPair.body.position.z
        );
        this.ballPair.mesh.quaternion.set(
            this.ballPair.body.quaternion.x,
            this.ballPair.body.quaternion.y,
            this.ballPair.body.quaternion.z,
            this.ballPair.body.quaternion.w
        );
    }


    // シーンの作成(全体で1回)
    private createScene = () => {
        this.scene = new THREE.Scene();

        // // グリッド表示
        // const gridHelper = new THREE.GridHelper(20, 20);
        // this.scene.add(gridHelper);

        // // 軸表示
        // const axesHelper = new THREE.AxesHelper(5);
        // this.scene.add(axesHelper);

        // ライトの設定(ピンの真上にスポットライトを置く)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.10); // 環境光を弱めに設定
        this.scene.add(ambientLight);

        // スポットライトの設定(ピンの真上に配置)
        const spotlight = new THREE.SpotLight(0xfff3d6, 4.0, 50, Math.PI / 3, 0.7, 0.1); // 色, 強度, 距離, 角度, ペンブラ, 減衰
        spotlight.castShadow = true;
        spotlight.position.set(0, 8, -16.5);

        // スポットライトのターゲットをピンの位置に設定
        const spotlightTarget = new THREE.Object3D();
        spotlightTarget.position.set(0, 0.35, -this.LANE_LENGTH);
        this.scene.add(spotlightTarget);
        spotlight.target = spotlightTarget;

        this.scene.add(spotlight);

        // レーン・ガーター・バックボードの生成
        this.createLane();
        this.createGutters();
        this.createBackboard();
        this.createSideWalls();

        // ボウリングピンの生成
        this.createPins();

        // ボウリングボールの生成
        this.createBall();

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
    // レーンの作成
    private createLane = () => {
        const totalDepth = this.LANE_LENGTH + this.PIN_DECK_DEPTH;
        const geometry = new THREE.BoxGeometry(this.LANE_WIDTH, 0.05, totalDepth);
        const material = new THREE.MeshStandardMaterial({ color: 0xd2a679 });
        const lane = new THREE.Mesh(geometry, material);

        // ファウルラインはz=0と設定、マイナスZ方向にレーンが伸びる
        lane.position.set(0, -0.025, -totalDepth / 2);
        lane.receiveShadow = true;
        this.scene.add(lane);
    }

    // ガーターの作成
    private createGutters = () => {
        const totalDepth = this.LANE_LENGTH + this.PIN_DECK_DEPTH;
        const geometry = new THREE.BoxGeometry(this.GUTTER_WIDTH, 0.08, totalDepth);
        const material = new THREE.MeshStandardMaterial({ color: 0x555555 });

        const offsetX = (this.LANE_WIDTH + this.GUTTER_WIDTH) / 2;

        // 左ガーター
        const gutterLeft = new THREE.Mesh(geometry, material);
        gutterLeft.position.set(-offsetX, -0.06, -totalDepth / 2);
        gutterLeft.receiveShadow = true;
        this.scene.add(gutterLeft);

        // 右ガーター
        const gutterRight = new THREE.Mesh(geometry.clone(), material);
        gutterRight.position.set(offsetX, -0.06, -totalDepth / 2);
        gutterRight.receiveShadow = true;
        this.scene.add(gutterRight);
    }

    // バックボードの作成
    private createBackboard = () => {
        const totalWidth = this.LANE_WIDTH + this.GUTTER_WIDTH * 2;
        const backboardThickness = 0.1;
        const overlap = 0.05; // レーンと重なる量(隙間防止用の余裕)
        const geometry = new THREE.BoxGeometry(totalWidth, 1.6, 0.1);
        const material = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const backboard = new THREE.Mesh(geometry, material);

        const totalDepth = this.LANE_LENGTH + this.PIN_DECK_DEPTH;
        backboard.position.set(0, 0.75, -totalDepth - backboardThickness / 2 + overlap);
        backboard.receiveShadow = true;
        this.scene.add(backboard);
    }

    // ピン1本分のジオメトリを作成
    private createPinGeometry = () => {
        const points: THREE.Vector2[] = [
            new THREE.Vector2(0.000, 0.000),
            new THREE.Vector2(0.045, 0.000),
            new THREE.Vector2(0.052, 0.020),
            new THREE.Vector2(0.060, 0.060),
            new THREE.Vector2(0.061, 0.100),
            new THREE.Vector2(0.058, 0.140),
            new THREE.Vector2(0.048, 0.190),
            new THREE.Vector2(0.036, 0.240),
            new THREE.Vector2(0.028, 0.280),
            new THREE.Vector2(0.026, 0.310),
            new THREE.Vector2(0.032, 0.335),
            new THREE.Vector2(0.038, 0.352),
            new THREE.Vector2(0.039, 0.362),
            new THREE.Vector2(0.036, 0.370),
            new THREE.Vector2(0.028, 0.377),
            new THREE.Vector2(0.016, 0.380),
            new THREE.Vector2(0.000, this.PIN_HEIGHT),
        ];
        return new THREE.LatheGeometry(points, 16);
    }

    // ピンに対してのテクスチャを作成
    private createPinTexture = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("キャンパスのコンテキストを取得できませんでした。");
        }

        // ピンの白い部分
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 赤いラインを描画
        ctx.fillStyle = "#ff0000";
        const lineHeight = 10; // ラインの高さ
        const lineYPositions = [128, 148]; // ラインのY座標
        lineYPositions.forEach((y) => {
            ctx.fillRect(0, y - lineHeight / 2, canvas.width, lineHeight);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    // ピン1本分のメッシュを作成
    private createPinMesh = () => {
        const geometry = this.createPinGeometry();
        const texture = this.createPinTexture();
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const pin = new THREE.Mesh(geometry, material);
        pin.castShadow = true;
        pin.receiveShadow = true;
        return pin;
    }

    // ピンの配置を作成
    private createPins = () => {
        // 先端のピンの位置
        const headPinZ = -this.LANE_LENGTH;
        const rowSpacing = this.PIN_SPACING * Math.sqrt(3) / 2; // 行間の奥行き距離（三角形の高さ）

        // 各行でのピンの数
        const rows = [1, 2, 3, 4];

        rows.forEach((numPins, rowIndex) => {
            const z = headPinZ - rowIndex * rowSpacing;
            for (let i = 0; i < numPins; i++) {
                const x = (i - (numPins - 1) / 2) * this.PIN_SPACING;
                const pin = this.createPinMesh();
                pin.position.set(x, 0, z);
                this.scene.add(pin);

                // メッシュのみ先に登録し、ボディは createPinBodies() で後から埋める
                this.pinPairs.push({ mesh: pin, body: null as unknown as CANNON.Body });
            }
        });
    }

    // ボールのメッシュを作成
    private createBallMesh = () => {
        const geometry = new THREE.SphereGeometry(this.BALL_RADIUS, 32, 32);

        const textureLoader = new THREE.TextureLoader();
        const ballTexture = textureLoader.load("./bowling_ball_texture.png");
        ballTexture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshStandardMaterial({
            map: ballTexture,
            roughness: 0.3,   // ボウリングボール特有のツヤ感
            metalness: 0.1,
        });
        const ball = new THREE.Mesh(geometry, material);
        ball.castShadow = true;
        ball.receiveShadow = true;
        ball.name = "ball";
        return ball;
    }

    // ボールを配置（レーン中央・固定）
    private createBall = () => {
        const ball = this.createBallMesh();
        // ボールの初期位置をレーン中央・ファウルライン付近に設定
        ball.position.set(0, this.BALL_RADIUS, 0.3);
        this.scene.add(ball);

        // メッシュのみ先に登録し、ボディは createBallBody() で後から埋める
        this.ballPair = { mesh: ball, body: null as unknown as CANNON.Body };
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(1280, 720);
    document.body.appendChild(viewport);
}