import './style.css'
import { createApp, nextTick } from 'petite-vue'
import * as Tone from 'tone'

let sampler = null

createApp({
  root: null,
  loaded: false,
  pref: [],
  keyMap: {},
  bgImage: '',
  bgColor: '',
  showNotes: true,
  currentNote: null,
  currentKey: null,
  async mounted(el) {
    this.root = el

    const resp = await fetch('./pref.json')
    this.pref = await resp.json()
    console.log(this.pref)

    this.bgImage = this.pref.bgImage
    this.bgColor = this.pref.bgColor
    this.showNotes = this.pref.showNotes
    
    // 动态生成urls和keyMap
    const sampleUrls = {}
    this.keyMap = {}
    this.pref.samples.forEach(item => {
      sampleUrls[item.note] = item.sample
      this.keyMap[item.key] = item.note
    })
    
    // 初始化sampler
    sampler = new Tone.Sampler({
      urls: sampleUrls,
      release: 8,
      onload: () => this.loaded = true,
    }).toDestination()

    await Tone.loaded()
    document.addEventListener("keydown", this.onKeyDown.bind(this))
    document.addEventListener('dblclick', e => {
      /* iOS Safari 会无视 user-scalable=no
        和 touch-action: manipulation;
        因此需要屏蔽双击
      */
      e.preventDefault()
    }, { passive: false })
  },
  onDblClick(e) {
    
  },
  onPointerDown(e) {
    const key = e.currentTarget.dataset.key
    this.playNote(this.keyMap[e.currentTarget.dataset.key])
    this.playNoteAnimate(key)
  },
  onKeyDown(e) {
    if (!e.repeat && this.keyMap[e.key]) {
      this.playNote(this.keyMap[e.key])
      this.playNoteAnimate(e.key)
    }
  },
  playNoteAnimate(key) {
    this.currentKey = key

    const btn = this.root.querySelector(`[data-key="${key}"]`)
    btn.animate([
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(0.8)', offset:0.5 },
      { transform: 'scale(1)', offset: 1 }
    ],
    {
      duration: 300,
      easing: 'ease-in-out'
    })

    const icon = btn.querySelector(".icon")
    icon.animate([
      { transform: 'rotateY(0deg)', offset: 0 },
      { transform: 'rotateY(360deg)', offset: 0 },
    ],
    {
      duration: 700,
      easing: 'ease-in-out'
    })
  },
  playNote(note) {
    this.currentNote = note
    sampler.triggerAttackRelease(note, "8n")
    nextTick(()=>{
      console.log({
        note: this.currentNote,
        key: this.currentKey,
      })
    })
    
  },
  unmounted() {
    document.removeEventListener("keydown", this.onKeyDown)
  }
}).mount()