# Video Converter Javascript

A JavaScript class that uses [FFmpeg powered by WebAssembly](https://github.com/ffmpegwasm/ffmpeg.wasm) to convert videos locally in the browser.
If a compatible browser is detected, multithreading is used for encoding.

> [!NOTE]
> The core of FFmpeg.wasm, which was developed for multithreading, is unstable in Chromium and runs even worse in Safari due to the faulty or incomplete WebAssembly threading support in these browsers.
> Therefore, the class only uses the multithreading core with Firefox and checks whether the necessary dependencies for threaded WebAssembly are present.
> The simpler core is used as a fallback.



| Table of Contents |
| - |
| [Installation](#installation) |
| [Usage](#usage) |
| [License](#license) |



## Installation
Move the file ‘videoConverter.class.js’ and the entire ‘ffmpeg-hybrid’ folder to a web space and embed them in an HTML file:

<pre>
<script src="/ffmpeg-hybrid/ffmpeg.min.js"></script>
<script src="/videoConverter.class.js"></script>
</pre>
  
Create a new object of the class and assign it an HTML div element to fill:

<pre>
const videoConverter = new VideoConverter(
    document.getElementById('ffmpeg_converter')
);
</pre>

Optional Boolean value to always use the simpler FFmpeg.wasm core:

<pre>
const videoConverter = new VideoConverter(
    document.getElementById('ffmpeg_converter'),
    true
);
</pre>

It uses queries to encode the input video and replaces the output video when it is finished.
Each query replaces the previous video result in the output video.
By default, it has a template query for encoding. If no user-defined query is specified, this query is used. If user-defined queries are specified, valid entries override default entries.

| key | default | description | override condition |
|-----|---------|-------------|--------------------|
| a_bitrate | null | audio bitrate | integer greater equal 1 in Hz, 192kHz would be 192000 |
| s_target | null | target file size for output video | integer greater equal 1 in bits, 9MB would be 9 * 1024 * 1024 * 8 or 75497472 |
| v_fps | null | max fps limiter | integer greater equal 1 in fps, 30fps would be 30 |
| v_preset | 'ultrafast' | any valid ffmpeg preset | 'ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow' or 'placebo' |
| v_ref | 1 | image references | integer greater equal 1 and less equal 4, higher values are impractical and can cause incompatibility |
| v_res | [null, null] | max resolution limit | Both elements for [x,y] must be each an integer greater equal 1, 720p would be [1280, 720] |
| autoplay | false | autoplay output video when finished | boolean |

Example of a custom query: The first query produces low-quality output but is fast and plays automatically. The last query produces high-quality output but is slow.

<pre>
videoConverter.customQueries([
  {
    'a_bitrate': 128 * 1000,
    'v_fps': 30,
    'v_res': [640, 640],
    'autoplay': true
  }, {
    'a_bitrate': 192 * 1000,
    'v_preset': 'placebo',
    'v_ref': 4
  }
]);
</pre>

In addition, each query is supplemented by:

| key | value | description |
|-----|-------|-------------|
| movflags | +faststart | The video can be started before it is fully loaded |
| tag:v | avc1 | Ensures compatibility and correct codec signalling |
| map | 0:v:0 | Only receive the first video stream |
| c:v | libx264 | Use x264 to encode to h264 |
| fps_mode | vfr | Try variable refresh rate |
| pix_fmt | yuv420p | Pixel format for an efficient compromise between image quality and compression |
| tag:a | mp4a | Ensures compatibility and correct codec signalling |
| map | 0:a:0 | Only receive the first audio stream |
| c:a | aac | Audio codec |



## Usage
When a video file is selected, encoding begins.
After each query is completed, the video output is replaced with the latest result and played automatically, if specified in the query.
When a new video is selected, encoding of the previous video is stopped and encoding of the new video file is started.



## License
The project itself is licensed under GNU General Public License v3.0.
FFmpeg powered by WebAssembly is licensed under MIT.
