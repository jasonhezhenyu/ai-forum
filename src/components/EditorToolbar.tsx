'use client';

import { useRef } from 'react';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  setContent: (v: string) => void;
  showToast?: (msg: string) => void;
}

const FONT_FAMILIES = [
  { label: '默认', value: '' },
  { label: '微软雅黑', value: 'Microsoft YaHei, 微软雅黑, sans-serif' },
  { label: '宋体', value: 'SimSun, 宋体, serif' },
  { label: '黑体', value: 'SimHei, 黑体, sans-serif' },
  { label: '楷体', value: 'KaiTi, 楷体, serif' },
  { label: '仿宋', value: 'FangSong, 仿宋, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
];

const FONT_SIZES = [
  { label: '小一(8pt)', size: '1' },
  { label: '二号(10pt)', size: '2' },
  { label: '三号(12pt)', size: '3' },
  { label: '四号(14pt)', size: '4' },
  { label: '五号(18pt)', size: '5' },
  { label: '六号(24pt)', size: '6' },
];

const COLORS = [
  { label: '● 黑色', code: '#000000' },
  { label: '● 红色', code: '#e74c3c' },
  { label: '● 蓝色', code: '#3498db' },
  { label: '● 绿色', code: '#27ae60' },
  { label: '● 橙色', code: '#e67e22' },
  { label: '● 紫色', code: '#8e44ad' },
  { label: '● 灰色', code: '#95a5a6' },
];

function insertAtCursor(textarea: HTMLTextAreaElement, content: string, before: string, after: string, placeholder: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = content.slice(start, end) || placeholder;
  const newText = before + selected + after;
  return {
    newContent: content.slice(0, start) + newText + content.slice(end),
    cursorPos: start + before.length + (selected ? selected.length : 0),
  };
}

export default function EditorToolbar({ textareaRef, content, setContent, showToast }: Props) {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const wrap = (before: string, after = '', placeholder = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { newContent, cursorPos } = insertAtCursor(ta, content, before, after, placeholder);
    setContent(newContent);
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = cursorPos; }, 50);
  };

  const uploadFile = async (file: File, type: 'image' | 'video' | 'file') => {
    const fd = new FormData();
    fd.append(type === 'file' ? 'attachment' : 'image', file);
    const res = await fetch(`/api/upload${type === 'file' ? '?type=file' : ''}`, { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok) {
      if (type === 'image') wrap(data.markdown);
      else if (type === 'video') wrap(`<video controls width="100%" src="${data.url}"></video>\n`);
      else wrap(`[📎 ${file.name}](${data.url})`);
    } else {
      showToast?.(data.error || '上传失败');
    }
  };

  const btn = (label: any, title: string, before: string, after = '', placeholder = '', extraClass = '') => (
    <button type="button" title={title}
      onClick={() => wrap(before, after, placeholder)}
      className={`px-2 py-1 text-xs rounded transition-all duration-200 hover:bg-[var(--boe-silver)] text-[var(--boe-dark-secondary)] ${extraClass}`}
    >{label}</button>
  );

  return (
    <div className="border-b border-[var(--boe-silver)] bg-[var(--boe-silver-light)]/50 px-2 py-1.5 flex items-center gap-1 flex-wrap select-none">
      {/* ===== 字体组 ===== */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--boe-silver)]">
        {/* 字体选择 */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val) wrap(`<span style="font-family:${val}">`, '</span>', '文字');
            e.target.value = '';
          }}
          className="px-1.5 py-1 text-xs rounded border border-[var(--boe-silver)] bg-[var(--boe-matte)] hover:border-[var(--boe-silver)] outline-none cursor-pointer w-20"
        >
          <option value="">字体</option>
          {FONT_FAMILIES.filter(f => f.value).map(f => (
            <option key={f.label} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
          ))}
        </select>

        {/* 字号选择 */}
        <select
          onChange={(e) => {
            if (e.target.value) wrap(`<font size="${e.target.value}">`, '</font>', '文字');
            e.target.value = '';
          }}
          className="px-1.5 py-1 text-xs rounded border border-[var(--boe-silver)] bg-[var(--boe-matte)] hover:border-[var(--boe-silver)] outline-none cursor-pointer w-16"
        >
          <option value="">字号</option>
          {FONT_SIZES.map(s => <option key={s.size} value={s.size}>{s.label}</option>)}
        </select>

        <div className="w-px h-5 bg-[var(--boe-silver)] mx-0.5" />

        {btn(<b>B</b>, '加粗', '**', '**', '加粗')}
        {btn(<i>I</i>, '斜体', '*', '*', '斜体')}
        {btn(<u>U</u>, '下划线', '<u>', '</u>', '下划线')}
        {btn(<s>S</s>, '删除线', '~~', '~~', '删除线')}
        {btn('x²', '上标', '<sup>', '</sup>', '上标')}
        {btn('x₂', '下标', '<sub>', '</sub>', '下标')}
      </div>

      {/* ===== 字体颜色 ===== */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--boe-silver)]">
        <select
          onChange={(e) => {
            if (e.target.value) wrap(`<span style="color:${e.target.value}">`, '</span>', '文字');
            e.target.value = '';
          }}
          className="px-1.5 py-1 text-xs rounded border border-[var(--boe-silver)] bg-[var(--boe-matte)] hover:border-[var(--boe-silver)] outline-none cursor-pointer"
          title="字体颜色"
          style={{ color: '#e74c3c', fontWeight: 'bold' }}
        >
          <option value="">A▾</option>
          {COLORS.map(c => (
            <option key={c.code} value={c.code} style={{ color: c.code }}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* ===== 段落组 ===== */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--boe-silver)]">
        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm0 8h12v2H3v-2zm0 8h18v2H3v-2zm0-4h16v2H3v-2z"/></svg>,
          '左对齐', '<div align="left">', '</div>', '左对齐'
        )}
        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm4 8h10v2H7v-2zm-4 8h18v2H3v-2zm2-4h14v2H5v-2z"/></svg>,
          '居中对齐', '<div align="center">', '</div>', '居中'
        )}
        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v2H3V3zm6 8h12v2H9v-2zm-6 8h18v2H3v-2zm4-4h14v2H7v-2z"/></svg>,
          '右对齐', '<div align="right">', '</div>', '右对齐'
        )}

        <div className="w-px h-5 bg-[var(--boe-silver)] mx-0.5" />

        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5h16v2H4V5zm0 6h10v2H4v-2zm0 6h16v2H4v-2zm0-4h14v2H4v-2z"/></svg>,
          '增加缩进', '<div style="padding-left:2em">', '</div>', '缩进文字'
        )}
        {btn(
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 5h16v2H4V5zm6 6h10v2H10v-2zm6 6h4v2h-4v-2zm-6-4h14v2H10v-2z"/></svg>,
          '减少缩进', '<div style="padding-left:0.5em">', '</div>', '缩进文字'
        )}
      </div>

      {/* ===== 段落元素 ===== */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-[var(--boe-silver)]">
        {btn('• 项目符号', '无序列表', '- ', '', '列表项')}
        {btn('1. 编号', '有序列表', '1. ', '', '列表项')}
        {btn('❝ 引用', '引用文字', '> ', '', '引用')}
        {btn('—', '分割线', '\n---\n')}
      </div>

      {/* ===== 插入组 ===== */}
      <div className="flex items-center gap-0.5">
        {btn('🔗 链接', '插入链接', '[', '](url)', '链接文字')}

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
    </div>
  );
}
