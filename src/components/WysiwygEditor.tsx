'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { showToast as toast } from '@/components/Toast';

interface Props {
  content: string;
  setContent: (v: string) => void;
  placeholder?: string;
  rows?: number;
  showToast?: (msg: string, type?: string) => void;
}

const FONT_FAMILIES = [
  { label: '默认', value: '', family: '' },
  { label: '苹方', value: "'PingFang SC', 'PingFang', sans-serif", family: 'PingFang SC' },
  { label: '微软雅黑', value: "'Microsoft YaHei', 'PingFang SC', sans-serif", family: 'Microsoft YaHei' },
  { label: '宋体', value: "SimSun, 'Songti SC', serif", family: 'SimSun' },
  { label: '黑体', value: "SimHei, 'Heiti SC', sans-serif", family: 'SimHei' },
  { label: '楷体', value: "KaiTi, 'Kaiti SC', serif", family: 'KaiTi' },
  { label: '仿宋', value: "FangSong, 'STFangsong', serif", family: 'FangSong' },
  { label: 'Arial', value: "Arial, sans-serif", family: 'Arial' },
  { label: 'Times New Roman', value: "'Times New Roman', serif", family: 'Times New Roman' },
];

const FONT_SIZES = [
  { label: '默认', value: '', size: '' },
  { label: '小一 (8pt)', value: '8pt', size: '1' },
  { label: '二号 (10pt)', value: '10pt', size: '2' },
  { label: '三号 (12pt)', value: '12pt', size: '3' },
  { label: '四号 (14pt)', value: '14pt', size: '4' },
  { label: '五号 (18pt)', value: '18pt', size: '5' },
  { label: '六号 (24pt)', value: '24pt', size: '6' },
  { label: '七号 (36pt)', value: '36pt', size: '7' },
];

const COLORS = [
  { label: '自动', code: '' },
  { label: '黑色', code: '#000000' },
  { label: '红色', code: '#e74c3c' },
  { label: '蓝色', code: '#3498db' },
  { label: '绿色', code: '#27ae60' },
  { label: '橙色', code: '#e67e22' },
  { label: '紫色', code: '#8e44ad' },
  { label: '灰色', code: '#95a5a6' },
];

