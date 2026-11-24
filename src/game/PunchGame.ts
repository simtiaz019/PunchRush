import Phaser from 'phaser'
import type { Character, Difficulty, GameMode, RoundStats } from '../types'
import { difficultyConfig, modes } from './config'
import { blankStats, registerHit, registerMiss } from '../utils/game'

export type GameCallbacks = { onStats: (stats: RoundStats, remaining: number) => void; onFinish: (stats: RoundStats) => void; onCountdown: (n: number) => void; onImpact: () => void }

class ArenaScene extends Phaser.Scene {
  private target!: Phaser.GameObjects.Container
  private head!: Phaser.GameObjects.Image
  private body!: Phaser.GameObjects.Container
  private stats!: RoundStats
  private started = false
  private finishing = false
  private endAt = 0
  private velocity = new Phaser.Math.Vector2()
  private lastMove = 0
  private hitThisFrame = false
  private particles: Phaser.GameObjects.Arc[] = []
  constructor(private options: {character: Character; difficulty: Difficulty; mode: GameMode; callbacks: GameCallbacks}) { super('arena') }
  create() {
    const { width, height } = this.scale; const { character, difficulty, mode } = this.options
    this.stats = blankStats(modes[mode].duration, mode, difficulty)
    this.cameras.main.setBackgroundColor('#170a38')
    this.add.rectangle(width/2,height/2,width,height,0x170a38)
    for(let i=0;i<18;i++) this.add.circle(Phaser.Math.Between(0,width),Phaser.Math.Between(0,height), Phaser.Math.Between(2,7), i%2?0xffe63b:0xff7426, .23)
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512; const ctx=canvas.getContext('2d')!; const source = new Image();
    source.src = character.image; source.onload = () => { ctx.clearRect(0,0,512,512); ctx.save(); ctx.beginPath(); ctx.arc(256,256,228,0,Math.PI*2); ctx.clip(); ctx.drawImage(source,0,0,512,512); ctx.restore(); ctx.lineWidth=16; ctx.strokeStyle='#1b1039'; ctx.beginPath(); ctx.arc(256,256,228,0,Math.PI*2); ctx.stroke(); if(this.textures.exists('avatar')) this.textures.remove('avatar'); this.textures.addCanvas('avatar',canvas); this.head.setTexture('avatar') }
    if(this.textures.exists('avatar')) this.textures.remove('avatar'); this.textures.addCanvas('avatar', canvas)
    this.target = this.add.container(width/2,height/2)
    this.head = this.add.image(0,-35,'avatar').setDisplaySize(160,160)
    const shirt=this.add.ellipse(0,74,110,94,0xff7426).setStrokeStyle(7,0x1b1039)
    const leftShoe=this.add.ellipse(-37,126,62,27,0xffe63b).setStrokeStyle(6,0x1b1039)
    const rightShoe=this.add.ellipse(37,126,62,27,0xffe63b).setStrokeStyle(6,0x1b1039)
    this.body=this.add.container(0,0,[shirt,leftShoe,rightShoe]); this.target.add([this.body,this.head])
    const cfg=difficultyConfig[difficulty]; this.target.setScale(cfg.scale)
    // Only the cartoon face is a valid target; tapping the body is a miss.
    this.head.setInteractive(new Phaser.Geom.Circle(256,256,205), Phaser.Geom.Circle.Contains)
    this.head.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.hit(pointer))
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if(!this.hitThisFrame) this.miss(p) })
    this.scale.on('resize', () => this.keepInBounds())
    this.velocity.set(cfg.speed, cfg.speed*.62)
    this.countdown()
  }
  private countdown() { let n=3; const tick=() => { this.options.callbacks.onCountdown(n); const t=this.add.text(this.scale.width/2,this.scale.height/2,n>0?String(n):'PUNCH!',{fontFamily:'Arial Black, sans-serif',fontSize:n? '96px':'56px',color:'#ffe63b',stroke:'#ff7426',strokeThickness:10}).setOrigin(.5).setDepth(30); this.tweens.add({targets:t,scale:1.35,alpha:0,duration:700,onComplete:()=>t.destroy()}); if(n-- > 0) this.time.delayedCall(780,tick); else this.time.delayedCall(760,()=>this.start()) }; tick() }
  private start() { this.started=true; this.endAt=performance.now()+modes[this.options.mode].duration*1000; this.options.callbacks.onCountdown(-1); this.options.callbacks.onStats(this.stats,modes[this.options.mode].duration) }
  update(_: number, delta: number) {
    if(!this.started || this.finishing) return
    this.hitThisFrame=false
    const remaining=Math.max(0,(this.endAt-performance.now())/1000)
    if(remaining<=0) return this.finish()
    const cfg=difficultyConfig[this.options.difficulty], speed=cfg.speed*(this.options.mode==='moving'?1.42:1)
    if(performance.now()-this.lastMove>Phaser.Math.Between(500,1200)/(this.options.difficulty==='insane'?1.7:1)) { this.velocity.setToPolar(Phaser.Math.FloatBetween(0,Math.PI*2),speed); this.lastMove=performance.now(); if(Math.random()>.6) this.tweens.add({targets:this.target,y:'-=38',duration:120,yoyo:true,ease:'Sine.easeOut'}) }
    this.target.x += this.velocity.x*delta/1000; this.target.y += this.velocity.y*delta/1000; this.keepInBounds();
    this.target.rotation=Math.sin(performance.now()/120)*.025; this.options.callbacks.onStats(this.stats,remaining)
  }
  private keepInBounds() { const sideMargin=90, topMargin=95, bottomMargin=100; const w=this.scale.width,h=this.scale.height; if(this.target.x<sideMargin||this.target.x>w-sideMargin) this.velocity.x*=-1; if(this.target.y<topMargin||this.target.y>h-bottomMargin) this.velocity.y*=-1; this.target.x=Phaser.Math.Clamp(this.target.x,sideMargin,w-sideMargin); this.target.y=Phaser.Math.Clamp(this.target.y,topMargin,h-bottomMargin) }
  private hit(pointer: Phaser.Input.Pointer) { if(!this.started||this.finishing) return; this.hitThisFrame=true; this.stats=registerHit(this.stats); this.options.callbacks.onImpact();
    const word=['POW!','BAM!','BONK!','BOOM!'][Math.floor(Math.random()*4)], x=pointer.worldX,y=pointer.worldY;
    const glove=this.add.text(x,y,'👊',{fontSize:'54px'}).setOrigin(.5).setDepth(10); const text=this.add.text(x+18,y-34,word,{fontFamily:'Arial Black, sans-serif',fontSize:'27px',color:'#ffe63b',stroke:'#ff4b37',strokeThickness:6}).setOrigin(.5).setDepth(11);
    this.tweens.add({targets:[glove,text],y:'-=70',alpha:0,scale:1.4,duration:380,onComplete:()=>{glove.destroy();text.destroy()}})
    this.tweens.add({targets:this.target,scaleX:this.target.scaleX*1.22,scaleY:this.target.scaleY*.78,duration:55,yoyo:true,repeat:1}); this.tweens.add({targets:this.target,x:this.target.x+(this.target.x<x?-22:22),duration:80,yoyo:true})
    this.cameras.main.shake(65,.004); this.burst(x,y); this.options.callbacks.onStats(this.stats,Math.max(0,(this.endAt-performance.now())/1000))
  }
  private miss(pointer: Phaser.Input.Pointer) { if(!this.started||this.finishing) return; this.stats=registerMiss(this.stats); const t=this.add.text(pointer.worldX,pointer.worldY,'MISS!',{fontFamily:'Arial Black',fontSize:'17px',color:'#ff8eaa'}).setOrigin(.5);this.tweens.add({targets:t,alpha:0,y:'-=30',duration:280,onComplete:()=>t.destroy()});this.options.callbacks.onStats(this.stats,Math.max(0,(this.endAt-performance.now())/1000)); if(this.options.mode==='survival'&&this.stats.misses>=3)this.finish() }
  private burst(x:number,y:number) { for(let i=0;i<8;i++){const dot=this.add.circle(x,y,Phaser.Math.Between(3,7),i%2?0xffe63b:0xff7426).setDepth(8);this.particles.push(dot); this.tweens.add({targets:dot,x:x+Phaser.Math.Between(-65,65),y:y+Phaser.Math.Between(-65,65),alpha:0,duration:260,onComplete:()=>{dot.destroy();this.particles=this.particles.filter(p=>p!==dot)}})} }
  private finish() { if(this.finishing) return; this.finishing=true; this.target.disableInteractive(); this.options.callbacks.onStats(this.stats,0); this.options.callbacks.onFinish(this.stats) }
}

export class PunchGame {
  private game: Phaser.Game
  constructor(element: HTMLElement, options: {character: Character; difficulty: Difficulty; mode: GameMode; callbacks: GameCallbacks}) {
    const scene = new ArenaScene(options)
    this.game = new Phaser.Game({type:Phaser.AUTO,parent:element,width:Math.max(320,element.clientWidth),height:Math.max(400,element.clientHeight),backgroundColor:'#170a38',scene,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},input:{activePointers:2}})
  }
  destroy() { this.game.destroy(true) }
}
