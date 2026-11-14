let animId = null;
let canvas = null;
let ctx = null;
let displayText = "";
let SSize = 70;
let xv = 20;
let x = 0;
let yv = 0;
let y = 0;
let mouseX = 0;
let mouseY = 0;
let 界面;
let mouseDown;
let 原始数据;
let Buttons;

function nullToStr(obj) {
    if (obj === null) return "";
    if (typeof obj !== "object") return obj;
    if (Array.isArray(obj)) {
        return obj.map(x => nullToStr(x));
    }
    const newObj = {};
    for (const k in obj) {
        newObj[k] = nullToStr(obj[k]);
    }
    return newObj;
}

// ========== 动画时间变量 ==========
let enterTime = 0;

export function initCanvas(canvasElementId) {
    console.log("initCanvas start, id:", canvasElementId);
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
    canvas = document.getElementById(canvasElementId);
    if (!canvas) {
        console.error("找不到canvas DOM！id=" + canvasElementId);
        return;
    }
    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("获取2d上下文失败");
        return;
    }

    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.margin = "0";
    canvas.style.padding = "0";
    canvas.style.border = "none";

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel);

    canvas.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
            mouseDown = true;
        }
    });
    canvas.addEventListener("mouseup", (e) => {
        if (e.button === 0) {
            mouseDown = false;
        }
    });
    canvas.addEventListener("mouseleave", () => {
        mouseDown = false;
    });
}



function 搜索(数据, 目标) {
    var r = [];
    数据.forEach(element => {
        if (element.title.includes(目标) || element.author.includes(目标)) {
            r.push({
                "number": 0,
                "title": element.title,
                "text": element.text,
                "author": element.author,
                "data": element.data,
                "md": element.md,
                "y": 0
            })
        }
    });

    // sort不带参数，是按字符串排序，对象排序没用，改成按number或者title
    r.sort((a, b) => {
        const s1 = a.title ?? "";
        const s2 = b.title ?? "";
        return s1.localeCompare(s2);
    })

    var c = 0;
    r.forEach(element => {
        element.number = c;
        c += 1;
    });
    return r;
}

// ✅ 给Blazor调用：同步传入json数据，组装Buttons、启动渲染
export function initCanvasWithData(canvasElementId, rawJsonData) {
    initCanvas(canvasElementId);

    x = 0;
    xv = 20;
    yv = 0;
    y = 0;
    界面 = null;
    mouseDown = false;
 

    原始数据 = nullToStr(rawJsonData);
    Buttons = [];
    原始数据.forEach(element => {
        Buttons.push({
            "number": Buttons.length,
            "title": element.title,
            "text": element.text,
            "author": element.author,
            "data": element.data,
            "md": element.md,
            "y": 0
        })
    });

    enterTime = performance.now();
    startDraw();
}

function onWheel(e) {
    e.preventDefault();
    if (界面 == null) {
        if (e.deltaY > 0) {
            yv += 0.5;
        } else {
            yv -= 0.5;
        }
    } else {
        界面[6] += e.deltaY;
        if (界面[6] < 0) 界面[6] = 0;
    }
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
}

function MouseRectIF(x, y, rect) {
    return (x >= rect[0] && x <= rect[2] + rect[0] && y >= rect[1] && y <= rect[3] + rect[1]);
}

