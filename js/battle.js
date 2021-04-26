/*
Trabalho Prático Phaser
Realizado por:
Luís Alonso nº 17506
Alberto Castro nº 17479
Engenharia Informática
Instituto Politécnico de Viana do Castelo
*/
class HealthBar {

    constructor (scene, x, y)
    {
        this.bar = new Phaser.GameObjects.Graphics(scene);

        this.x = x+130;
        this.y = y+100;
        this.value = 100;
        this.p = 76 / 100;

        this.draw();

        scene.add.existing(this.bar);
    }

    decrease (damage) {
        this.value -= damage;
        if (this.value < 0){
            this.value = 0;
        }
            this.draw();

            return (this.value === 0);
        }

        decreaseMagic(magic){
            this.value -= magic;
            if (this.value < 0){
                this.value = 0;
            }
            this.draw();

            return (this.value === 0);
        }


    draw ()
    {
        this.bar.clear();

        //  BG
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, 80, 16);

        //  Health

        this.bar.fillStyle(0xffffff);
        this.bar.fillRect(this.x + 2, this.y + 2, 76, 12);

        if (this.value < 30)
        {
            this.bar.fillStyle(0xff0000);
        }
        else
        {
            this.bar.fillStyle(0x00ff00);
        }

        var d = Math.floor(this.p * this.value);

        this.bar.fillRect(this.x + 2, this.y + 2, d, 12);
    }

}


var BattleScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function BattleScene ()
    {
        Phaser.Scene.call(this, { key: "BattleScene" });
    },
    preload: function() {
    this.load.image("background", 'assets/Battleground3.png');
    this.load.image("dragon",'assets/dragon.png');
    },
    create: function ()
    {    
        // mudar a côr do fundo para verde
        this.add.image(0, 0, 'background').setOrigin(0).setScale(0.25);
        this.startBattle();
        // on wake event chamamos a StartBattle
        this.sys.events.on('wake', this.startBattle, this);
    },
    startBattle: function() {
        // jogador - warrior
        var warrior = new PlayerCharacter(this, 340, 210, "player", 251, "Warrior", 100, 50,5);
        this.add.existing(warrior);
        
        // jogador - mage
        var mage = new PlayerCharacter(this, 340, 170, "sideKick", 143 , "Mage", 80, 50, 25);
        this.add.existing(mage);            
        
        var dragon = new Enemy(this, 50, 190, "dragon", null, "Dragon", 50, 5, 10);
        this.add.existing(dragon).setScale(0.5);
        
        var demon = new Enemy(this, 50, 150, "demon", null,"Demon", 50, 3, 15);
        this.add.existing(demon).setScale(0.5);
        
        // array dos jogadores
        this.heroes = [ warrior, mage ];
        // array dos inimigos
        this.enemies = [ demon, dragon ];
        // array com os jogadores e inimigos que atacam
        this.units = this.heroes.concat(this.enemies);
        
        this.index = -1; // unidade ativa neste momento
        
        this.scene.run("UIScene");        
    },
    nextTurn: function() {  
        // verificar se há vitória ou GameOver
        if(this.checkEndBattle()) {           
            this.endBattle();
            return;
        }
        do {
            // unidade ativa neste momento
            this.index++;
            // se já não há unidades, começamos do princípio
            if(this.index >= this.units.length) {
                this.index = 0;
            }            
        } while(!this.units[this.index].living);
        // se é a vez do jogador
        if(this.units[this.index] instanceof PlayerCharacter) {
            // precisamos que o jogador selecione a ação, e depois o inimigo
            this.events.emit("PlayerSelect", this.index);
        } else { // se não é a vez do jogador
            // escolhe um jogador random para sofrer o ataque
            var r;
            do {
                r = Math.floor(Math.random() * this.heroes.length);
            } while(!this.heroes[r].living) 
            // chama a função de ataque do inimigo
            this.units[this.index].attack(this.heroes[r]);
            // abanar a camara
            this.cameras.main.shake(200, 0.01);
            // timer para esperar pelo próximo turno
            this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this });
        }
    },     
    // verificar se há vitória ou GameOver
    checkEndBattle: function() {        
        var victory = true;
        // se todos os inimigos estão "mortos", temos vitória
        for(var i = 0; i < this.enemies.length; i++) {
            if(this.enemies[i].living)
                victory = false;
        }
        var gameOver = true;
        // se todos os jogadores estão "mortos", temos GameOver
        for(var i = 0; i < this.heroes.length; i++) {
            if(this.heroes[i].living)
                gameOver = false;
        }
        return victory || gameOver;
    },
    // quando o jogador seleciona o inimigo que quer atacar
    receivePlayerSelection: function(action, target) {
        if(action === 0) {
            this.units[this.index].attack(this.enemies[target]);
            // abanar a camara
            this.cameras.main.shake(200, 0.01);
        }
        if(action === 1){
            this.units[this.index].spell(this.enemies[target]);
            // abanar a camara
            this.cameras.main.shake(200, 0.01);
        }

        // timer para esperar pelo próximo turno
        this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this });        
    },
    endBattle: function() {       
        // limpa o estado, remove as sprites
        this.heroes.length = 0;
        this.enemies.length = 0;
        for(var i = 0; i < this.units.length; i++) {
            // link item
            this.units[i].destroy();            
        }
        this.units.length = 0;
        // esconde o UI
        this.scene.sleep('UIScene');
        // retorna à WolrdScene
        this.scene.switch('WorldScene');
    }
});

