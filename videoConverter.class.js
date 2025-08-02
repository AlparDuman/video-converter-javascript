class VideoConverter {
  #ffmpeg;

  #element_status;
  #element_video;

  #config_video_preset;
  #config_video_ref;
  #config_video_resolution;
  #config_video_framerate;
  #config_target_size;
  #config_audio_bitrate;
  #config_show_console;

  #console_messages;
  #console_message_prev;

  #file_duration;


  constructor(element_uploader, element_status, element_progress, element_video) {
    // const { FFmpeg } = window.FFmpegWASM;
    // this.#ffmpeg = new FFmpeg({ log: true });
    
    this.#ffmpeg = new window.FFmpegWASM.FFmpeg({ log: true });

    this.#element_status = element_status;
    this.#element_video = element_video;

    this.#config_target_size = 0;
    this.#config_audio_bitrate = 0;
    this.#config_video_preset = 'ultrafast';
    this.#config_video_ref = 1;
    this.#config_video_resolution = [null, null];
    this.#config_video_framerate = 0;
    this.#config_show_console = false;

    this.#console_messages = [];
    this.#console_message_prev = '';

    this.#file_duration = 0;

    this.#ffmpeg.on('log', ({ message }) => {
      this.#console_messages.push(message);
      if (this.#config_show_console)
        console.log(`[ffmpeg] ${message}`);
      if (message.includes(' time=')) {
        let done = message.split(' time=')[1].split(' ')[0].split(/[:\.]/);
        done = ((done[0] * 60 + done[1]) * 60 + done[2]) * 100 + done[3] * 1;
        element_progress.textContent = `${Math.floor(done / this.#file_duration)}%`;
        this.#console_message_prev = this.#console_messages?.[this.#console_messages.length - 1];
      } else if (message.includes('Aborted()'))
        element_progress.textContent = '';
    });

    element_uploader.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (file != undefined)
        this.#convert(file);
    });
  }

  // get & set preset

  getPreset() {
    return this.#config_video_preset;
  }

  setPreset(preset) {
    if ([
      'ultrafast',
      'superfast',
      'veryfast',
      'faster',
      'fast',
      'medium',
      'slow',
      'slower',
      'veryslow',
      'placebo'
    ].includes(preset)) {
      this.#config_video_preset = preset;
      switch (preset) {
        case 'veryfast':
        case 'superfast':
        case 'ultrafast':
          this.#config_video_ref = 1;
          break;
        case 'medium':
        case 'fast':
        case 'faster':
          this.#config_video_ref = 2;
          break;
        case 'slower':
        case 'slow':
          this.#config_video_ref = 3;
          break;
        default:
          this.#config_video_ref = 4;
      }
    }
  }

  // get & set show console

  getShowConsole() {
    return this.#config_show_console;
  }

  setShowConsole(doPrint) {
    this.#config_show_console = doPrint === true ? true : false;
  }

  // get & set target size

  getTargetSize() {
    return this.#config_target_size;
  }

  setTargetSize(bytes) {
    if (typeof bytes == 'number' && !isNaN(bytes) && bytes >= 1 && bytes <= Number.MAX_SAFE_INTEGER)
      this.#config_target_size = Math.floor(bytes);
    else
      this.#config_target_size = 0;
  }

  // get & set audio bitrate

  getAudioBitrate() {
    return this.#config_audio_bitrate;
  }

  setAudioBitrate(bytes) {
    if (typeof bytes == 'number' && !isNaN(bytes) && bytes >= 1 && bytes <= Number.MAX_SAFE_INTEGER)
      this.#config_audio_bitrate = Math.floor(bytes);
    else
      this.#config_audio_bitrate = 0;
  }

  // get & set resolution

  getResolution() {
    return this.#config_video_resolution;
  }

  setResolution(dimensions) {
    if (Array.isArray(dimensions))
      for (let i = 0; i <= 1; i++)
        if (typeof dimensions[i] == 'number' && !isNaN(dimensions[i]) && dimensions[i] >= 1 && dimensions[i] <= Number.MAX_SAFE_INTEGER)
          this.#config_video_resolution[i] = Math.round(dimensions[i]);
        else
          this.#config_video_resolution[i] = null;
  }

  // get & set framerate

  getFramerate() {
    return this.#config_video_framerate;
  }

  setFramerate(fps) {
    if (typeof fps == 'number' && !isNaN(fps) && fps >= 1)
      this.#config_video_framerate = Math.floor(fps);
    else
      this.#config_video_framerate = 0;
  }

  // convert video mt

  async #parallelConvert() {
    const NUM_WORKERS = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency)
      ? navigator.hardwareConcurrency
      : 4;

    // Worker code as a function string
    const workerCode = () => {
      self.window = self;
      importScripts('http://localhost/ffmpeg/ffmpeg.min.js');
      const ffmpeg = new window.FFmpegWASM.FFmpeg({ log: true });








      self.onmessage = (e) => {
        const input = e.data;
        // Simulate some async work (e.g. complex calculation or ffmpeg processing)
        // Here simply return the square to demo
        self.postMessage({ input, result: input * input });
      };
    };

    // Convert worker code to a Blob URL
    const codeAsString = `(${workerCode.toString()})()`;
    const blob = new Blob([codeAsString], { type: 'application/javascript' });
    const workerBlobUrl = URL.createObjectURL(blob);
    const workers = [];

    function runWorkerTask(worker, data) {
      return new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (err) => reject(err);
        worker.postMessage(data);
      });
    }

    // Create workers and tasks
    for (let i = 0; i < NUM_WORKERS; i++) {
      workers[i] = new Worker(workerBlobUrl);
    }

    // Start all workers and get an array of promises
    const workerPromises = workers.map((worker, i) => runWorkerTask(worker, i + 1));

    // Wait for all workers to finish
    const results = await Promise.all(workerPromises);

    // Optionally terminate workers after done
    workers.forEach(worker => worker.terminate());

    console.log(results);












    console.log('EOF');





  }
























  // convert video

  async #convert(file) {

    for (let i = 0; i <= 2; i++) {
      let tagIteration = ['Quick', 'Balanced', 'Quality'][i];
      this.#config_video_preset = ['ultrafast', 'medium', 'placebo'][i];

      let query = [
        '-v', 'info',
        '-i', file.name,
        '-preset', this.#config_video_preset,
        '-movflags', '+faststart',
        '-tag:v', 'avc1',
        '-map', '0:v:0',
        '-c:v', 'libx264',
        '-fps_mode', 'vfr',
        '-pix_fmt', 'yuv420p',
        '-x264-params', `ref=${this.#config_video_ref}`,
        '-tag:a', 'mp4a',
        '-map', '0:a:0',
        '-c:a', 'aac'
      ];

      this.#element_status.textContent = `[${tagIteration}] Loading FFmpeg core...`;

      if (this.#ffmpeg.loaded != true)
        await this.#ffmpeg.load({
          coreURL: 'ffmpeg-core.js'/*/,
          wasmURL: 'ffmpeg/ffmpeg-core.wasm',
          workerURL: 'ffmpeg/ffmpeg-core.worker.js',
          classWorkerURL: 'ffmpeg/ffmpeg-core.worker.js'/*/
        });

      this.#element_status.textContent = `[${tagIteration}] Preparing file...`;

      await this.#ffmpeg.writeFile(file.name, new Uint8Array(await file.arrayBuffer()));

      await this.#ffmpeg.ffprobe([
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        file.name
      ]);

      let last_console_output = this.#console_messages?.[this.#console_messages.length - 1];
      if (typeof last_console_output != 'number' && !isNaN(last_console_output) && last_console_output > 0)
        this.#file_duration = last_console_output;

      if (this.#config_target_size >= 1 && this.#file_duration != undefined)
        query = query.concat([
          '-b:v',
          Math.floor(this.#config_target_size / this.#file_duration - this.#config_audio_bitrate).toString()
        ]);

      if (this.#config_video_resolution[0] != null && this.#config_video_resolution[1] != null)
        query = query.concat([
          '-vf',
          `scale='min(${this.#config_video_resolution[0]},iw)':'min(${this.#config_video_resolution[1]},ih)':force_original_aspect_ratio=decrease`,
        ]);

      if (this.#config_video_framerate != 0)
        query = query.concat([
          '-fpsmax',
          this.#config_video_framerate.toString()
        ]);

      if (this.#config_audio_bitrate != 0)
        query = query.concat([
          '-b:a',
          this.#config_audio_bitrate.toString()
        ]);

      query.push('output.mp4');

      this.#element_status.textContent = `[${tagIteration}] Converting video to mp4...`;
      if (this.#config_show_console)
        console.time('exec');

      await this.#ffmpeg.exec(query);

      if (this.#config_show_console)
        console.timeEnd('exec');

      this.#element_status.textContent = `[${tagIteration}] Retrieving output...`;

      this.#element_video.src = URL.createObjectURL(new Blob([(await this.#ffmpeg.readFile('output.mp4')).buffer], { type: 'video/mp4' }));
      this.#element_video.load();
      this.#element_video.play();
    }

    this.#element_status.textContent = "Conversion complete!";
  }

}