function startDraw() {
    if (!canvas || !ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    let now = performance.now();
    let elapsed = (now - enterTime) / 1000;

    if (elapsed > 3) {
        xv = 0;
    } else {
        x += xv;
        xv *= 0.8;
    }
    yv *= 0.9;
    y += yv;
    if (Buttons.length>5){
            if (y < 0) y = 0;
    if (y > Buttons.length - 6) y = Buttons.length - 6;
    }else{
        y=0;
    }
    let startNum = Math.floor(y);
    let sumY = 0;
    for (let munber = startNum; munber < startNum + 13; munber++) {
        if (munber < 0 || munber >= Buttons.length) continue;
        let posX = W * 0.01 + x
        let posY = H * (0.17 + (Buttons[munber].number - startNum) * 0.12 - (0.12 * (y % 1)))
        let RectA = [posX, posY + sumY, W * 0.70 + x + Buttons[munber].y, H * 0.1 + Buttons[munber].y, 0]
        if (界面 == null) {
            if (MouseRectIF(mouseX, mouseY, RectA)) {
                Buttons[munber].y += (100 - Buttons[munber].y) / 10;
                if (mouseDown) {
                    界面 = [munber, RectA, now, [0, H * 0.17, W, H * 0.83, 50], RectA.slice(), 0, 0];
                    mouseDown = false;
                }
            } else {
                Buttons[munber].y += (0 - Buttons[munber].y) / 10;
            }
        }

        if (!(界面 != null && munber == 界面[0])) {
            drawRect(posX, posY + sumY, W * 0.70 + x + Buttons[munber].y, H * 0.1 + Buttons[munber].y, "#68b9a2", "#fff", 2)
            drawText(Buttons[munber].title, posX + 3, posY + 40 + sumY, (Math.round(Buttons[munber].y / 10) + 35) + "px 方正正黑简体", "#ffffff");
            drawText(Buttons[munber].text, posX + 3, posY + 80 + sumY + Buttons[munber].y / 10, (Math.round(Buttons[munber].y / 10) + 24) + "px 方正正黑简体", "#ffffff");
            if (Buttons[munber].y > 50) {
                drawText("作者：" + Buttons[munber].author, posX + 3, posY + 50 + sumY + Buttons[munber].y, "30px 方正正黑简体", "#b4b4b4ff");
            }
        }
        sumY += Buttons[munber].y
    }

    if (界面 != null) {
        drawRect(界面[1][0], 界面[1][1], 界面[1][2], 界面[1][3], "#68b9a2", "#fff", 2)

        if ((now - 界面[2]) / 1000 > 2 || Math.abs((Math.abs(界面[3][0] - 界面[1][0]) + Math.abs(界面[3][1] - 界面[1][1]) + Math.abs(界面[3][2] - 界面[1][2]) + Math.abs(界面[3][3] - 界面[1][3])) / 10 < 0.7)) {
            界面[1][0] = 界面[3][0]
            界面[1][1] = 界面[3][1]
            界面[1][2] = 界面[3][2]
            界面[1][3] = 界面[3][3]
            界面[1][4] = 界面[3][4]

            if (界面[5] == 1) {
                界面 = null;
            } else {
                // 修复逗号bug，改成 &&
                if (mouseX > W - 100 && mouseY > H - 100) {
                    if (mouseDown) {
                        界面 = [界面[0], 界面[1], now, 界面[4].slice(), null, 1, 界面[6]];
                        mouseDown = false;
                    }
                }
            }
        } else {
            界面[1][0] += (界面[3][0] - 界面[1][0]) / 10
            界面[1][1] += (界面[3][1] - 界面[1][1]) / 10
            界面[1][2] += (界面[3][2] - 界面[1][2]) / 10
            界面[1][3] += (界面[3][3] - 界面[1][3]) / 10
            界面[1][4] += (界面[3][4] - 界面[1][4]) / 10
        }
        if (界面 != null) {
            drawText(Buttons[界面[0]].title, 界面[1][0] + 3, 界面[1][1] + sumY - 界面[6], (Math.round(界面[1][4]) + 40) + "px 方正正黑简体", "#ffffff");
            drawText(Buttons[界面[0]].text, 界面[1][0] + 3, 界面[1][1] + 60 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 20) + "px 方正正黑简体", "#ffffff");
            drawText(Buttons[界面[0]].author, 界面[1][0] + 3, 界面[1][1] + 100 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 10) + "px 方正正黑简体", "#ffffff96");
            drawRect(W - 界面[1][4] * 2, H - 界面[1][4] * 2, 界面[1][4] * 2, 界面[1][4] * 2, "#006c51ff", "#fff", 2);

      
            if (界面[5] == 1) {
                if ((now - 界面[2]) / 1000 < 0.3) {
                    drawTextBox(Buttons[界面[0]].md.slice(0, (Math.round(界面[1][4] * 0.02 * Buttons[界面[0]].md.length)) + 1), 界面[1][0] + 3, 界面[1][1] + 200 + sumY - 界面[6], W, 20, 30, 30, "#505050" + (Math.round(界面[1][4] * 0.7 * 2)).toString(16), "#ffffff" + (Math.round(界面[1][4] * 2.40 * 2)).toString(16), 2)
                }
            } else {
                drawTextBox(Buttons[界面[0]].md.slice(0, (Math.round(界面[1][4] * 0.02 * Buttons[界面[0]].md.length)) + 1), 界面[1][0] + 3, 界面[1][1] + 200 + sumY - 界面[6], W, 20, 30, 30, "#505050" + (Math.round(界面[1][4] * 0.7 * 2)).toString(16), "#ffffff" + (Math.round(界面[1][4] * 2.40 * 2)).toString(16), 2)
                if(Buttons[界面[0]].data.镜像下载位置 !="" && mouseY>界面[1][1] + 110+ sumY - 界面[6] && mouseY<界面[1][1] + 140+ sumY - 界面[6]){
                drawText("镜像下载位置:"+Buttons[界面[0]].data.镜像下载位置, 界面[1][0] + 3, 界面[1][1] + 130 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 2) + "px 方正正黑简体", "#00b7ffcc");
                if(mouseDown){
                    window.open(Buttons[界面[0]].data.镜像下载位置, "_blank");
                    mouseDown=false;
                    }
                }else{
                    drawText("镜像下载位置:"+Buttons[界面[0]].data.镜像下载位置, 界面[1][0] + 3, 界面[1][1] + 130 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 2) + "px 方正正黑简体", "#ffffff96");
                }

                if(Buttons[界面[0]].data.仓库下载链接 !="" && mouseY>界面[1][1] + 140+ sumY - 界面[6] && mouseY<界面[1][1] + 180+ sumY - 界面[6]){
                    drawText("仓库下载链接:"+Buttons[界面[0]].data.仓库下载链接, 界面[1][0] + 3, 界面[1][1] + 160 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 2) + "px 方正正黑简体", "#00b7ffcc");
                    if(mouseDown){
                        window.open(Buttons[界面[0]].data.仓库下载链接, "_blank");

                        mouseDown=false;
                    }
                }else{
                    drawText("仓库下载链接:"+Buttons[界面[0]].data.仓库下载链接, 界面[1][0] + 3, 界面[1][1] + 160 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 2) + "px 方正正黑简体", "#ffffff96");
                }
            }

            drawRect(W - 界面[1][4] * 2, H - 界面[1][4] * 2 + 50, 界面[1][4] * 2, 10, "#ff0000");
            drawRect(W - 界面[1][4] * 2 + 10, H - 界面[1][4] * 2 + 40, 10, 10, "#ff0000");
            drawRect(W - 界面[1][4] * 2 + 10, H - 界面[1][4] * 2 + 60, 10, 10, "#ff0000");
            drawRect(W - 界面[1][4] * 2 + 20, H - 界面[1][4] * 2 + 30, 10, 10, "#ff0000");
            drawRect(W - 界面[1][4] * 2 + 20, H - 界面[1][4] * 2 + 70, 10, 10, "#ff0000");
        }
    }
    drawRect(0, 0, W, H * 0.17, "#006c56");

    if (mouseX > W * 0.89 && mouseX < W * 0.95 && mouseY > H * 0.08 && mouseY < H * 0.2) {
        SSize += (80 - SSize) * 0.1
        if (mouseDown) {
            界面 = null;
            x = 0;
            xv = 20;
            yv = 0;
            y = 0;
            enterTime = performance.now();
            mouseDown = false;
            var temp=搜索(原始数据.slice(),displayText.replace("\n",""));
            Buttons = [];
            temp.forEach(element => {
                Buttons.push({
                    "number": Buttons.length,
                    "title": element.title,
                    "text": element.text,
                    "author": element.author,
                    "data": element.data,
                    "md": element.md,
                    "y": 0
                })
            });
        }
    } else {

        SSize += (70 - SSize) * 0.1
    }

    animId = requestAnimationFrame(startDraw);
}