// class dos os jogadores e inimigos
var Unit = new Phaser.Class({
    Extends: Phaser.GameObjects.Sprite,

    initialize:

    function Unit(scene, x, y, texture, frame, type, value, damage, magic) {
        Phaser.GameObjects.Sprite.call(this, scene, x, y, texture, frame)
        this.type = type;
        this.value= new HealthBar(scene, x - 100, y - 110);
        this.damage = damage; // damage default
        this.magic = magic;
        this.living = true;         
        this.menuItem = null;
    },
    // é usado para dizer ao menu item quando uma personagem (inimigo ou jogador) está morto
    setMenuItem: function(item) {
        this.menuItem = item;
    },
    // atacar o inimigo selecionado
    attack: function(target) {
        if(target.living) {
            target.takeDamage(this.damage);
            this.scene.events.emit("Message", this.type + " attacks " + target.type + " for " + this.damage + " damage");
        }
    },
    // atacar o inimigo selecionado
    spell: function(target) {
        if(target.living) {
            target.takeMagicDamage(this.magic);
            this.scene.events.emit("Message", this.type + " attacks " + target.type + " for " + this.magic + " Magic damage");
        }
    },
    takeDamage: function(damage) {
        if(this.value.decrease(damage)){
            this.menuItem.unitKilled();
            this.living = false;
            this.visible = false;
            this.menuItem = null;
        }
    },
    takeMagicDamage: function(magic){
        if(this.value.decreaseMagic(magic)){
            this.menuItem.unitKilled();
            this.living = false;
            this.visible = false;
            this.menuItem = null;
        }
    }
});

var Enemy = new Phaser.Class({
    Extends: Unit,

    //value = hp
    initialize:
    function Enemy(scene, x, y, texture, frame, type, value, damage) {
        Unit.call(this, scene, x, y, texture, frame, type, value, damage);
    }
});

var PlayerCharacter = new Phaser.Class({
    Extends: Unit,

    initialize:
    function PlayerCharacter(scene, x, y, texture, frame, type, value, damage,magic) {
        Unit.call(this, scene, x, y, texture, frame, type, value, damage,magic);
        // espelhar a imagem
        this.flipX = true;
        this.setScale(0.5);
    }
});

var MenuItem = new Phaser.Class({
    Extends: Phaser.GameObjects.Text,
    
    initialize:
            
    function MenuItem(x, y, text, scene) {
        Phaser.GameObjects.Text.call(this, scene, x, y, text, { color: "#ffffff", align: "left", fontSize: 15});
    },
    
    select: function() {
        this.setColor("#ff3838");
    },
    
    deselect: function() {
        this.setColor("#ffffff");
    },
    // quando a jogador ou inimigo associado são mortos
    unitKilled: function() {
        this.active = false;
        this.visible = false;
    }
    
});

