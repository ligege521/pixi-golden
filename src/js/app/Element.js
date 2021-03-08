import {loaderImgs, loadAssets} from './loader';
import {TweenMax} from 'gsap/all';
import hitTestRectangle from '../util/hitTestRectangle';
/**
 * 构造函数
 */
// function Parent (id, x, y, scale, container) {
//     let that = this;
//     that.id = id;
//     that.x = x;
//     that.y = y;
//     that.scale = scale;
//     that.container = container;

//     that.get = function (type) {
//         switch (type) {
//             case 'id':
//                 return that.id;
//             case 'x':
//                 return that.x;
//             case 'y':
//                 return that.y;
//             case 'scale':
//                 return that.scale;
//             case 'container':
//                 return that.container;
//             default:
//                 break;
//         }
//     };
//     that.set = function (type, value) {
//         switch (type) {
//             case 'id':
//                 that.id = value;
//                 return that.id;
//             case 'x':
//                 that.x = value;
//                 return that.x;
//             case 'y':
//                 that.y = value;
//                 return that.y;
//             case 'scale':
//                 that.scale = value;
//                 return that.scale;
//             case 'container':
//                 that.container = value;
//                 return that.container;
//             default:
//                 break;
//         }
//     };
// }

var ElementContoller = function () {
    var _public = {};
    var _private = {};
    /*
    初始化
    */
    _private.initApp = function () {
        let winWidth = $(window).width();
        let designWidth = _public.designWidth = 750;
        let designHeight = _public.designHeight = 1624;
        _public.app = new PIXI.Application({
            width: winWidth,
            height: winWidth * (designHeight / designWidth),
            forceCanvas: true,
            backgroundColor: '0x000000',
            transparent: true, // 设置画布是否透明
            resolution: 2,  // 渲染器的分辨率
            antialias: true, // 消除锯齿
            autoResize: true    // 重置大小
        });
        _public.scale = winWidth / designWidth;

        // 添加到页面中
        $('.m-index').append(_public.app.view);

        _private.initBackground();
        _private.initProps();
        _private.addGolden();
        // 道具弹窗
        _private.showDialog();
    };

    /*
    背景
    */
    _private.initBackground = function () {
        let {background1, background2} = loaderImgs;
        let bgSprite1 = background1.sprite;
        let bgSprite2 = background2.sprite;
        bgSprite1.scale.set(_public.scale, _public.scale);
        bgSprite2.scale.set(_public.scale, _public.scale);
        bgSprite2.y = bgSprite1.height - bgSprite2.height;
        _public.app.stage.addChild(bgSprite1);
        _public.app.stage.addChild(bgSprite2);
    };

    /*
    矿车
    */
    _private.addGolden = function () {
        let {goldenCar} = loaderImgs;
        let car = goldenCar.sprite;
        // 矿车容器
        let goldenBox = new PIXI.Container();
        goldenBox.y = 170 * _public.scale;
        _public.app.stage.addChild(goldenBox);

        car.scale.set(_public.scale, _public.scale);
        car.x = 340 * _public.scale;
        goldenBox.addChild(car);
        // 添加爪子
        let hookCont = _private.initHook();
        goldenBox.addChild(hookCont);
    };

    /*
    爪子
    */
    _private.initHook = function () {
        // 爪子的属性
        let goldenHander = {
            right: true,
            left: false,
            hookSpeed: 0.01, // 旋转速度
            hookStop: true, // 是否旋转
            ropeCurrentSpeed: 1, // 初始速度
            ropeSpeed: 0.01,   // 绳子伸缩的加速度
            ropeStop: false, // 绳子是否伸缩
            ropeLength: 100,    // 绳子初始长度
            ropeMaxLength: 900,  // 最大长度
            ropeTop: false, // 绳子向上延伸
            ropeBottom: true,    // 向下延伸
            hitProp: false
        };
        // 爪子
        let {goldenHook} = loaderImgs;
        let hook = goldenHook.sprite;
        hook.anchor.set(0.5);
        hook.scale.set(_public.scale, _public.scale);
        hook.position.set(hook.width / 2, goldenHander.ropeLength / 2 + hook.height / 2);
        // 爪子容器
        let hookBox = new PIXI.Container();
        hookBox.position.set(370 * _public.scale, 148 * _public.scale);
        hookBox.addChild(hook);
        // 绳子
        let rope = new PIXI.Graphics();
        rope.beginFill(0x64371f);
        rope.drawRect(40 * _public.scale, 0, 5 * _public.scale, goldenHander.ropeLength * _public.scale);
        hookBox.addChild(rope);
        hookBox.pivot.set(hookBox.width / 2, 0);

         // 爪子旋转
        let hookAni = TweenMax.to(hookBox, 2.5, {
            startAt: {
                rotation: -0.8
            },
            rotation: 0.8,
            repeat: -1,
            ease: 'Power1.easeInOut',
            yoyo: true
        }, {rotation: -0.8});

        // 爪子伸缩
        let state = function () {};
        _public.app.ticker.add(delta => ropeLoop(delta));
        function ropeLoop (delta) {
            if (goldenHander.ropeStop) {
                state(delta);
            } else {
                _public.app.ticker.remove(delta => ropeLoop(delta));
            }
        };
        function setStatus () {
            if (!goldenHander.ropeStop) {
                state = start;
                goldenHander.ropeStop = true;
                goldenHander.ropeCurrentSpeed = 0;
            } else {
                console.log('正在抓去中');
            }
        }
        function start () {
            if (goldenHander.ropeBottom && !goldenHander.ropeTop) {
                goldExtend();
            } else if (goldenHander.ropeTop && !goldenHander.ropeBottom) {
                console.log('收缩');
                goldShorten();
            }
        };
        // console.log(_private.goldenArea.list[1].hitGrap.getGlobalPosition());
        function hit () {
            if (goldenHander.hitProp) {
                return;
            }
            for (let i = 0; i < _private.goldenArea.list.length; i++) {
                let prop = _private.goldenArea.list[i];
                if (hitTestRectangle(hook, prop.hitGrap) && prop.visible) {
                    console.log(prop.hitGrap.getGlobalPosition(), hook.getGlobalPosition(), i, prop);
                    prop.sprite.visible = false;
                    prop.visible = false;
                    goldenHander.hitProp = true;
                    backHook();
                    break;
                }
            };
        };
        function goldExtend () {
            // 钩子暂停摇摆
            hookAni.pause();
            goldenHander.ropeCurrentSpeed += goldenHander.ropeSpeed;
            rope.height += goldenHander.ropeCurrentSpeed;
            hook.y += goldenHander.ropeCurrentSpeed;
            hit();
            let gloPosition = hook.getGlobalPosition();
            if ((gloPosition.x * _public.scale) > (_public.designWidth / 2 - hookBox.width / 2) || (gloPosition.x * _public.scale) < 0 || rope.height > (goldenHander.ropeMaxLength * _public.scale)) {
                console.log('aaaaa', rope.height, goldenHander.ropeMaxLength * _public.scale);
                backHook();
            }
        };
        function backHook () {
            goldenHander.ropeBottom = false;
            goldenHander.ropeTop = true;
            goldenHander.ropeSpeed = 0.1;
            goldenHander.ropeCurrentSpeed = 1;
        };
        function goldShorten () {
            goldenHander.ropeCurrentSpeed -= goldenHander.ropeSpeed;
            rope.height += goldenHander.ropeCurrentSpeed;
            hook.y += goldenHander.ropeCurrentSpeed;
            if (rope.height <= goldenHander.ropeLength * _public.scale) {
                goldenHander.ropeBottom = true;
                goldenHander.ropeTop = false;
                // 伸缩状态重置
                goldenHander.ropeStop = false;
                // 抓取状态重置
                goldenHander.hitProp = false;
                hookAni.play();
            }
        };
        $('.m-index')[0].addEventListener('touchstart', setStatus);
        return hookBox;
    };
    /*
    *初始化道具
    */
    _private.goldenArea = {
        row: 3,
        column: 4, // 道具布局区域长宽
        initWidth: 720,
        initHeight: 680,
        list: [], // 触碰到的元素序号
        hitIndex: -1
    };
    _private.initProps = function () {
        let propsContainer = new PIXI.Container();
        propsContainer.y = 100;
        _public.app.stage.addChild(propsContainer);
        let goldenArea = _private.goldenArea;
        let {boom, gold1, gold2, gold3, gold4} = loaderImgs;
        // 上下位移的值
        let offsetX = (_public.designWidth - goldenArea.initWidth) / 2;
        let offsetY = 360;
        // 格子总数
        let sum = goldenArea.row * goldenArea.column;
        // 容器宽度
        let containerWidth = goldenArea.initWidth / goldenArea.column;
        // 容器高度
        let containerHeight = goldenArea.initHeight / goldenArea.row;
        for (var i = 0; i < sum; i++) {
            let rowIndex = parseInt(i / goldenArea.column, 10);
            let columnIndex = i % goldenArea.column;

            let x = offsetX + columnIndex * containerWidth;
            let y = offsetY + rowIndex * containerHeight;

            // let graphics = new PIXI.Graphics();
            // graphics.lineStyle(2, 0xFF3300, 1);
            // graphics.drawRect(x * _public.scale, y * _public.scale, containerWidth * _public.scale, containerHeight * _public.scale);
            // graphics.endFill();

            let ranNum = Math.floor(Math.random() * 6);
            let sprite;
            let type;

            switch (ranNum) {
                case 0:
                    sprite = new PIXI.Sprite(PIXI.Texture.fromImage(boom.url));
                    type = 'boom';
                    break;
                case 1:
                    sprite = new PIXI.Sprite(PIXI.Texture.fromImage(gold1.url));
                    type = 'gold1';
                    break;
                case 2:
                    sprite = new PIXI.Sprite(PIXI.Texture.fromImage(gold2.url));
                    type = 'gold2';
                    break;
                case 3:
                    sprite = new PIXI.Sprite(PIXI.Texture.fromImage(gold3.url));
                    type = 'gold3';
                    break;
                case 4:
                    sprite = new PIXI.Sprite(PIXI.Texture.fromImage(gold4.url));
                    type = 'gold4';
                    break;
                case 5:
                    sprite = new PIXI.Sprite(PIXI.Texture.fromImage(boom.url));
                    type = 'boom';
                    break;
                default:
                    break;
            }
            sprite.x = x * _public.scale + (Math.random() * (containerWidth / 2) * _public.scale);
            sprite.y = y * _public.scale + (Math.random() * (containerHeight / 2) * _public.scale);
            sprite.scale.set(_public.scale);

            // 道具的碰撞检测区域
            let hitGrap = new PIXI.Graphics();
            // hitGrap.lineStyle(2, 0x009966, 1);
            hitGrap.drawRect(0, 0, 100 * _public.scale, 100 * _public.scale);
            hitGrap.x = sprite.x;
            hitGrap.y = sprite.y;
            hitGrap.endFill();
            propsContainer.addChild(hitGrap);

            propsContainer.addChild(sprite);

            // 道具列表
            _private.goldenArea.list.push({
                type,
                sprite,
                hitGrap,
                visible: true
            });
        }
    };
    /*
    *奖励弹框
    */
    _private.showDialog = function () {
        // 弹出盒子
        let dialogBox = new PIXI.Container();
        // 黑色蒙层
        let mesk = new PIXI.Graphics();
        mesk.beginFill(0x000000);
        mesk.drawRect(0, 0, _public.app.stage.width, _public.app.stage.height);
        mesk.alpha = 0.5;
        mesk.endFill();
        dialogBox.addChild(mesk);
        let {boom, dialogBoom} = loaderImgs;
        // 晃动
        let shakBoom = new PIXI.Sprite(PIXI.Texture.fromImage(boom.url));
        shakBoom.x = _public.app.stage.width / 2;
        shakBoom.y = _public.app.stage.height / 2 - 100;
        shakBoom.anchor.set(0.5);
        // 出现元素
        dialogBoom.sprite.visible = false;
        dialogBoom.sprite.alpha = 0;
        dialogBoom.sprite.scale.set(_public.scale);
        dialogBoom.sprite.anchor.set(0.5);
        dialogBoom.sprite.position.set(_public.app.stage.width / 2, _public.app.stage.height / 2 - 100);
        TweenMax.to(shakBoom, 0.1, {
            repeat: 10,
            x: shakBoom.x + (5 + Math.random() * 5),
            y: shakBoom.y + (5 + Math.random() * 5),
            rotation: -(Math.random()) * 0.5,
            ease: 'Expo.easeInOut',
            delay: 0.1,
            onComplete: function () {
                TweenMax.to(shakBoom, 0.8, {
                    alpha: 0,
                    visible: false
                });
                TweenMax.to(dialogBoom.sprite, 0.8, {
                    alpha: 1,
                    visible: true,
                    delay: 0.6
                });
            }
        });
        dialogBox.addChild(shakBoom);
        dialogBox.addChild(dialogBoom.sprite);
        _public.app.stage.addChild(dialogBox);
    };
    // 加载纹理对象
    loadAssets(_private.initApp);
};
ElementContoller();