export function startDraw1() {
    if (!canvas || !ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    let now = performance.now();
    let elapsed = (now - enterTime) / 1000;

    if (elapsed > 3) {
        xv = 0;
    } else {
        x += xv;
        xv *= 0.8;
    }
    yv *= 0.9;
    y += yv;
    if (Buttons.length > 5) {
        if (y < 0) y = 0;
        if (y > Buttons.length - 6) y = Buttons.length - 6;
    } else {
        y = 0;
    }
    let startNum = Math.floor(y);
    let sumY = 0;
    for (let munber = startNum; munber < startNum + 13; munber++) {
        if (munber < 0 || munber >= Buttons.length) continue;
        let posX = W * 0.01 + x
        let posY = H * (0.17 + (Buttons[munber].number - startNum) * 0.12 - (0.12 * (y % 1)))
        let RectA = [posX, posY + sumY, W * 0.70 + x + Buttons[munber].y, H * 0.1 + Buttons[munber].y, 0]
        if (界面 == null) {
            if (MouseRectIF(mouseX, mouseY, RectA)) {
                Buttons[munber].y += (100 - Buttons[munber].y) / 10;
                if (mouseDown) {
                    界面 = [munber, RectA, now, [0, H * 0.17, W, H * 0.83, 50], RectA.slice(), 0, 0];
                    mouseDown = false;
                }
            } else {
                Buttons[munber].y += (0 - Buttons[munber].y) / 10;
            }
        }

        if (!(界面 != null && munber == 界面[0])) {
            drawRect(posX, posY + sumY, W * 0.70 + x + Buttons[munber].y, H * 0.1 + Buttons[munber].y, "#68b9a2", "#fff", 2)
            drawText(Buttons[munber].title, posX + 3, posY + 40 + sumY, (Math.round(Buttons[munber].y / 10) + 35) + "px 方正正黑简体", "#ffffff");
            drawText(Buttons[munber].text, posX + 3, posY + 80 + sumY + Buttons[munber].y / 10, (Math.round(Buttons[munber].y / 10) + 24) + "px 方正正黑简体", "#ffffff");
            if (Buttons[munber].y > 50) {
                drawText("作者：" + Buttons[munber].author, posX + 3, posY + 50 + sumY + Buttons[munber].y, "30px 方正正黑简体", "#b4b4b4ff");
            }
        }
        sumY += Buttons[munber].y
    }

    if (界面 != null) {
        drawRect(界面[1][0], 界面[1][1], 界面[1][2], 界面[1][3], "#68b9a2", "#fff", 2)

        if ((now - 界面[2]) / 1000 > 2 || Math.abs((Math.abs(界面[3][0] - 界面[1][0]) + Math.abs(界面[3][1] - 界面[1][1]) + Math.abs(界面[3][2] - 界面[1][2]) + Math.abs(界面[3][3] - 界面[1][3])) / 10 < 0.7)) {
            界面[1][0] = 界面[3][0]
            界面[1][1] = 界面[3][1]
            界面[1][2] = 界面[3][2]
            界面[1][3] = 界面[3][3]
            界面[1][4] = 界面[3][4]

            if (界面[5] == 1) {
                界面 = null;
            } else {
                // 修复逗号bug，改成 &&
                if (mouseX > W - 100 && mouseY > H - 100) {
                    if (mouseDown) {
                        界面 = [界面[0], 界面[1], now, 界面[4].slice(), null, 1, 界面[6]];
                        mouseDown = false;
                    }
                }
            }
        } else {
            界面[1][0] += (界面[3][0] - 界面[1][0]) / 10
            界面[1][1] += (界面[3][1] - 界面[1][1]) / 10
            界面[1][2] += (界面[3][2] - 界面[1][2]) / 10
            界面[1][3] += (界面[3][3] - 界面[1][3]) / 10
            界面[1][4] += (界面[3][4] - 界面[1][4]) / 10
        }
        if (界面 != null) {
            drawText(Buttons[界面[0]].title, 界面[1][0] + 3, 界面[1][1] + sumY - 界面[6], (Math.round(界面[1][4]) + 40) + "px 方正正黑简体", "#ffffff");
            drawText(Buttons[界面[0]].text, 界面[1][0] + 3, 界面[1][1] + 60 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 20) + "px 方正正黑简体", "#ffffff");
            drawText(Buttons[界面[0]].author, 界面[1][0] + 3, 界面[1][1] + 100 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 10) + "px 方正正黑简体", "#ffffff96");
            drawRect(W - 界面[1][4] * 2, H - 界面[1][4] * 2, 界面[1][4] * 2, 界面[1][4] * 2, "#006c51ff", "#fff", 2);


            if (界面[5] == 1) {
                if ((now - 界面[2]) / 1000 < 0.3) {
                    drawTextBox(Buttons[界面[0]].md.slice(0, (Math.round(界面[1][4] * 0.02 * Buttons[界面[0]].md.length)) + 1), 界面[1][0] + 3, 界面[1][1] + 200 + sumY - 界面[6], W, 20, 30, 30, "#505050" + (Math.round(界面[1][4] * 0.7 * 2)).toString(16), "#ffffff" + (Math.round(界面[1][4] * 2.40 * 2)).toString(16), 2)
                }
            } else {
                drawTextBox(Buttons[界面[0]].md.slice(0, (Math.round(界面[1][4] * 0.02 * Buttons[界面[0]].md.length)) + 1), 界面[1][0] + 3, 界面[1][1] + 200 + sumY - 界面[6], W, 20, 30, 30, "#505050" + (Math.round(界面[1][4] * 0.7 * 2)).toString(16), "#ffffff" + (Math.round(界面[1][4] * 2.40 * 2)).toString(16), 2)
                if (Buttons[界面[0]].data.镜像下载位置 != "" && mouseY > 界面[1][1] + 110 + sumY - 界面[6] && mouseY < 界面[1][1] + 140 + sumY - 界面[6]) {
                    drawText("镜像下载位置:" + Buttons[界面[0]].data.镜像下载位置, 界面[1][0] + 3, 界面[1][1] + 130 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 2) + "px 方正正黑简体", "#00b7ffcc");
                    if (mouseDown) {
                        window.open(Buttons[界面[0]].data.镜像下载位置, "_blank");
                        mouseDown = false;
                    }
                } else {
                    drawText("镜像下载位置:" + Buttons[界面[0]].data.镜像下载位置, 界面[1][0] + 3, 界面[1][1] + 130 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 2) + "px 方正正黑简体", "#ffffff96");
                }

                if (Buttons[界面[0]].data.仓库下载链接 != "" && mouseY > 界面[1][1] + 140 + sumY - 界面[6] && mouseY < 界面[1][1] + 180 + sumY - 界面[6]) {
                    drawText("仓库下载链接:" + Buttons[界面[0]].data.仓库下载链接, 界面[1][0] + 3, 界面[1][1] + 160 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 2) + "px 方正正黑简体", "#00b7ffcc");
                    if (mouseDown) {
                        window.open(Buttons[界面[0]].data.仓库下载链接, "_blank");

                        mouseDown = false;
                    }
                } else {
                    drawText("仓库下载链接:" + Buttons[界面[0]].data.仓库下载链接, 界面[1][0] + 3, 界面[1][1] + 160 + sumY - 界面[6], (Math.round(界面[1][4] / 2) + 2) + "px 方正正黑简体", "#ffffff96");
                }
            }

            drawRect(W - 界面[1][4] * 2, H - 界面[1][4] * 2 + 50, 界面[1][4] * 2, 10, "#ff0000");
            drawRect(W - 界面[1][4] * 2 + 10, H - 界面[1][4] * 2 + 40, 10, 10, "#ff0000");
            drawRect(W - 界面[1][4] * 2 + 10, H - 界面[1][4] * 2 + 60, 10, 10, "#ff0000");
            drawRect(W - 界面[1][4] * 2 + 20, H - 界面[1][4] * 2 + 30, 10, 10, "#ff0000");
            drawRect(W - 界面[1][4] * 2 + 20, H - 界面[1][4] * 2 + 70, 10, 10, "#ff0000");
        }
    }
    drawRect(0, 0, W, H * 0.17, "#006c56");

    if (true) {
        SSize += (80 - SSize) * 0.1
        if (true) {
            界面 = null;
            x = 0;
            xv = 20;
            yv = 0;
            y = 0;
            enterTime = performance.now();
            mouseDown = false;
            var temp = 搜索(原始数据.slice(), displayText.replace("\n", ""));
            Buttons = [];
            temp.forEach(element => {
                Buttons.push({
                    "number": Buttons.length,
                    "title": element.title,
                    "text": element.text,
                    "author": element.author,
                    "data": element.data,
                    "md": element.md,
                    "y": 0
                })
            });
        }
    } else {
        SSize += (70 - SSize) * 0.1
    }

    animId = requestAnimationFrame(startDraw);
}

