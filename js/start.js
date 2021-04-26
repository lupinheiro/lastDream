/*
Trabalho Prático Phaser
Realizado por:
Luís Alonso nº 17506
Alberto Castro nº 17479
Engenharia Informática
Instituto Politécnico de Viana do Castelo
*/
var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 476,
    height: 350,
    zoom: 2,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true // definir como true para ver as zonas em que se encontram inimigos
        }
    },
    scene: [
        BootScene,
        WorldScene,
        BattleScene,
        UIScene
    ]
};
var game = new Phaser.Game(config);