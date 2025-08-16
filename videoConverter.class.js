class VideoConverter {



  #ffmpeg;
  #element_status;
  #element_video;
  #default_config;
  #available_presets;
  #cycle;
  #c_message;
  #duration;
  #prefix_status;



  constructor(element_parent) {

    // prepare
    this.#default_config = {
      'a_bitrate': null,
      's_target': null,
      'v_fps': null,
      'v_preset': 'placebo',
      'v_ref': 4,
      'v_res': [null, null]
    };
    this.#available_presets = [
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
    ];
    this.#cycle = 0;
    this.#duration = 1;
    this.#prefix_status = '';

    // create elements
    const element_input = document.createElement('input');
    this.#element_status = document.createElement('div');
    this.#element_video = document.createElement('video');

    // give attributes
    element_input.setAttribute('type', 'file');
    element_input.setAttribute('accept', 'video/*');
    this.#element_video.setAttribute('controls', '');

    // append to parent element
    element_parent.appendChild(element_input);
    element_parent.appendChild(this.#element_status);
    element_parent.appendChild(this.#element_video);

    // init ffmpeg
    this.#ffmpeg = new window.FFmpegWASM.FFmpeg({ log: true });

    this.#ffmpeg.on('log', ({ message }) => {
      if (message != this.#c_message) {
        this.#c_message = message;
        console.log(`[ffmpeg] ${message}`);
        if (message.includes(' time=')) {
          let done = message.split(' time=')[1].split(' ')[0].split(/[:\.]/);
          done = ((done[0] * 60 + done[1]) * 60 + done[2]) * 100 + done[3] * 1;
          this.#element_status.textContent = `${this.#prefix_status}Converting video ... ${Math.floor(done / this.#duration)}%`;
        } else if (message.includes('Aborted()'))
          this.#element_status.textContent = `${this.#prefix_status}Converting video ... 100%`;
      }
    });

    // event listener
    element_input.addEventListener('change', (event) => {
      this.#progressiveConvert(event.target.files?.[0]);
    });

  }



  async #progressiveConvert(file) {

    // get current cycle & force stop running worker
    const cycle = ++this.#cycle;
    this.#ffmpeg.terminate();

    // convert fast to get first quickly result
    if (cycle == this.#cycle) {
      this.#prefix_status = '';
      await this.#convert(file, {
        'a_bitrate': 128 * 1000,
        's_target': 9 * 1024 * 1024 * 8,
        'v_fps': 30,
        'v_preset': 'ultrafast',
        'v_ref': 1,
        'v_res': [640, 640]
      });
    }

    // autoplay first pass
    if (cycle == this.#cycle)
      this.#element_video.play();

    // convert slow to get high quality result
    /*if (cycle == this.#cycle) {
      this.#prefix_status = '(optional quality pass) ';
      await this.#convert(file, {
        'a_bitrate': 192 * 1000,
        's_target': 9 * 1024 * 1024 * 8,
        'v_fps': 60,
        'v_preset': 'placebo',
        'v_ref': 3,
        'v_res': [1280, 1280]
      });
    }*/

  }



  #applyConfig(custom = {}) {

    // get default config
    const config = this.#default_config;

    // check & apply audio bitrate
    if (custom['a_bitrate'])
      if (Number.isInteger(custom['a_bitrate']) && 1 <= custom['a_bitrate'] && custom['a_bitrate'] <= 320 * 1000)
        config['a_bitrate'] = custom['a_bitrate'];
      else
        throw new Error('Invalid value for audio bitrate given, expected 1 <= x <= 320000');

    // check & apply size target
    if (custom['s_target'])
      if (Number.isInteger(custom['s_target']) && 1 <= custom['s_target'])
        config['s_target'] = custom['s_target'];
      else
        throw new Error('Invalid value for size target given, expected 1 <= x');

    // check & apply video fps
    if (custom['v_fps'])
      if (Number.isInteger(custom['v_fps']) && 1 <= custom['v_fps'])
        config['v_fps'] = custom['v_fps'];
      else
        throw new Error('Invalid value for video fps given, expected 1 <= x');

    // check & apply video preset
    if (custom['v_preset'])
      if (this.#available_presets.includes(custom['v_preset']))
        config['v_preset'] = custom['v_preset'];
      else
        throw new Error(`Invalid value for video preset given, expected ${this.#available_presets.join(' | ')}`);

    // check & apply video reference
    if (custom['v_ref'])
      if (Number.isInteger(custom['v_ref']) && 1 <= custom['v_ref'] && custom['v_ref'] <= 4)
        config['v_ref'] = custom['v_ref'];
      else
        throw new Error('Invalid value for video reference given, expected 1 <= x <= 16');

    // check & apply video resolution
    if (custom['v_res'])
      if (Array.isArray(custom['v_res']) && custom['v_res'][0] !== undefined && custom['v_res'][1] !== undefined) {
        if (Number.isInteger(custom['v_res'][0]) && 1 <= custom['v_res'][0] && Number.isInteger(custom['v_res'][1]) && 1 <= custom['v_res'][1])
          config['v_res'] = custom['v_res'];
      } else
        throw new Error('Invalid value for video reference given, expected 1 <= x & 1 <= y');

    // check & apply worker count
    if (custom['w_count'])
      if (Number.isInteger(custom['w_count']) && 1 <= custom['w_count'])
        config['w_count'] = custom['w_count'];
      else
        throw new Error('Invalid value for worker count given, expected 1 <= x');

    // return config with applied custom values
    return config;
  }



  async #convert(file, custom = {}) {

    // prepare
    this.#element_status.textContent = `${this.#prefix_status}Preparing ...`;

    if (file == undefined)
      throw new Error('No file given to convert');

    const config = this.#applyConfig(custom);

    // load ffmpeg
    this.#element_status.textContent = `${this.#prefix_status}Loading FFmpeg ...`;

    await this.#ffmpeg.load({
      coreURL: 'ffmpeg-core.js'/*/,
      wasmURL: 'ffmpeg/ffmpeg-core.wasm',
      workerURL: 'ffmpeg/ffmpeg-core.worker.js',
      classWorkerURL: 'ffmpeg/ffmpeg-core.worker.js'/*/
    });

    // import video
    this.#element_status.textContent = `${this.#prefix_status}Importing video ...`;

    await this.#ffmpeg.writeFile(file.name, new Uint8Array(await file.arrayBuffer()));

    // Get video duration
    this.#element_status.textContent = `${this.#prefix_status}Get video duration ...`;

    await this.#ffmpeg.ffprobe([
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      file.name
    ]);

    const duration = this.#c_message;
    if (duration && !isNaN(duration) && duration > 0)
      this.#duration = parseFloat(duration);
    else
      throw new Error('Could not get video duration');

    // prepare query
    let query = [
      '-v', 'info',
      '-i', file.name,
      '-preset', config['v_preset'],
      '-movflags', '+faststart',
      '-tag:v', 'avc1',
      '-map', '0:v:0',
      '-c:v', 'libx264',
      '-fps_mode', 'vfr',
      '-pix_fmt', 'yuv420p',
      '-tag:a', 'mp4a',
      '-map', '0:a:0',
      '-c:a', 'aac'
    ];

    // add to query size target
    if (config['s_target'] != null)
      query = query.concat([
        '-b:v',
        Math.floor(config['s_target'] / duration - config['a_bitrate']).toString()
      ]);

    // add to query size target
    if (config['v_ref'] != null)
      query = query.concat([
        '-x264-params',
        `ref=${config['v_ref']}`
      ]);

    // add to query video resolution
    if (config['v_res'][0] != null && config['v_res'][1] != null)
      query = query.concat([
        '-vf',
        `scale='min(${config['v_res'][0]},iw)':'min(${config['v_res'][1]},ih)':force_original_aspect_ratio=decrease`,
      ]);

    // add to query video fps
    if (config['v_fps'] != null)
      query = query.concat([
        '-fpsmax',
        config['v_fps'].toString()
      ]);

    // add to query audio bitrate
    if (config['a_bitrate'] != null)
      query = query.concat([
        '-b:a',
        config['a_bitrate'].toString()
      ]);

    // add to query internal filename for output
    query.push('output.mp4');

    // convert video
    this.#element_status.textContent = `${this.#prefix_status}Converting video ... 0%`;

    try {

      await this.#ffmpeg.exec(query);

      // export video
      this.#element_status.textContent = `${this.#prefix_status}Export video ...`;

      this.#element_video.src = URL.createObjectURL(new Blob([(await this.#ffmpeg.readFile('output.mp4')).buffer], { type: 'video/mp4' }));

      // stop ffmpeg worker and free ram
      this.#ffmpeg.terminate();

      // refresh video
      this.#element_video.load();
      this.#element_status.textContent = `${this.#prefix_status}Conversion finished!`;

    } catch (error) {

      // was force stopped by next cycle or by error
      if (error?.message?.includes('called FFmpeg.terminate'))
        console.warn('Encoding was aborted');
      else
        console.error('Encoding failed:', error);

    }

  }



}