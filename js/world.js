

var BootScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function BootScene ()
    {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    preload: function ()
    {
        // mapa
        this.load.image('tiles', 'assets/map/spritesheet.png');

        // background
        this.load.image('background','assets/Battleground3.png');
        
        // mapa em json
        this.load.tilemapTiledJSON('map', 'assets/map/map.json');
        
        // inimigos
        this.load.image("dragon", "assets/dragon.png");
        this.load.image("demon", "assets/demon.png");
        
        // os nossos dois jogadores
        this.load.spritesheet('player', 'assets/meuboneco.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('sideKick', 'assets/personagem.png', { frameWidth: 64, frameHeight: 64 });
    },

    create: function ()
    {
        // Começar a WorldScene
        this.scene.start('WorldScene');
    }
});

var WorldScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function WorldScene ()
    {
        Phaser.Scene.call(this, { key: 'WorldScene' });
    },

    preload: function ()
    {
        
    },

    create: function ()
    {
        // criar o mapa
        var map = this.make.tilemap({ key: 'map' });
        
        // primeiro parâmetro é o nome do "tilemap"
        var tiles = map.addTilesetImage('spritesheet', 'tiles');
        
        // criar as "layers"
        var grass = map.createStaticLayer('Grass', tiles, 0, 0);
        var obstacles = map.createStaticLayer('Obstacles', tiles, 0, 0);
        
        // fazer com que todos os obstáculos respeitem colisão
        obstacles.setCollisionByExclusion([-1]);

        // animação quando pressiona a tecla esquerda
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player',{
                start: 143,
            end:151}),
            frameRate: 10,
            repeat: -1
        });

        // animação quando pressiona a tecla direita
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { frames: [143,144,145,146,147,148,149,150,151] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { frames: [104,105,106,107,108,109,110,111,112]}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { frames: [130,131,132,133,134,135,136,137,138] }),
            frameRate: 10,
            repeat: -1
        });        

        // a sprite do nosso jogador criada através da physics system
        this.player = this.physics.add.sprite(50, 100, 'player', 6);
        
        // impedir que saia do mapa
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        this.player.setCollideWorldBounds(true);
        
        // não passar pelos obstáculos
        this.physics.add.collider(this.player, obstacles);

        // limitar a câmera ao mapa
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.roundPixels = true; // evitar distorção dos quadrados
    
        // teclas pressionadas pelo utilizadpr
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // onde os inimigos vão estar
        this.spawns = this.physics.add.group({ classType: Phaser.GameObjects.Zone });
        for(var i = 0; i < 30; i++) {
            var x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
            var y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);
            // parâmetros são x,y,width,height
            this.spawns.create(x, y, 20, 20);            
        }
        this.player.setScale(.5)
        // adicionar colisão
        this.physics.add.overlap(this.player, this.spawns, this.onMeetEnemy, false, this);
        // ficamos à espera de um "wake event"
        this.sys.events.on('wake', this.wake, this);

    },
    wake: function() {
        this.cursors.left.reset();
        this.cursors.right.reset();
        this.cursors.up.reset();
        this.cursors.down.reset();
    },
    onMeetEnemy: function(player, zone) {        
        // movemos a zona onde podemos encontar inimigos para outro sítio
        zone.x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
        zone.y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);

        // abanar a camara
        this.cameras.main.shake(300);
        
        this.input.stopPropagation();
        // começar a batalha
        this.scene.switch('BattleScene');                
    },
    update: function (time, delta)
    {             
        this.player.body.setVelocity(0);
        
        // Movimento Horizontal
        if (this.cursors.left.isDown)
        {
            this.player.body.setVelocityX(-80);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.setVelocityX(80);
        }
        // Movimento Vertical
        if (this.cursors.up.isDown)
        {
            this.player.body.setVelocityY(-80);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.body.setVelocityY(80);
        }        

        // Atualizar as animações em último e dar prioridade às animações left e right sobre as Up e Down
        if (this.cursors.left.isDown)
        {
            this.player.anims.play('left', true);
            this.player.flipX = true;
        }
        else if (this.cursors.right.isDown)
        {
            this.player.anims.play('right', true);
            this.player.flipX = false;
        }
        else if (this.cursors.up.isDown)
        {
            this.player.anims.play('up', true);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.anims.play('down', true);
        }
        else
        {
            this.player.anims.stop();
        }
    }
    
});

