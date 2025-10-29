/**
 * TinyGUI Drawing Module
 * Simple canvas drawing primitives
 */

let ctx = null;
let canvas = null;

export function initialize(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
}

export function clear(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function rect(rectObj, color) {
    ctx.fillStyle = color;
    ctx.fillRect(rectObj.x, rectObj.y, rectObj.w, rectObj.h);
}

export function border(rectObj, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(rectObj.x, rectObj.y, rectObj.w, rectObj.h);
}

export function text(str, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
}

export function line(x1, y1, x2, y2, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

export function circle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

export function circleOutline(x, y, radius, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
}
