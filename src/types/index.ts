export interface IconMeta {
  id: string;
  name: string;
  originalName: string;
  width: number;
  height: number;
  addedAt: number;
}

export interface IconItem extends IconMeta {
  dataUrl: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  iconIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SpriteConfig {
  columns: number;
  spacing: number;
  bgColor: string;
  classPrefix: string;
  retina: boolean;
}

export interface IconPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteResult {
  imageDataUrl: string;
  cssCode: string;
  scssCode: string;
  iconPositions: IconPosition[];
  totalWidth: number;
  totalHeight: number;
  cellWidth: number;
  cellHeight: number;
}

export interface SplitConfig {
  rows: number;
  columns: number;
  iconWidth: number;
  iconHeight: number;
  spacing: number;
  padding: number;
}

export interface SplitIcon {
  index: number;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}

export type RenameMode = 'prefix' | 'suffix' | 'replace' | 'numbering';

export interface RenamePreview {
  id: string;
  originalName: string;
  newName: string;
}

export interface PrefixSuffixConfig {
  prefix: string;
  suffix: string;
}

export interface ReplaceConfig {
  find: string;
  replace: string;
  useRegex: boolean;
  caseSensitive: boolean;
}

export interface NumberingConfig {
  template: string;
  start: number;
  step: number;
  padLength: number;
}

export interface BatchRenameConfig {
  mode: RenameMode;
  prefixSuffix: PrefixSuffixConfig;
  replace: ReplaceConfig;
  numbering: NumberingConfig;
}
