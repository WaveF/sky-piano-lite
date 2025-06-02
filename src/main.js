import './style.css'
import { createApp, nextTick } from 'petite-vue'
import { animate, stagger } from 'animejs';
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
  sheetList: [],
  record: [],
  recordStart: 0,
  isSheetListShowing: false,
  isPlaying: false,
  isRecording: false,
  async mounted(el) {
    this.root = el
    console.clear()
    console.log('visit -> https://github.com/WaveF/sky-piano-lite')

    const resp = await fetch('./pref.json')
    this.pref = await resp.json()
    console.log('读取pref.json', this.pref)

    this.bgImage = this.pref.bgImage
    this.bgColor = this.pref.bgColor
    this.showNotes = this.pref.showNotes
    
    // 动态生成urls和keyMap
    const sampleUrls = {}
    this.keyMap = {}
    this.pref.samples.forEach(item => {
      const url = `./samples/${this.pref.instrument}/${item.sample}`
      sampleUrls[item.note] = url
      this.keyMap[item.key] = item.note
    })
    
    // 初始化sampler
    sampler = new Tone.Sampler({
      urls: sampleUrls,
      release: 8,
      onload: () => this.loaded = true,
    }).toDestination()

    await Tone.loaded()
    await Tone.start() // 确保 AudioContext resume
    sampler.triggerAttackRelease("C4", "8n", undefined, 0)

    // iOS Safari 会无视 user-scalable=no 和 touch-action: manipulation; 因此需要屏蔽双击
    document.addEventListener('dblclick', e => { e.preventDefault() }, { passive: false })
    document.addEventListener("keydown", this.onPianoKeyDown.bind(this))
  },
  // 音键双击
  onPianoDblClick(e) {
    console.log('ignore dblclick')
  },
  // 音键单击
  onPianoPointerDown(e) {
    const key = e.currentTarget.dataset.key
    this.playNote(this.keyMap[e.currentTarget.dataset.key])
    requestAnimationFrame(() => this.playNoteAnimate(key))
  },
  // 音键按键
  onPianoKeyDown(e) {
    const key = e.key
    if (!e.repeat && this.keyMap[key]) {
      this.playNote(this.keyMap[key])
      requestAnimationFrame(() => this.playNoteAnimate(key))
    }
  },
  // 播放音键动画
  playNoteAnimate(key) {
    this.currentKey = key

    const btn = this.root.querySelector(`[data-key="${key}"]`)
    animate(btn, {
      scale: [1, 0.8, 1],
      duration: 300,
      easing: 'outCubic'
    })

    const icon = btn.querySelector(".icon")
    animate(icon, {
      rotateY: [0, 360],
      duration: 700,
      easing: 'outCubic'
    })
  },
  // 播放音键声音
  playNote(note) {
    this.currentNote = note
    sampler.triggerAttackRelease(note, "8n", Tone.now())
    if (this.isRecording) {
      nextTick(()=>{
        const current = Tone.now()
        const time = +(current - this.recordStart).toFixed(3)

        const step = JSON.stringify({time,type:'key',value:this.currentNote})
        this.record.push(step)
        console.log(step)
      })
    } else {
      console.log(note)
    }
  },
  // 显示曲谱列表
  async showSheetList() {
    const resp = await fetch('./sheets.json?v=' + Date.now())
    this.sheetList = await resp.json()
    console.log(this.sheetList)
    this.isSheetListShowing = true

    nextTick(()=>{
      const backdrop = this.root.querySelector('.backdrop')
      animate(backdrop, {
        opacity: [0, 1],
        duration: 300
      })
      const sheetBtns = this.root.querySelectorAll('.sheet-btn')
      animate(sheetBtns, {
        opacity: [0, 1],
        scale: [0, 1],
        delay: stagger(100),
        duration: 300
      })
    })
  },
  // 隐藏曲谱列表
  hideSheetList(e) {
    // 只有点击到 backdrop 自身时才关闭（不是子按钮）
    if (e.target === e.currentTarget) {
      const backdrop = this.root.querySelector('.backdrop')
      animate(backdrop, {
        opacity: [1, 0],
        duration: 300,
        onComplete: (self)=>{
          this.isSheetListShowing = false
        }
      })
    }
  },
  // 选择曲谱文件
  async selectSheetFile() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
        multiple: false
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      const json = JSON.parse(text);
      this.playSheet(json, true);
    } catch (err) {
      console.error('无法加载本地曲谱:', err);
    }
    this.isSheetListShowing = false
  },
  // 加载曲谱
  async loadSheet(sheetUrl) {
    try {
      const resp = await fetch(sheetUrl + '?v=' + Date.now)
      if (!resp.ok) throw new Error('Response not ok')
      const sheet = await resp.json()
      console.log(sheet)
      this.playSheet(sheet, true)
    } catch (err) {
      console.error('加载曲谱失败:', err)
    }
    this.isSheetListShowing = false
  },
  // 播放曲谱
  async playSheet(json, animate = false) {
    if (this.isPlaying) {
      const transport = Tone.getTransport();
      transport.stop();
      transport.cancel();
      transport.position = 0;
      this.isPlaying = false;
    }
    const events = json.sheet;
    let bpm = json.defaultBpm || 90;
    let beatDuration = 60 / bpm;

    // 获取 Transport 实例
    const transport = Tone.getTransport();

    // 为每个事件计算“绝对秒数”
    let timeline = [];
    let lastBpmChangeTime = 0;
    let lastBpmChangeBeat = 0;

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      let time;
      if (typeof e.time === 'string' && e.time.startsWith('+')) {
        const offset = parseFloat(e.time.slice(1));
        time = (timeline.length > 0 ? timeline[timeline.length - 1].absoluteTime : 0) / beatDuration + offset;
      } else {
        time = e.time ?? i * 0.5;
      }

      // 如果是 tempo 改变事件，更新 bpm 和记录参考点
      if (e.type === 'tempo') {
        const absoluteTime = (time - lastBpmChangeBeat) * beatDuration + lastBpmChangeTime;
        bpm = e.value;
        beatDuration = 60 / bpm;
        lastBpmChangeTime = absoluteTime;
        lastBpmChangeBeat = time;
        continue;
      }

      // 对于 key 播放事件，计算实际时间
      const absoluteTime = (time - lastBpmChangeBeat) * beatDuration + lastBpmChangeTime;
      timeline.push({ ...e, absoluteTime });
    }

    // 启动 Transport
    transport.cancel(); // 清除旧计划
    transport.bpm.value = json.defaultBpm;

    transport.cancel(); // 清除旧计划
    timeline.forEach(({ absoluteTime, value }) => {
      transport.schedule(time => {
        const notes = Array.isArray(value) ? value : [value];
        notes.forEach(note => {
          sampler.triggerAttackRelease(note, "8n", time);
        });
        if (animate) {
          this.currentNote = notes[0];
          const keyEntry = Object.entries(this.keyMap).find(([, note]) => note === notes[0]);
          if (keyEntry) {
            const [key] = keyEntry;
            requestAnimationFrame(() => this.playNoteAnimate(key));
          }
        }
      }, absoluteTime);
    });

    transport.stop();
    transport.position = 0;

    if (!transport.state || transport.state === "stopped") {
      // 稍微延迟开始
      transport.start("+0.01"); 
      this.isPlaying = true;
      if (timeline.length > 0) {
        const lastTime = timeline[timeline.length - 1].absoluteTime;
        transport.scheduleOnce(() => {
          this.isPlaying = false;
        }, lastTime + 1);
      }
    }
  },
  // 开关录制
  toggleRecording() {
    this.isRecording = !this.isRecording
    if (this.isRecording) {
      this.record = []
      this.recordStart = Tone.now()
    } else {
      // console.log(this.record.join(',\n'))
      // 默认记录绝对时间值，下面会转为相对时间值
      let lastTime = 0;
      const relativeSheet = this.record.map((entry, i) => {
        const { time, ...rest } = JSON.parse(entry);
        const relTime = i === 0 ? 0 : +(time - lastTime).toFixed(3);
        lastTime = time;
        return JSON.stringify({ time: i === 0 ? 0 : `+${relTime}`, ...rest });
      })
      console.log(relativeSheet.join(',\n'))
      this.saveSheetFile(relativeSheet)
    }
  },
  // 保存曲谱
  saveSheetFile(sheet) {
    const fileContent = {
      name: '录制的曲谱',
      author: '',
      email: '',
      sampler: 'piano',
      defaultBpm: this.pref?.defaultBpm || 60,
      sheet: sheet.map(s => JSON.parse(s)),
    };
    const blob = new Blob([JSON.stringify(fileContent, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'music.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
  // 恢复声音
  async resumeAudio() {
    await Tone.start()
    const audio = this.root.querySelector('#resume')
    console.log(audio)
    audio.volume = 0.8
    audio.play()
  },
  unmounted() {
    document.removeEventListener("keydown", this.onPianoKeyDown)
  }
}).mount()