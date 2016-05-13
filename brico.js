document.addEventListener('DOMContentLoaded', function() {

  /* TODO:
   - animate line removal
   - new game button
   */

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
    var color = brico.Palette[c][s];
    this.colorString = "rgba(" + color[0].toString() + "," + color[1].toString() + "," + color[2].toString() + "," + color[3].toString() + ")";
  };

  brico.Color.prototype.toString = function() {
    return this.colorString;
  };

  /**
   Shape

   Shapes are defined by a 5x5 array of bools.
   */
  brico.Shape = function(color1, color2, shape) {
    this.color1 = color1;
    this.color2 = color2;
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
    this.width = 5;
    this.height = 5;
    this.def = new Array(this.width * this.height);
    this.def.fill(false);
    for (var i = 0; i < shape.length; i++) {
      this.def[shape[i]] = true;
    }

    // Compute bounding box.
    var minX = this.width;
    var maxX = 0;
    var minY = this.height;
    var maxY = 0;
    var squares = this.getOccupiedSquares();
    for (var i = 0; i < squares.length; i++) {
      minX = Math.min(minX, squares[i][0]);
      maxX = Math.max(maxX, squares[i][0]);
      minY = Math.min(minY, squares[i][1]);
      maxY = Math.max(maxY, squares[i][1]);
    }
    this.bboxLeft = minX;
    this.bboxTop = minY;
    this.bboxWidth = maxX - minX + 1;
    this.bboxHeight = maxY - minY + 1;
  };

  // Index lookup table for rotated shapes. Rotations are clockwise.
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

  brico.Shape.prototype.getOccupiedSquares = function() {
    return this.getOccupiedSquaresAfterMove(0, 0, null);
  };

  brico.Shape.prototype.getOccupiedSquaresAfterMove = function(dx, dy, clockwiseRotation) {
    var occupiedSquares = [];
    var r = this.rotation;
    if (clockwiseRotation === true) {
      r = (this.rotation + 90) % 360;
    }
    else if (clockwiseRotation === false) {
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
    var shape = new brico.Shape(color1, color2, this.shapes[shapeId]);
    return shape;
  };

  brico.ShapeFactory.randomShape = function() {
    var r = Math.random();
    var shapeId = Math.floor(r * this.shapes.length);
    return this.newShape(shapeId);
  };

  /* GridView */
  brico.GridView = function(canvasId, grid) {
    var canvas = document.getElementById(canvasId);
    this.ctx = canvas.getContext('2d');

    this.grid = grid;

    this.x = 0;
    this.y = 0;
    this.pixelWidth = canvas.width;
    this.pixelHeight = canvas.height;

    this.xs = this.pixelWidth / this.grid.width;
    this.ys = this.pixelHeight / this.grid.height;
    this.insetX = Math.floor(this.xs/6);
    this.insetY = Math.floor(this.ys/6);

    this.lastGridUpdateId = grid.updateId - 1;

    this.animate();
  };

  brico.GridView.prototype.drawSquarePrepare = function() {
    this.ctx.strokeStyle = "rgba(30,30,30,1)";
    this.ctx.lineWidth = 2;
  };

  brico.GridView.prototype.drawSquare = function(x, y, color1Str, color2Str) {
    x = x * this.xs + this.x;
    y = y * this.ys + this.y;
    this.ctx.fillStyle = color1Str;
    this.ctx.fillRect(x, y, this.xs, this.ys);
    this.ctx.fillStyle = color2Str;
    this.ctx.fillRect(x+this.insetX, y+this.insetY, this.xs-2*this.insetX, this.ys-2*this.insetY);
    this.ctx.strokeRect(x, y, this.xs, this.ys);
  };

  brico.GridView.prototype.draw = function() {
    if (this.lastGridUpdateId != grid.updateId) {
      this.lastGridUpdateId = grid.updateId;

      this.ctx.clearRect(this.x, this.y, this.pixelWidth, this.pixelHeight);

      this.drawSquarePrepare();
      for (var i = 0; i < this.grid.gridData.length; i++) {
        if (this.grid.gridData[i]) {
          var x = i % this.grid.width;
          var y = Math.floor(i / this.grid.width);
          var c1 = this.grid.gridData[i][0].toString();
          var c2 = this.grid.gridData[i][1].toString();
          this.drawSquare(x, y, c1, c2);
        }
      }

      if (this.grid.currentShape) {
        var c1 = this.grid.currentShape.color1.toString();
        var c2 = this.grid.currentShape.color2.toString();
        var squares = this.grid.currentShape.getOccupiedSquares();
        for (var i = 0; i < squares.length; i++) {
          this.drawSquare(squares[i][0], squares[i][1], c1, c2);
        }
      }
    }
  };

  brico.GridView.prototype.animate = function() {
    this.draw();
    window.requestAnimationFrame(this.animate.bind(this));
  };

  /* Shape Preview */
  brico.ShapePreviewView = function(canvasId, grid) {
    brico.GridView.call(this, canvasId, grid);

    this.xs = this.pixelWidth / 6;
    this.ys = this.pixelHeight / 6;
    this.insetX = Math.floor(this.xs/6);
    this.insetY = Math.floor(this.ys/6);

    this.lastShapeDrawn = this.grid.nextShape;
  };
  brico.ShapePreviewView.prototype = Object.create(brico.GridView.prototype);

  brico.ShapePreviewView.prototype.draw = function() {
    if (this.lastShapeDrawn != this.grid.nextShape) {
      this.lastShapeDrawn = this.grid.nextShape;

      this.ctx.clearRect(this.x, this.y, this.pixelWidth, this.pixelHeight);

      this.drawSquarePrepare();

      if (this.grid.nextShape) {
        var padX = (6 - this.grid.nextShape.bboxWidth) / 2. - this.grid.nextShape.bboxLeft;
        var padY = (6 - this.grid.nextShape.bboxHeight) / 2. - this.grid.nextShape.bboxTop;
        var c1 = this.grid.nextShape.color1.toString();
        var c2 = this.grid.nextShape.color2.toString();
        var squares = this.grid.nextShape.getOccupiedSquares();
        for (var i = 0; i < squares.length; i++) {
          this.drawSquare(squares[i][0] + padX, squares[i][1] + padY, c1, c2);
        }
      }
    }
  };

  /* Grid */
  brico.Grid = function(width, height) {
    this.width = width;
    this.height = height;

    this.nextShape = brico.ShapeFactory.randomShape();
    this.currentShape = undefined;

    this.gridData = new Array(this.width * this.height);

    this.updateId = 0;
  };

  brico.Grid.prototype.bake = function() {
    if (this.currentShape) {
      var occupiedSquares = this.currentShape.getOccupiedSquares();
      for (var i = 0; i < occupiedSquares.length; i++) {
        var j = occupiedSquares[i][1] * this.width + occupiedSquares[i][0];
        this.gridData[j] = [this.currentShape.color1, this.currentShape.color2];
      }
      this.currentShape = undefined;

      var event = document.createEvent('Event');
      event.initEvent('brico-bake', true, true);
      document.dispatchEvent(event);

      this.updateId++;
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
        this.updateId++;
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
        this.updateId++;
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

        var event = document.createEvent('Event');
        event.dy = dy - 1;
        event.initEvent('brico-drop', true, true);
        document.dispatchEvent(event);

        this.updateId++;

        return true;
      }
    }
    return false;
  };

  brico.Grid.prototype.removeFullLines = function() {
    var fullLines = [];

    for (var j = this.height - 1; j >= 0; j--) {
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

    if (fullLines.length > 0) {
      for (var i = 0; i < fullLines.length; i++) {
        var j = fullLines[i];
        this.gridData.splice(j*this.width, this.width);
      }
      var newLines = new Array(fullLines.length * this.width);
      this.gridData = newLines.concat(this.gridData);

      var event = document.createEvent('Event');
      event.lines = fullLines.length;
      event.initEvent('brico-lines', true, true);
      document.dispatchEvent(event);

      this.updateId++;
    }
  };

  brico.Grid.prototype.tick = function() {
    if (!this.tryMove(0, 1)) {
      // merge shape into grid
      this.bake();
      // delete lines
      this.removeFullLines();
      // create new shape.
      this.currentShape = this.nextShape;
      if (!this.tryMove((this.width - 5)/2, 0)) {
        // game over
        this.currentShape = undefined;

        var event = document.createEvent('Event');
        event.initEvent('brico-gameover', true, true);
        document.dispatchEvent(event);
      }
      else {
        this.nextShape = brico.ShapeFactory.randomShape();
      }
    }
  };

  brico.Background = function() {
    this.backgrounds = [
      {photo_url: "https://farm4.staticflickr.com/3842/15088487045_94b6a4fc31_k_d.jpg",
       flickr_url: "https://flic.kr/p/oZjrwn",
       author: "Normand Gaudreault",
       author_url: "https://www.flickr.com/photos/95930823@N08/"},
      {photo_url: "https://farm6.staticflickr.com/5134/5515913152_2f50ab52b0_o_d.jpg",
       flickr_url: "https://flic.kr/p/9pquNU",
       author: "Nick Kenrick",
       author_url: "https://www.flickr.com/photos/zedzap/"},
      {photo_url: "https://farm8.staticflickr.com/7608/16617366738_6a9222745f_o_d.jpg",
       flickr_url: "https://flic.kr/p/rjqmc5",
       author: "Guiseppe Milo",
       author_url: "https://www.flickr.com/photos/giuseppemilo/"},
      {photo_url: "https://farm9.staticflickr.com/8524/8478269827_08fcb6bc75_k_d.jpg",
       flickr_url: "https://flic.kr/p/dVcmeZ",
       author: "Stephan Oppermann",
       author_url: "https://www.flickr.com/photos/s_oppermann/"},
      {photo_url: "https://farm6.staticflickr.com/5526/11277422085_27afdde687_k_d.jpg",
       flickr_url: "https://flic.kr/p/ibxJFP",
       author: "Arnaud Fougerouse",
       author_url: "https://www.flickr.com/photos/hihaa/"},
      {photo_url: "https://farm6.staticflickr.com/5487/14141331128_78dd600bac_k_d.jpg",
       flickr_url: "https://flic.kr/p/nxC24W",
       author: "Christian",
       author_url: "https://www.flickr.com/photos/blavandmaster/"},
      {photo_url: "https://farm8.staticflickr.com/7695/17056169627_3ab896d24e_o_d.jpg",
       flickr_url: "https://flic.kr/p/rZck18",
       author: "Guiseppe Milo",
       author_url: "https://www.flickr.com/photos/giuseppemilo/"},
      {photo_url: "https://farm8.staticflickr.com/7392/16458204126_b9455a9dce_k_d.jpg",
       flickr_url: "https://flic.kr/p/r5mAG7",
       author: "Mibby23",
       author_url: "https://www.flickr.com/photos/mibby23/"},
      {photo_url: "https://farm9.staticflickr.com/8122/8609523972_a5de909ffa_o_d.jpg",
       flickr_url: "https://flic.kr/p/e7N4wu",
       author: "Christian",
       author_url: "https://www.flickr.com/photos/blavandmaster/"},
      {photo_url: "https://farm8.staticflickr.com/7609/16781847658_c919709c38_k_d.jpg",
       flickr_url: "https://flic.kr/p/ryXmD1",
       author: "Guven Gul",
       author_url: "https://www.flickr.com/photos/guvengul/"},
    ];
    this.initBackground();

    document.addEventListener('brico-nextlevel', brico.Background.prototype.changeBackground.bind(this));
  };

  brico.Background.prototype.initBackground = function() {
    // Load first image and wait until it is loaded before setting the background.
    var image = new Image();
    image.src = this.backgrounds[0].photo_url;

    var bg = document.getElementsByTagName('html')[0];
    var credit = document.getElementsByClassName('brico-background-image-credit')[0];
    var il = credit.getElementsByClassName('image-link')[0];
    var al = credit.getElementsByClassName('author-link')[0];
    var self = this;
    image.addEventListener('load', function() {
      bg.style.backgroundImage = 'url(' + self.backgrounds[0].photo_url + ')';
      il.setAttribute('href', self.backgrounds[0].flickr_url);
      al.setAttribute('href', self.backgrounds[0].author_url);
      al.innerHTML = self.backgrounds[0].author;
    });

    // Preload next image. We keep it in this.nextImage to prevent the
    // object from being garbage collected.
    this.nextImage = new Image();
    this.nextImage.src = this.backgrounds[1].photo_url;
  };

  brico.Background.prototype.changeBackground = function(e) {
    var bgindex = (e.level - 1) % this.backgrounds.length;

    var bg = document.getElementsByTagName('html')[0];
    bg.style.backgroundImage = 'url(' + this.backgrounds[bgindex].photo_url + ')';

    var credit = document.getElementsByClassName('brico-background-image-credit')[0];
    var il = credit.getElementsByClassName('image-link')[0];
    var al = credit.getElementsByClassName('author-link')[0];

    il.setAttribute('href', this.backgrounds[bgindex].flickr_url);
    al.setAttribute('href', this.backgrounds[bgindex].author_url);
    al.innerHTML = this.backgrounds[bgindex].author;

    // Preload next image
    bgindex = (bgindex + 1) % this.backgrounds.length;
    this.nextImage = new Image();
    this.nextImage.src = this.backgrounds[bgindex].photo_url;
  };

  /* Game */
  brico.Game = function(grid, interval) {
    this.playing = false;
    this.grid = grid;
    this.interval = interval;
    this.score = 0;
    this.lineCompleted = 0;
    this.level = 1;
    this.linesPerLevel = 10;

    this.scoreElem = document.getElementById('brico-score');
    this.levelElem = document.getElementById('brico-level');
    this.highScoreElem = document.getElementById('brico-highscore');

    var highscore = window.localStorage.getItem('highscore') || 0;
    this.highScoreElem.innerHTML = highscore;

    this.dropSound = [new Audio('sounds/drop.ogg'), new Audio('sounds/drop.ogg'), new Audio('sounds/drop.ogg')];
    this.linesSound = new Audio('sounds/magic_wand.ogg');
    this.fourLinesSound = new Audio('sounds/cheers.ogg');
    this.gameOverSound = new Audio('sounds/sad_trombone.ogg');

    document.addEventListener('brico-bake', brico.Game.prototype.bakeEventListener.bind(this));
    document.addEventListener('brico-lines', brico.Game.prototype.fullLinesEventListener.bind(this));
    document.addEventListener('brico-drop', brico.Game.prototype.dropEventListener.bind(this));
    document.addEventListener('brico-gameover', brico.Game.prototype.gameOverEventListener.bind(this));

    var self = this;
    document.onkeypress = function(e) {
      e = e || window.event;
      var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
      if (charCode) {
        if (String.fromCharCode(charCode) == 'p') {
          self.togglePause();
          e.preventDefault();
        }

        if (self.playing) {
          switch (String.fromCharCode(charCode)) {
          case 'j':
            grid.tryMove(-1, 0);
            e.preventDefault();
            break;
          case 'k':
            grid.tryRotate(false);
            e.preventDefault();
            break;
          case 'l':
            grid.tryMove(1, 0);
            e.preventDefault();
            break;
          case 'i':
            grid.tryRotate(true);
            e.preventDefault();
            break;
          case ' ':
            grid.drop();
            grid.bake();
            e.preventDefault();
            break;
          case 'h':
            grid.tryMove(0, 1);
            e.preventDefault();
            break;
          }
        }
      }
    };
  };

  brico.Game.prototype.start = function() {
    var self = this;
    this.playing = true;
    this.grid.tick();
    this.periodicTask = window.setInterval(function() {
      self.grid.tick();
    }, this.interval);
  };

  brico.Game.prototype.stop = function() {
    window.clearInterval(this.periodicTask);
    this.playing = false;
  };

  brico.Game.prototype.togglePause = function() {
    if (this.playing) {
      this.stop();
    }
    else {
      this.start();
    }
  };

  brico.Game.prototype.bakeEventListener = function(e) {
    this.score += 5;
    this.scoreElem.innerHTML = this.score;
  };

  brico.Game.prototype.fullLinesEventListener = function(e) {
    this.linesSound.currentTime = 0;
    this.linesSound.play();

    this.score += 10 * e.lines;
    if (e.lines >= 4) {
      this.score += (e.lines - 3) * 100;
      this.fourLinesSound.currentTime = 0;
      this.fourLinesSound.play();
    }

    this.scoreElem.innerHTML = this.score;

    this.lineCompleted += e.lines;
    var currentInterval = this.interval;
    while (this.lineCompleted >= this.linesPerLevel) {
      this.lineCompleted -= this.linesPerLevel;
      this.level++;
      this.interval *= 0.9;
      this.levelElem.innerHTML = this.level;

      var event = document.createEvent('Event');
      event.level = this.level;
      event.initEvent('brico-nextlevel', true, true);
      document.dispatchEvent(event);
    }
    if (currentInterval != this.interval) {
      this.stop();
      this.start();
    }
  };

  brico.Game.prototype.dropEventListener = function(e) {
    var i = 0;
    while ((i < this.dropSound.length) && !this.dropSound[i].paused) {
      i++;
    }
    if (i == 3) {
      i = 0;
    }
    this.dropSound[i].currentTime = 0;
    this.dropSound[i].play();

    this.score += 2 * e.dy;
  };

  brico.Game.prototype.gameOverEventListener = function(e) {
    this.stop();

    var highscore = window.localStorage.getItem('highscore');
    if (this.score > highscore) {
      window.localStorage.setItem("highscore", this.score);
      this.highScoreElem.innerHTML = this.score;
    }

    this.gameOverSound.currentTime = 0;
    this.gameOverSound.play();
    document.getElementById('brico-gameover').style.display = "block";
  };

  var grid = new brico.Grid(13, 26);
  var gridView = new brico.GridView('brico-board', grid);
  var shapePreview = new brico.ShapePreviewView('brico-preview', grid);
  var backgroundView = new brico.Background();
  var game = new brico.Game(grid, 500);
  game.start();

}, false);
