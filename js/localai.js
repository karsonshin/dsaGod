/* Offer Ready: the on-device language model.
   A small open model (Qwen2.5-0.5B-Instruct, 4-bit) that runs entirely in this browser on the graphics card through WebGPU, using the
   WebLLM runtime. Its files (runtime, GPU program, weights) are served by this site from the ai/ folder, so nothing is sent to any
   outside service and, once loaded, it works offline. It needs https (or localhost), so it does not run from a file:// copy.
   OR.localai.load() -> engine, OR.localai.generate({ system, user, onDelta, signal }) -> text, OR.localai.state() -> { status, pct, text }. */
(function () {
  'use strict';
  var OR = window.OR, ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', KEY = 'offer-ready:localai';
  var engine = null, loading = null, st = { status: 'idle', pct: 0, text: '' };

  function base() { return new URL('ai/', document.baseURI).href; }
  function reason() {
    if (!/^https?:$/.test(location.protocol)) return 'The on-device AI needs the hosted site (https). It cannot run from a file on your computer.';
    if (!navigator.gpu) return 'This browser has no WebGPU. Use a recent Chrome or Edge on a computer with a graphics card.';
    return '';
  }
  function emit() { OR.emit('localai', st); }
  function enabled() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setEnabled(on) { try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } }

  function load() {
    if (engine) return Promise.resolve(engine);
    if (loading) return loading;
    var why = reason();
    if (why) { st = { status: 'unsupported', pct: 0, text: why }; emit(); return Promise.reject(new Error(why)); }
    st = { status: 'loading', pct: 0, text: 'Starting…' }; emit();
    loading = (async function () {
      var mod = await import(base() + 'webllm/index.js');
      var adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw new Error('No graphics adapter is available for WebGPU on this computer.');
      var appConfig = {
        useIndexedDBCache: false,
        model_list: [{
          model: base() + 'models/' + ID + '/', model_id: ID, model_lib: base() + 'lib/Qwen2-0.5B-Instruct-q4f16_1_cs1k-webgpu.wasm',
          vram_required_MB: 945, low_resource_required: true, overrides: { context_window_size: 4096 }
        }]
      };
      var e = await mod.CreateMLCEngine(ID, { appConfig: appConfig, initProgressCallback: function (r) { st = { status: 'loading', pct: r.progress || 0, text: r.text || '' }; emit(); } });
      engine = e; st = { status: 'ready', pct: 1, text: 'Ready' }; emit(); return e;
    })().catch(function (err) {
      engine = null; loading = null; st = { status: 'error', pct: 0, text: (err && err.message) || String(err) }; emit(); throw err;
    });
    return loading;
  }

  // o: { system, user, onDelta(text), signal, max }
  async function generate(o) {
    var e = await load(), full = '';
    var stream = await e.chat.completions.create({
      messages: [{ role: 'system', content: o.system }, { role: 'user', content: o.user }],
      stream: true, temperature: 0.1, top_p: 0.8, max_tokens: o.max || 260
    });
    for await (var ch of stream) {
      var d = (ch.choices && ch.choices[0] && ch.choices[0].delta && ch.choices[0].delta.content) || '';
      if (d) { full += d; if (o.onDelta) o.onDelta(d); }
      if (o.signal && o.signal.aborted) { try { e.interruptGenerate(); } catch (x) { /* already done */ } break; }
    }
    return full;
  }
  async function unload() { if (engine) { try { await engine.unload(); } catch (e) { /* ignore */ } } engine = null; loading = null; st = { status: 'idle', pct: 0, text: '' }; emit(); }

  OR.localai = { load: load, generate: generate, unload: unload, state: function () { return st; }, reason: reason, supported: function () { return !reason(); }, enabled: enabled, setEnabled: setEnabled, modelName: 'Qwen2.5-0.5B-Instruct (on-device)' };
})();