// class menu, é onde vamos ter os diferentes "items" presentes no menu da BattleScene
var Menu = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    
    initialize:
            
    function Menu(x, y,  scene,  heroes) {
        Phaser.GameObjects.Container.call(this, scene, x, y);
        this.menuItems = [];
        this.menuItemIndex = 0;
        this.x = x;
        this.y = y;
        this.selected = false;
    },     
    addMenuItem: function(unit) {
        var menuItem = new MenuItem(0, this.menuItems.length * 20, unit, this.scene);
        this.menuItems.push(menuItem);
        this.add(menuItem); 
        return menuItem;
    },  
    // navegar no menu
    moveSelectionUp: function() {
        this.menuItems[this.menuItemIndex].deselect();
        do {
            this.menuItemIndex--;
            if(this.menuItemIndex < 0)
                this.menuItemIndex = this.menuItems.length - 1;
        } while(!this.menuItems[this.menuItemIndex].active);
        this.menuItems[this.menuItemIndex].select();
    },
    moveSelectionDown: function() {
        this.menuItems[this.menuItemIndex].deselect();
        do {
            this.menuItemIndex++;
            if(this.menuItemIndex >= this.menuItems.length)
                this.menuItemIndex = 0;
        } while(!this.menuItems[this.menuItemIndex].active);
        this.menuItems[this.menuItemIndex].select();
    },
    // selecionar o menu como um todo e marcar o elemento escolhido
    select: function(index) {
        if(!index)
            index = 0;       
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex = index;
        while(!this.menuItems[this.menuItemIndex].active) {
            this.menuItemIndex++;
            if(this.menuItemIndex >= this.menuItems.length)
                this.menuItemIndex = 0;
            if(this.menuItemIndex == index)
                return;
        }        
        this.menuItems[this.menuItemIndex].select();
        this.selected = true;
    },
    // desmarcar menu
    deselect: function() {        
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex = 0;
        this.selected = false;
    },
    confirm: function() {
        // quando o jogador confirmar a seleção, executar
    },
    // limpar o menu e remover todos os items
    clear: function() {
        for(var i = 0; i < this.menuItems.length; i++) {
            this.menuItems[i].destroy();
        }
        this.menuItems.length = 0;
        this.menuItemIndex = 0;
    },
    // voltar a criar o menu items
    remap: function(units) {
        this.clear();        
        for(var i = 0; i < units.length; i++) {
            var unit = units[i];
            unit.setMenuItem(this.addMenuItem(unit.type));            
        }
        this.menuItemIndex = 0;
    }
});

var HeroesMenu = new Phaser.Class({
    Extends: Menu,
    
    initialize:
            
    function HeroesMenu(x, y, scene) {
        Menu.call(this, x, y, scene);
    }
});

var ActionsMenu = new Phaser.Class({
    Extends: Menu,
    
    initialize:
            
    function ActionsMenu(x, y, scene) {
        Menu.call(this, x, y, scene);   
        this.addMenuItem("Attack");
        this.addMenuItem("Magic");
    },
    confirm: function() { 
        // selecionamos uma ação, vamos para o próximo menu e escolhemos um dos inimigos para aplicar a ação
        this.scene.events.emit("SelectedAction",this.menuItemIndex);
    }
    
});

var EnemiesMenu = new Phaser.Class({
    Extends: Menu,
    
    initialize:
            
    function EnemiesMenu(x, y, scene) {
        Menu.call(this, x, y, scene);        
    },       
    confirm: function() {      
        // o jogador escolheu o inimigo e anexamos o seu id
        this.scene.events.emit("Enemy", this.menuItemIndex);
    }
});

