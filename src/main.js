import './style.css'
import { createApp } from 'petite-vue'
import * as Tone from 'tone'

let sampler = null

createApp({
  root: null,
  pref: [],
  keyMap: {},
  playbackState: 'stopped', // 'stopped'|'playing'
  playbackInterval: 0.5, // seconds between notes
  async mounted(el) {
    this.root = el

    const resp = await fetch('./pref.json')
    this.pref = await resp.json()
    console.log(this.pref)
    
    // 动态生成urls和keyMap
    const sampleUrls = {}
    this.keyMap = {}
    this.pref.forEach(item => {
      sampleUrls[item.note] = item.sample
      this.keyMap[item.key] = item.note
    })
    
    // 初始化sampler
    sampler = new Tone.Sampler({
      urls: sampleUrls,
      release: 8,
      onload: () => {
        let i = 0
        const test = setInterval(()=>{
          sampler.triggerAttackRelease(this.pref[i++].note, '8n')
          if (i >= this.pref.length) {
            clearInterval(test)
          }
        }, 120)
      }
    }).toDestination()

    await Tone.loaded()
    document.addEventListener("keydown", this.handleKeyDown.bind(this))
    document.addEventListener("keyup", this.handleKeyUp.bind(this))
  },
  handleClick(e) {
    this.playNote(this.keyMap[e.currentTarget.dataset.key])
  },
  handleKeyDown(e) {
    if (!e.repeat && this.keyMap[e.key]) {
      this.playNote(this.keyMap[e.key])
      this.root.querySelector(`[data-key="${e.key}"]`).classList.add("active")
    }
  },
  handleKeyUp(e) {
    if (!e.repeat && this.keyMap[e.key]) {
      this.root.querySelector(`[data-key="${e.key}"]`).classList.remove("active")
    }
  },
  playNote(note) {
    console.log('note:', note)
    // synth.triggerAttackRelease(note, "8n")
    sampler.triggerAttackRelease(note, "8n")
  }
}).mount()