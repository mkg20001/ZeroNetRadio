# ZeroNetRadio
Radio on ZeroNet! http://localhost:43110/1RaDiogZuNc8WLK3MUGJSMWwrXu8CgrFS/

Buggy and laggy and not streaming right now but it works.

# Install
You need `mp3splt` and `nodejs` v6+ installed and a Ubuntu 16.04 machine (although it may work on older/newer versions as well)

# Streaming
Currently only single mp3-files are supported

Run `cd server/;node spliter.js path/to/some.mp3` to stream a file and then sign and publish your zite.

(Don't use this in a folder whose name has spaces - there are currently some **unescaped rm -rf commands**)