// User Interface scene
var UIScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function UIScene ()
    {
        Phaser.Scene.call(this, { key: "UIScene" });
    },

    create: function ()
    {
        // background do menu
        this.graphics = this.add.graphics();
        this.graphics.lineStyle(1, 0xffffff);
        this.graphics.fillStyle(0x031f4c, 1);
        this.graphics.strokeRect(2, 230, 160, 150);
        this.graphics.fillRect(2, 230, 160, 150);
        this.graphics.strokeRect(113, 230, 160, 150);
        this.graphics.fillRect(113, 230, 160, 150);
        this.graphics.strokeRect(273, 230, 200, 150);
        this.graphics.fillRect(273, 230, 200, 150);


        // container para ter todos os menus
        this.menus = this.add.container();
                
        this.heroesMenu = new HeroesMenu(283, 235, this);
        this.actionsMenu = new ActionsMenu(123, 235, this);
        this.enemiesMenu = new EnemiesMenu(12, 235, this);
        
        // o menu selecionado actualmente
        this.currentMenu = this.actionsMenu;
        
        // adicionar os menus ao container
        this.menus.add(this.heroesMenu);
        this.menus.add(this.actionsMenu);
        this.menus.add(this.enemiesMenu);
                
        this.battleScene = this.scene.get("BattleScene");                                
        
        // para poder pressionar a tecla e ser reconhecida
        this.input.keyboard.on("keydown", this.onKeyInput, this);   
        
        // quando é o turno do jogador
        this.battleScene.events.on("PlayerSelect", this.onPlayerSelect, this);
        
        // quando a ação no menu é selecionada
        // when the action on the menu is selected
        // for now we have only one action so we dont send and action id
        this.events.on("SelectedAction", this.onSelectedAction, this);
        
        // um inimigo é selecionado
        this.events.on("Enemy", this.onEnemy, this);
        
        // quando a scene receve um wake event
        this.sys.events.on('wake', this.createMenu, this);
        
        // a mensagem a descrever a ação
        this.message = new Message(this, this.battleScene.events);
        this.add.existing(this.message);        
        
        this.createMenu();     
    },
    createMenu: function() {
        // mapear os players para o menu item dos players
        this.remapHeroes();
        // mapear os imigos para o menu item dos inimigos
        this.remapEnemies();
        // primeiro turno
        this.battleScene.nextTurn(); 
    },
    onEnemy: function(index) {
        // quando escolhemos o inimigo, desmarcamos todos os menus e enviamos o evento com o id do inimigo
        this.heroesMenu.deselect();
        this.actionsMenu.deselect();
        this.enemiesMenu.deselect();
        this.currentMenu = null;
        this.battleScene.receivePlayerSelection(this.action,index);
    },
    onPlayerSelect: function(id) {
        // quando é a vez do jnaogador, seleciomos um jogador ativo dos menu items dos jogadores, e o primeiro item do menu item das actions
        // depois fazemos o actions menu ativo
        this.heroesMenu.select(id);
        this.actionsMenu.select(0);
        this.currentMenu = this.actionsMenu;
    },
    // o jogador escolhe quem quer atacar
    onSelectedAction: function(action) {
        this.action = this.actionsMenu.menuItemIndex;
        this.currentMenu = this.enemiesMenu;
        this.enemiesMenu.select(0);
    },
    remapHeroes: function() {
        var heroes = this.battleScene.heroes;
        this.heroesMenu.remap(heroes);
    },
    remapEnemies: function() {
        var enemies = this.battleScene.enemies;
        this.enemiesMenu.remap(enemies);
    },
    onKeyInput: function(event) {
        if(this.currentMenu && this.currentMenu.selected) {
            if(event.code === "ArrowUp") {
                this.currentMenu.moveSelectionUp();
            } else if(event.code === "ArrowDown") {
                this.currentMenu.moveSelectionDown();
            } else if(event.code === "ArrowRight" || event.code === "SHIFT") {
                this.currentMenu.deselect();
                this.currentMenu = this.actionsMenu;
                this.currentMenu.select(0);
            } else if(event.code === "Space") {
                this.currentMenu.confirm();
            } 
        }
    },
});

var Message = new Phaser.Class({

    Extends: Phaser.GameObjects.Container,

    initialize:
    function Message(scene, events) {
        Phaser.GameObjects.Container.call(this, scene, 240, 40);
        var graphics = this.scene.add.graphics();
        this.add(graphics);
        graphics.lineStyle(1, 0xffffff, 0.8);
        graphics.fillStyle(0x031f4c, 0.3);        
        graphics.strokeRect(-90, -15, 180, 30);
        graphics.fillRect(-90, -15, 180, 30);
        this.text = new Phaser.GameObjects.Text(scene, 0, 0, "", { color: "#ffffff", height: 175, width: 238 , fontSize: 13, wordWrap: { width: 180, useAdvancedWrap: true }});
        this.add(this.text);
        this.text.setOrigin(0.5);        
        events.on("Message", this.showMessage, this);
        this.visible = false;
    },
    showMessage: function(text) {
        this.text.setText(text);
        this.visible = true;
        if(this.hideEvent)
            this.hideEvent.remove(false);
        this.hideEvent = this.scene.time.addEvent({ delay: 2000, callback: this.hideMessage, callbackScope: this });
    },
    hideMessage: function() {
        this.hideEvent = null;
        this.visible = false;
    }
});