export default function WysiwygEditor({ content, setContent, placeholder, rows = 10, showToast }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [currentFont, setCurrentFont] = useState('');
  const [currentSize, setCurrentSize] = useState('');
  const savedRange = useRef<Range | null>(null);

  // 同步外部内容到编辑器
  const initialized = useRef(false);
  useEffect(() => {
    if (!editorRef.current) return;
    if (!initialized.current) {
      // 首次挂载：如果有初始内容则同步，否则仅标记已初始化
      if (content) {
        editorRef.current.innerHTML = content;
      }
      initialized.current = true;
      return;
    }
    // 外部清空内容时同步清空编辑器
    if (content === '' && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = '';
    }
  }, [content]);

  // 持续记录光标/选区（含鼠标拖选），避免工具栏操作作用于过期选区
  useEffect(() => {
    const handler = () => {
      const el = editorRef.current;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && el?.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  // 保存光标位置
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // 恢复光标位置
  const restoreSelection = () => {
    const el = editorRef.current;
    if (savedRange.current && el) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
      el.focus();
    }
  };

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (el) {
      saveSelection();
      setContent(el.innerHTML);
    }
  }, [setContent]);

  const exec = (cmd: string, val?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    restoreSelection();
    document.execCommand(cmd, false, val);
    el.focus();
    handleInput();
  };

  // 给选中文字加行内样式；光标态（未选中文字）则设置「后续输入」的默认样式
  const applyInlineStyle = (
    prop: string,
    value: string,
    typing?: { cmd: string; val: string; label: string },
  ) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;

    // 光标态：设置后续输入的默认样式
    // execCommand 原生支持「打字状态」，且兼容中文输入法；这里仅用于未选中文字的场景
    if (range.collapsed) {
      if (typing) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand(typing.cmd, false, typing.val);
        toast(`已设置「${typing.label}」，后续输入将使用该样式`, 'success');
      } else {
        toast('请先选中要设置样式的文字', 'info');
      }
      return;
    }

    // 选中态：用带样式的 span 包一层再放回去
    const fragment = range.extractContents();
    const span = document.createElement('span');
    span.style.setProperty(prop, value);
    span.appendChild(fragment);
    range.insertNode(span);

    // 选中新插入的 span，方便连续操作
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);

    el.focus();
    handleInput();
  };

  const insertHTML = (html: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const fragment = range.createContextualFragment(html);
      range.insertNode(fragment);
      // 移动光标到插入内容之后
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      document.execCommand('insertHTML', false, html);
    }
    el.focus();
    handleInput();
  };

  const uploadFile = async (file: File, type: 'image' | 'video' | 'file') => {
    // 先用本地预览
    if (type === 'image') {
      const localUrl = URL.createObjectURL(file);
      insertHTML(`<br><img src="${localUrl}" alt="上传中..." style="max-width:100%;opacity:0.5;border:2px dashed #ccc;border-radius:8px;"><br>`);
    }

    setUploading(true);
    setUploadFileName(file.name);
    setUploadProgress(10);

    const fd = new FormData();
    fd.append(type === 'file' ? 'attachment' : 'image', file);

    try {
      const res = await fetch(`/api/upload${type === 'file' ? '?type=file' : ''}`, { method: 'POST', body: fd });
      setUploadProgress(100);

      const data = await res.json();

      if (res.ok) {
        if (type === 'image') {
          const el = editorRef.current;
          if (el) {
            const imgs = el.querySelectorAll('img[alt="上传中..."]');
            imgs.forEach((img: any) => {
              if (img.src.startsWith('blob:')) {
                img.src = data.url;
                img.alt = file.name;
                img.style.opacity = '1';
                img.style.border = 'none';
              }
            });
            handleInput();
          }
        } else if (type === 'video') {
          insertHTML(`<br><video controls width="100%" src="${data.url}"></video><br>`);
        } else {
          insertHTML(` <a href="${data.url}" target="_blank" style="display:inline-block;padding:4px 8px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;font-size:12px;">📎 ${file.name}</a> `);
        }
        showToast?.('上传成功', 'success');
      } else {
        showToast?.(data.error || '上传失败');
        // 移除失败的预览图
        const el = editorRef.current;
        if (el) {
          const imgs = el.querySelectorAll('img[alt="上传中..."]');
          imgs.forEach((img: any) => img.remove());
          handleInput();
        }
      }
    } catch {
      showToast?.('网络错误，上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
    }
  };

  const btn = (label: any, title: string, cmd: string, val?: string) => (
    <button type="button" title={title}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
      className="px-2 py-1 text-xs rounded transition-all duration-200 hover:bg-[var(--boe-silver)] text-[var(--boe-dark-secondary)]"
    >{label}</button>
  );

  return (
    <div className="border border-[var(--boe-silver)] rounded-xl overflow-hidden">
      {/* 工具栏 */}
      <div className="border-b border-[var(--boe-silver)] bg-[var(--boe-silver-light)]/50 px-2 py-1.5 flex items-center gap-1 flex-wrap select-none">
        {/* 字体 */}
        <select
          value={currentFont}
          onChange={(e) => {
            const v = e.target.value;
            setCurrentFont(v);
            if (v) {
              const f = FONT_FAMILIES.find((x) => x.value === v);
              applyInlineStyle('font-family', v, { cmd: 'fontName', val: f?.family || v, label: f?.label || '字体' });
            }
          }}
          className="px-1.5 py-1 text-xs rounded border border-[var(--boe-silver)] bg-[var(--boe-matte)] outline-none cursor-pointer w-24"
        >
          <option value="">字体</option>
          {FONT_FAMILIES.filter(f => f.value).map(f => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
          ))}
        </select>

        {/* 字号 */}
        <select
          value={currentSize}
          onChange={(e) => {
            const v = e.target.value;
            setCurrentSize(v);
            if (v) {
              const s = FONT_SIZES.find((x) => x.value === v);
              applyInlineStyle('font-size', v, { cmd: 'fontSize', val: s?.size || '3', label: s?.label || '字号' });
            }
          }}
          className="px-1.5 py-1 text-xs rounded border border-[var(--boe-silver)] bg-[var(--boe-matte)] outline-none cursor-pointer w-16"
        >
          <option value="">字号</option>
          {FONT_SIZES.filter(s => s.value).map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-[var(--boe-silver)] mx-0.5" />

        {btn(<b>B</b>, '加粗', 'bold')}
        {btn(<i>I</i>, '斜体', 'italic')}
        {btn(<u>U</u>, '下划线', 'underline')}
        {btn(<s>S</s>, '删除线', 'strikeThrough')}
        {btn('x²', '上标', 'superscript')}
        {btn('x₂', '下标', 'subscript')}

        <div className="w-px h-5 bg-[var(--boe-silver)] mx-0.5" />

        {/* 颜色 - 带颜色点 */}
        <div className="relative flex items-center" title="字体颜色">
          <select
            onChange={(e) => { const v = e.target.value; if (v) { const c = COLORS.find((x) => x.code === v); applyInlineStyle('color', v, { cmd: 'foreColor', val: v, label: c?.label || '颜色' }); } e.target.value = ''; }}
            className="px-1 py-1 text-xs rounded border border-[var(--boe-silver)] bg-[var(--boe-matte)] outline-none cursor-pointer"
            style={{ color: '#e74c3c', fontWeight: 'bold', width: '32px' }}
          >
            <option value="">A▾</option>
            {COLORS.filter(c => c.code).map(c => (
              <option key={c.code} value={c.code}>
                ● {c.label}
              </option>
            ))}
          </select>
          {/* 颜色预览条 */}
          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            {COLORS.filter(c => c.code).slice(0, 7).map(c => (
              <button key={c.code} title={c.label}
                onMouseDown={(e) => { e.preventDefault(); applyInlineStyle('color', c.code, { cmd: 'foreColor', val: c.code, label: c.label }); }}
                className="w-4 h-4 rounded-full border border-gray-300 hover:scale-125 transition-transform"
                style={{ backgroundColor: c.code }}
              />
            ))}
          </div>
        </div>

        <div className="w-px h-5 bg-[var(--boe-silver)] mx-0.5" />

        {/* 对齐 */}
        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm0 8h12v2H3v-2zm0 8h18v2H3v-2zm0-4h16v2H3v-2z"/></svg>,
          '左对齐', 'justifyLeft'
        )}
        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm4 8h10v2H7v-2zm-4 8h18v2H3v-2zm2-4h14v2H5v-2z"/></svg>,
          '居中对齐', 'justifyCenter'
        )}
        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm6 8h12v2H9v-2zm-6 8h18v2H3v-2zm4-4h14v2H7v-2z"/></svg>,
          '右对齐', 'justifyRight'
        )}

        <div className="w-px h-5 bg-[var(--boe-silver)] mx-0.5" />

        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5h16v2H4V5zm0 6h10v2H4v-2zm0 6h16v2H4v-2zm0-4h14v2H4v-2z"/></svg>,
          '增加缩进', 'indent'
        )}
        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5h16v2H4V5zm6 6h10v2H10v-2zm6 6h4v2h-4v-2zm-6-4h14v2H10v-2z"/></svg>,
          '减少缩进', 'outdent'
        )}

        <div className="w-px h-5 bg-[var(--boe-silver)] mx-0.5" />

        {btn('• 列表', '无序列表', 'insertUnorderedList')}
        {btn('1. 编号', '有序列表', 'insertOrderedList')}
        {btn('H2', '标题', 'formatBlock', '<h2>')}
        {btn('H3', '小标题', 'formatBlock', '<h3>')}

        <div className="w-px h-5 bg-[var(--boe-silver)] mx-0.5" />

        {/* 上传按钮 */}
        <input type="file" ref={imageRef} className="hidden" accept="image/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'image'); e.target.value = ''; }} />
        <button onClick={() => imageRef.current?.click()} title="插入图片"
          className="px-2 py-1 text-xs rounded transition hover:bg-blue-50 text-blue-600">🖼️ 图片</button>

        <input type="file" ref={videoRef} className="hidden" accept="video/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'video'); e.target.value = ''; }} />
        <button onClick={() => videoRef.current?.click()} title="插入视频"
          className="px-2 py-1 text-xs rounded transition hover:bg-blue-50 text-blue-600">🎬 视频</button>

        <input type="file" ref={fileRef} className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'file'); e.target.value = ''; }} />
        <button onClick={() => fileRef.current?.click()} title="上传附件"
          className="px-2 py-1 text-xs rounded transition hover:bg-amber-50 text-amber-600">📎 附件</button>
      </div>

      {/* 上传进度条 */}
      {uploading && (
        <div className="px-4 py-2 bg-blue-500/5 border-b border-blue-100">
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <span className="animate-spin">⏳</span>
            <span>正在上传 {uploadFileName}...</span>
          </div>
          <div className="w-full h-1 bg-blue-100 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(uploadProgress, 10)}%` }} />
          </div>
        </div>
      )}

      {/* 编辑区 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={saveSelection}
        onFocus={restoreSelection}
        onClick={saveSelection}
        onKeyUp={saveSelection}
        className="w-full px-4 py-3 outline-none text-sm leading-relaxed prose-content"
        style={{ minHeight: `${rows * 24}px`, maxHeight: '600px', overflowY: 'auto' }}
        data-placeholder={placeholder || '在这里写下你的想法...'}
        onKeyDown={(e) => {
          if (e.key === 'Tab') { e.preventDefault(); exec('indent'); }
        }}
      />
      <style jsx>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