function drawRect(x, y, w, h, fillColor, strokeColor, lineWidth) {
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, w, h);
    }
}

function drawText(text, x, y, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function drawMultiText(text, x, y, lineHeight) {
    if (!text) return;
    const lines = text.split("\n");
    for (let line of lines) {
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
}

function drawTextBox(text, boxX, boxY, maxBoxW, padding, fontSize, lineHeight, fillColor, strokeColor, lineWidth) {
    if (!text) return;
    ctx.font = `${fontSize}px 方正正黑简体`;
    const availableW = maxBoxW - padding * 2;

    function wrapLine(rawStr) {
        const words = rawStr.split('');
        const resultLines = [];
        let current = '';
        for (const ch of words) {
            const test = current + ch;
            if (ctx.measureText(test).width > availableW && current !== '') {
                resultLines.push(current);
                current = ch;
            } else {
                current = test;
            }
        }
        if (current) resultLines.push(current);
        return resultLines;
    }

    const rawLines = text.split('\n');
    let finalLines = [];
    for (const l of rawLines) {
        const wrapped = wrapLine(l);
        finalLines.push(...wrapped);
    }

    let maxTextW = 0;
    for (const line of finalLines) {
        const tw = ctx.measureText(line).width;
        if (tw > maxTextW) maxTextW = tw;
    }
    let boxW = maxTextW + padding * 2;
    if (boxW > maxBoxW) boxW = maxBoxW;
    const textTotalH = finalLines.length * lineHeight;
    const boxH = textTotalH + padding * 2;

    drawRect(boxX, boxY, boxW, boxH, fillColor, strokeColor, lineWidth);

    let y = boxY + padding + fontSize;
    ctx.fillStyle = "#fff";
    for (const line of finalLines) {
        ctx.fillText(line, boxX + padding, y);
        y += lineHeight;
    }
}

export function drawTextOnCanvas(text) {
    displayText = text;
}

export function stopCanvas() {
    console.log("stopCanvas");
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
    window.removeEventListener("resize", resizeCanvas);
    canvas = null;
    ctx = null;
}
