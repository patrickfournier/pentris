document.addEventListener('DOMContentLoaded', function() {

  var brico = brico || {};

  /*
   The palette is a list of 18 RGBA colors; each color has 5 shades.
   Generated with the help of http://paletton.com
   */
  brico.Palette = [
    [[127,127,127,1], [255,255,255,1], [190,190,190,1], [ 62, 62, 62,1], [  0,  0,  0,1]],
    [[255,232,  0,1], [255,248,178,1], [255,238, 62,1], [226,206,  0,1], [162,148,  0,1]],
    [[ 98, 10,215,1], [176,151,209,1], [120, 61,198,1], [ 68,  4,153,1], [ 48,  1,110,1]],
    [[255,255,  0,1], [255,255,178,1], [255,255, 62,1], [226,226,  0,1], [162,162,  0,1]],
    [[  0,215,123,1], [146,210,183,1], [ 49,200,135,1], [  0,155, 89,1], [  0,111, 64,1]],
    [[255, 73,  0,1], [255,200,178,1], [255,117, 62,1], [226, 64,  0,1], [162, 46,  0,1]],
    [[  0,205,205,1], [138,197,197,1], [ 45,185,185,1], [  0,136,136,1], [  0, 97, 97,1]],
    [[255,116,  0,1], [255,213,178,1], [255,150, 62,1], [226,102,  0,1], [162, 74,  0,1]],
    [[208,251,  0,1], [237,250,175,1], [217,249, 61,1], [181,218,  0,1], [130,157,  0,1]],
    [[  7,122,210,1], [146,179,204,1], [ 57,133,192,1], [  3, 83,145,1], [  1, 59,104,1]],
    [[211,  0,211,1], [205,143,205,1], [193, 47,193,1], [147,  0,147,1], [105,  0,105,1]],
    [[255,170,  0,1], [255,229,178,1], [255,191, 62,1], [226,151,  0,1], [162,108,  0,1]],
    [[109,241,  0,1], [200,239,167,1], [138,236, 58,1], [ 91,201,  0,1], [ 65,145,  0,1]],
    [[ 17, 17,217,1], [157,157,212,1], [ 72, 72,202,1], [  7,  7,158,1], [  2,  2,114,1]],
    [[255,191,  0,1], [255,236,178,1], [255,207, 62,1], [226,169,  0,1], [162,122,  0,1]],
    [[242,  0, 73,1], [240,167,189,1], [236, 58,112,1], [202,  0, 61,1], [145,  0, 44,1]],
    [[  0,230,  0,1], [158,226,158,1], [ 54,220, 54,1], [  0,181,  0,1], [  0,130,  0,1]],
    [[255,  0,  0,1], [255,178,178,1], [255, 62, 62,1], [226,  0,  0,1], [162,  0,  0,1]],
  ];

  /* Color */
  brico.Color = function(c, s) {
    this.r = brico.Palette[c][s][0];
    this.g = brico.Palette[c][s][1];
    this.b = brico.Palette[c][s][2];
    this.a = brico.Palette[c][s][3];
  };

  brico.Color.prototype.toString = function() {
    return "rgba(" + this.r.toString() + "," + this.g.toString() + "," + this.b.toString() + "," + this.a.toString() + ")";
  };

  /* Shape */
  brico.Shape = function(color1, color2, shape, shapeWidth, shapeHeight) {
    this.color1 = color1;
    this.color2 = color2;
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
    this.width = shapeWidth;
    this.height = shapeHeight;
    this.def = new Array(shapeWidth * shapeHeight);
    this.def.fill(false);
    for (var i = 0; i < shape.length; i++) {
      this.def[shape[i]] = true;
    }
  };

  brico.Shape.prototype.rotationLookupTable = {
    0  : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    90 : [20, 15, 10, 5, 0, 21, 16, 11, 6, 1, 22, 17, 12, 7, 2, 23, 18, 13, 8, 3, 24, 19, 14, 9, 4],
    180: [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    270: [4, 9, 14, 19, 24, 3, 8, 13, 18, 23, 2, 7, 12, 17, 22, 1, 6, 11, 16, 21, 0, 5, 10, 15, 20]
  };

  brico.Shape.prototype.move = function(dx, dy) {
    this.x += dx;
    this.y += dy;
  };

  brico.Shape.prototype.rotate = function(clockwise) {
    var delta = clockwise ? 90 : 270;
    this.rotation = (this.rotation + delta) % 360;
  };

  brico.Shape.prototype.draw = function(grid) {
    var color1 = this.color1.toString();
    var color2 = this.color2.toString();
    var rlut = this.rotationLookupTable[this.rotation];

    grid.drawSquarePrepare();
    for (var i = 0; i < this.def.length; i++) {
      var j = rlut[i];
      if (this.def[j]) {
        var x = (this.x + (i % this.width));
        var y = (this.y + Math.floor(i / this.width));
        grid.drawSquare(x, y, color1, color2);
      }
    }
  };

  brico.Shape.prototype.getOccupiedSquares = function() {
    return this.getOccupiedSquaresAfterMove(0, 0, undefined);
  };

  brico.Shape.prototype.getOccupiedSquaresAfterMove = function(dx, dy, rotation) {
    var occupiedSquares = [];
    var r = this.rotation;
    if (rotation === true) {
      r = (this.rotation + 90) % 360;
    }
    else if (rotation === false) {
      r = (this.rotation + 270) % 360;
    }

    var rlut = this.rotationLookupTable[r];
    for (var i = 0; i < this.def.length; i++) {
      var j = rlut[i];
      if (this.def[j]) {
        var x = (this.x + dx + (i % this.width));
        var y = (this.y + dy + Math.floor(i / this.width));
        occupiedSquares.push([x, y]);
      }
    }
    return occupiedSquares;
  };

  /* Shape factory */
  brico.ShapeFactory = function() {};

  brico.ShapeFactory.shapes = [
    [7, 11, 12, 13, 17], // X
    [7, 8, 12, 13, 17],  // P
    [6, 7, 11, 12, 17],  // Mirrored P
    [7, 8, 11, 12, 17],  // F
    [6, 7, 12, 13, 17],  // Mirrored F
    [6, 11, 16, 17, 18], // V
    [6, 11, 12, 17, 18], // W
    [2, 6, 7, 12, 17],   // Y
    [2, 7, 8, 12, 17],   // Mirrored Y
    [2, 7, 12, 17, 22],  // I
    [6, 7, 8, 12, 17],   // T
    [6, 7, 12, 17, 18],  // Z
    [7, 8, 12, 16, 17],  // Mirrored Z (S)
    [6, 8, 11, 12, 13],  // U
    [5, 6, 11, 12, 13],  // N
    [8, 9, 11, 12, 13],  // Mirrored N
    [9, 11, 12, 13, 14], // L
    [5, 10, 11, 12, 13], // Mirrored L (J)
  ];

  brico.ShapeFactory.newShape = function(shapeId) {
    var color1 = new brico.Color(shapeId, 0);
    var color2 = new brico.Color(shapeId, 3);
    var shape = new brico.Shape(color1, color2, this.shapes[shapeId], 5, 5);
    return shape;
  };

  brico.Grid = function(interval) {
    var canvas = document.getElementById('brico');
    this.ctx = canvas.getContext('2d');

    this.pixelWidth = canvas.height/2;
    this.pixelHeight = 2*this.pixelWidth;
    this.width = 13;
    this.height = 26;
    this.x = (canvas.width - this.pixelWidth) / 2;
    this.y = 0;

    this.xs = this.pixelWidth / this.width;
    this.ys = this.pixelHeight / this.height;
    this.insetX = Math.floor(this.xs/6);
    this.insetY = Math.floor(this.ys/6);

    this.currentShape = undefined;
    this.gridData = new Array(this.width * this.height);

    var self = this;
    this.periodicTask = window.setInterval(function() {
      self.tick();
    }, interval);
  };

  brico.Grid.prototype.bake = function() {
    if (this.currentShape) {
      var occupiedSquares = this.currentShape.getOccupiedSquares();
      for (var i = 0; i < occupiedSquares.length; i++) {
        var j = occupiedSquares[i][1] * this.width + occupiedSquares[i][0];
        this.gridData[j] = [this.currentShape.color1, this.currentShape.color2];
      }
      this.currentShape = undefined;
    }
  };

  brico.Grid.prototype.drawSquarePrepare = function() {
    grid.ctx.strokeStyle = "rgba(60,60,60,1)";
    grid.ctx.lineWidth = 2;
  };

  brico.Grid.prototype.drawSquare = function(x, y, color1Str, color2Str) {
    x = x * this.xs + this.x;
    y = y * this.ys + this.y;
    grid.ctx.fillStyle = color1Str;
    grid.ctx.fillRect(x, y, this.xs, this.ys);
    grid.ctx.fillStyle = color2Str;
    grid.ctx.fillRect(x+this.insetX, y+this.insetY, this.xs-2*this.insetX, this.ys-2*this.insetY);
    grid.ctx.strokeRect(x, y, this.xs, this.ys);
  };

  brico.Grid.prototype.draw = function() {
    grid.ctx.clearRect(this.x, this.y, this.pixelWidth, this.pixelHeight);

    grid.ctx.strokeStyle = "rgba(60,60,60,1)";
    grid.ctx.lineWidth = 2;
    grid.ctx.strokeRect(this.x, this.y, this.pixelWidth, this.pixelHeight);

    this.drawSquarePrepare();
    for (var i = 0; i < this.gridData.length; i++) {
      if (this.gridData[i]) {
        var x = i % this.width;
        var y = Math.floor(i / this.width);
        var c1 = this.gridData[i][0].toString();
        var c2 = this.gridData[i][1].toString();
        this.drawSquare(x, y, c1, c2);
      }
    }

    if (this.currentShape) {
      this.currentShape.draw(this);
    }
  };

  brico.Grid.prototype.detectCollision = function(shapeSquares) {
    for (var i = 0; i < shapeSquares.length; i++) {
      var j = shapeSquares[i][1] * this.width + shapeSquares[i][0];
      if ((this.gridData[j] != undefined) ||
          (shapeSquares[i][0] < 0) ||
          (shapeSquares[i][0] >= this.width) ||
          (shapeSquares[i][1] >= this.height)) {
        return true;
      }
    }
    return false;
  };

  brico.Grid.prototype.tryMove = function(dx, dy) {
    if (this.currentShape) {
      var shapeSquares = this.currentShape.getOccupiedSquaresAfterMove(dx, dy, undefined);
      if (!this.detectCollision(shapeSquares)) {
        this.currentShape.move(dx, dy);
        return true;
      }
    }
    return false;
  };

  brico.Grid.prototype.tryRotate = function(clockwise) {
    if (this.currentShape) {
      var shapeSquares = this.currentShape.getOccupiedSquaresAfterMove(0, 0, clockwise);
      if (!this.detectCollision(shapeSquares)) {
        this.currentShape.rotate(clockwise);
        return true;
      }
    }
    return false;
  };

  brico.Grid.prototype.drop = function() {
    if (this.currentShape) {
      var dy = 1;
      var shapeSquares = this.currentShape.getOccupiedSquaresAfterMove(0, dy, undefined);
      while (!this.detectCollision(shapeSquares)) {
        dy++;
        for (var i = 0; i < shapeSquares.length; i++) {
          shapeSquares[i][1]++;
        }
      }
      if (dy > 1) {
        this.currentShape.move(0, dy - 1);
        return true;
      }
    }
    return false;
  };

  brico.Grid.prototype.removeFullLines = function() {
    var fullLines = [];

    for (var j = 0; j < this.height; j++) {
      var isFull = true;
      for (var i = 0; i < this.width; i++) {
        if (!this.gridData[j * this.width + i]) {
          isFull = false;
          break;
        }
      }
      if (isFull) {
        fullLines.push(j);
      }
    }

    for (var i = 0; i < fullLines.length; i++) {
      var j = fullLines[i];
      this.gridData.splice(j*this.width, this.width);
    }
    var newLines = new Array(fullLines.length * this.width);
    this.gridData = newLines.concat(this.gridData);

    return fullLines.length;
  };

  brico.Grid.prototype.tick = function() {
    if (!this.tryMove(0, 1)) {
      // merge shape into grid
      this.bake();
      // delete lines
      this.removeFullLines();
      // create new shape.
      var r = Math.random();
      var shapeId = Math.floor(r * brico.ShapeFactory.shapes.length);
      this.currentShape = brico.ShapeFactory.newShape(shapeId);
      if (!this.tryMove((this.width - 5)/2, 0)) {
        // game over
        this.currentShape = undefined;
        window.clearInterval(this.periodicTask);
      }
    }
    this.draw();
  };

  var grid = new brico.Grid(500);

  document.onkeypress = function(e) {
    e = e || window.event;
    var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
    if (charCode) {
      switch (String.fromCharCode(charCode)) {
      case '4':
        grid.tryMove(-1, 0);
        grid.draw();
        break;
      case '5':
        grid.tryRotate(false);
        grid.draw();
        break;
      case '6':
        grid.tryMove(1, 0);
        grid.draw();
        break;
      case '8':
        grid.tryRotate(true);
        grid.draw();
        break;
      case '0':
        grid.drop();
        grid.draw();
        break;
      case '.':
        grid.tryMove(0, 1);
        grid.draw();
        break;
      }
    }
  };
}, false);
