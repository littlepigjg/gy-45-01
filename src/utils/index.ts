import type { IconItem, IconMeta, RenamePreview, BatchRenameConfig, RenameMode } from '../types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageSize(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadText(text: string, filename: string, mime: string = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isImageFile(file: File): boolean {
  return /^image\/(png|jpe?g|gif|webp|svg\+xml)$/i.test(file.type);
}

export async function createIconItemFromFile(file: File): Promise<IconItem> {
  const dataUrl = await fileToDataUrl(file);
  const size = await getImageSize(dataUrl);
  const name = file.name.replace(/\.[^/.]+$/, '');
  return {
    id: generateId(),
    name,
    originalName: file.name,
    width: size.width,
    height: size.height,
    dataUrl,
    addedAt: Date.now(),
  };
}

export async function createIconItemsFromFiles(
  files: FileList | File[]
): Promise<IconItem[]> {
  const fileArray = Array.from(files).filter(isImageFile);
  return Promise.all(fileArray.map(createIconItemFromFile));
}

export function iconItemToMeta(item: IconItem): IconMeta {
  const { dataUrl: _, ...meta } = item;
  return meta;
}

export function padNumber(n: number, length: number): string {
  const str = String(n);
  if (str.length >= length) return str;
  return '0'.repeat(length - str.length) + str;
}

function applyPrefixSuffix(name: string, prefix: string, suffix: string): string {
  return `${prefix}${name}${suffix}`;
}

function applyReplace(
  name: string,
  find: string,
  replace: string,
  useRegex: boolean,
  caseSensitive: boolean
): string {
  if (!find) return name;
  try {
    if (useRegex) {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(find, flags);
      return name.replace(regex, replace);
    } else {
      const flags = caseSensitive ? 'g' : 'gi';
      const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, flags);
      return name.replace(regex, replace);
    }
  } catch {
    return name;
  }
}

function applyNumbering(
  _name: string,
  template: string,
  start: number,
  step: number,
  padLength: number,
  index: number
): string {
  const num = start + index * step;
  const padded = padNumber(num, padLength);
  if (!template) return padded;
  return template
    .replace(/\{n\}/g, padded)
    .replace(/\{index\}/g, String(index + 1))
    .replace(/\{0index\}/g, padNumber(index + 1, padLength));
}

function applyCombinations(
  names: { id: string; name: string }[],
  mode: RenameMode,
  config: BatchRenameConfig
): string[] {
  return names.map((item, index) => {
    let result = item.name;
    if (mode === 'prefix' || mode === 'suffix') {
      result = applyPrefixSuffix(result, config.prefixSuffix.prefix, config.prefixSuffix.suffix);
    } else if (mode === 'replace') {
      result = applyReplace(
        result,
        config.replace.find,
        config.replace.replace,
        config.replace.useRegex,
        config.replace.caseSensitive
      );
    } else if (mode === 'numbering') {
      result = applyNumbering(
        result,
        config.numbering.template,
        config.numbering.start,
        config.numbering.step,
        config.numbering.padLength,
        index
      );
    }
    return result;
  });
}

export function generateRenamePreview(
  icons: { id: string; name: string }[],
  config: BatchRenameConfig
): RenamePreview[] {
  const newNames = applyCombinations(icons, config.mode, config);
  return icons.map((icon, index) => ({
    id: icon.id,
    originalName: icon.name,
    newName: newNames[index],
  }));
}

export function getDefaultRenameConfig(): BatchRenameConfig {
  return {
    mode: 'prefix',
    prefixSuffix: { prefix: '', suffix: '' },
    replace: { find: '', replace: '', useRegex: false, caseSensitive: false },
    numbering: { template: 'icon_{n}', start: 1, step: 1, padLength: 2 },
  };
}

export function validateRenameConfig(config: BatchRenameConfig): string | null {
  if (config.mode === 'replace' && config.replace.useRegex) {
    try {
      new RegExp(config.replace.find);
    } catch (e) {
      return '正则表达式语法错误';
    }
  }
  if (config.mode === 'numbering') {
    if (config.numbering.start < 0) return '起始序号不能为负数';
    if (config.numbering.step <= 0) return '步长必须大于 0';
    if (config.numbering.padLength < 1) return '补零位数至少为 1';
    if (config.numbering.padLength > 10) return '补零位数不能超过 10';
  }
  return null;
}
