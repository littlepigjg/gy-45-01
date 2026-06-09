import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Check,
  Type,
  Search,
  Hash,
  AlertCircle,
} from 'lucide-react';
import type { IconItem, RenameMode, BatchRenameConfig, RenamePreview } from '@/types';
import {
  generateRenamePreview,
  getDefaultRenameConfig,
  validateRenameConfig,
} from '@/utils';
import { cn } from '@/utils';

interface BatchRenameDialogProps {
  open: boolean;
  icons: IconItem[];
  onClose: () => void;
  onConfirm: (renames: RenamePreview[]) => void;
}

const MODE_TABS: { mode: RenameMode; label: string; icon: typeof Type }[] = [
  { mode: 'prefix', label: '前后缀', icon: Type },
  { mode: 'replace', label: '查找替换', icon: Search },
  { mode: 'numbering', label: '自动编号', icon: Hash },
];

export default function BatchRenameDialog({
  open,
  icons,
  onClose,
  onConfirm,
}: BatchRenameDialogProps) {
  const [config, setConfig] = useState<BatchRenameConfig>(getDefaultRenameConfig());

  useEffect(() => {
    if (open) {
      setConfig(getDefaultRenameConfig());
    }
  }, [open]);

  const validationError = useMemo(() => validateRenameConfig(config), [config]);

  const previews = useMemo(() => {
    const iconList = icons.map((i) => ({ id: i.id, name: i.name }));
    return generateRenamePreview(iconList, config);
  }, [icons, config]);

  const changedCount = useMemo(
    () => previews.filter((p) => p.originalName !== p.newName).length,
    [previews]
  );

  if (!open) return null;

  const updateConfig = <K extends keyof BatchRenameConfig>(
    key: K,
    value: BatchRenameConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedConfig = <
    K extends 'prefixSuffix' | 'replace' | 'numbering',
    N extends keyof BatchRenameConfig[K]
  >(
    section: K,
    key: N,
    value: BatchRenameConfig[K][N]
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleConfirm = () => {
    if (validationError) return;
    const validRenames = previews.filter((p) => p.newName.trim().length > 0);
    if (validRenames.length === 0) return;
    onConfirm(validRenames);
  };

  const renderModeConfig = () => {
    if (config.mode === 'prefix' || config.mode === 'suffix') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              前缀
            </label>
            <input
              type="text"
              value={config.prefixSuffix.prefix}
              onChange={(e) => updateNestedConfig('prefixSuffix', 'prefix', e.target.value)}
              placeholder="例如：icon_"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              后缀
            </label>
            <input
              type="text"
              value={config.prefixSuffix.suffix}
              onChange={(e) => updateNestedConfig('prefixSuffix', 'suffix', e.target.value)}
              placeholder="例如：_24"
              className="input"
            />
          </div>
          <div className="text-xs text-slate-500">
            在原名称的基础上添加前缀和后缀，可以同时使用
          </div>
        </div>
      );
    }

    if (config.mode === 'replace') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              查找内容
            </label>
            <input
              type="text"
              value={config.replace.find}
              onChange={(e) => updateNestedConfig('replace', 'find', e.target.value)}
              placeholder="要查找的文本"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              替换为
            </label>
            <input
              type="text"
              value={config.replace.replace}
              onChange={(e) => updateNestedConfig('replace', 'replace', e.target.value)}
              placeholder="替换后的文本"
              className="input"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={config.replace.caseSensitive}
                onChange={(e) => updateNestedConfig('replace', 'caseSensitive', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-ink-500 bg-ink-800 text-neon-cyan focus:ring-neon-cyan/30"
              />
              区分大小写
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={config.replace.useRegex}
                onChange={(e) => updateNestedConfig('replace', 'useRegex', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-ink-500 bg-ink-800 text-neon-cyan focus:ring-neon-cyan/30"
              />
              使用正则表达式
            </label>
          </div>
          {config.replace.useRegex && (
            <div className="text-xs text-slate-500">
              支持 JavaScript 正则表达式语法，替换中可用 $1, $2 等引用捕获组
            </div>
          )}
        </div>
      );
    }

    if (config.mode === 'numbering') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              命名模板
            </label>
            <input
              type="text"
              value={config.numbering.template}
              onChange={(e) => updateNestedConfig('numbering', 'template', e.target.value)}
              placeholder="icon_{n}"
              className="input font-mono text-xs"
            />
            <div className="text-[11px] text-slate-500 mt-1.5 font-mono">
              {'{n}'} = 序号 &nbsp; {'{index}'} = 从1开始的索引 &nbsp; {'{0index}'} = 补零索引
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                起始值
              </label>
              <input
                type="number"
                min={0}
                value={config.numbering.start}
                onChange={(e) => updateNestedConfig('numbering', 'start', Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                步长
              </label>
              <input
                type="number"
                min={1}
                value={config.numbering.step}
                onChange={(e) => updateNestedConfig('numbering', 'step', Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                补零位数
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={config.numbering.padLength}
                onChange={(e) => updateNestedConfig('numbering', 'padLength', Number(e.target.value))}
                className="input"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col card shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700/50 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">批量重命名</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              已选择 {icons.length} 个图标
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-[320px_1fr] h-full">
            <div className="border-r border-ink-700/50 p-5 space-y-5">
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">
                  重命名模式
                </div>
                <div className="flex flex-col gap-1">
                  {MODE_TABS.map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      onClick={() => updateConfig('mode', mode)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-all',
                        config.mode === mode
                          ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-ink-700/50" />

              {renderModeConfig()}

              {validationError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-neon-rose/10 border border-neon-rose/30">
                  <AlertCircle className="w-4 h-4 text-neon-rose shrink-0 mt-0.5" />
                  <div className="text-xs text-neon-rose">{validationError}</div>
                </div>
              )}
            </div>

            <div className="flex flex-col p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-slate-400">
                  实时预览
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="chip bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                    变更 {changedCount}
                  </span>
                  <span className="text-slate-500">
                    共 {previews.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_24px_1fr] gap-2 text-[11px] text-slate-500 font-medium mb-2 px-2">
                <div>原名称</div>
                <div />
                <div>新名称</div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin border border-ink-700/50 rounded-lg divide-y divide-ink-700/30">
                {previews.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm py-12">
                    没有可预览的图标
                  </div>
                ) : (
                  previews.map((p) => {
                    const changed = p.originalName !== p.newName;
                    const emptyNew = !p.newName.trim();
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          'grid grid-cols-[1fr_24px_1fr] gap-2 px-2 py-2 items-center',
                          'hover:bg-white/[0.02]'
                        )}
                      >
                        <div className="truncate font-mono text-xs text-slate-400">
                          {p.originalName}
                        </div>
                        <div className="flex justify-center">
                          {changed ? (
                            <Check className="w-3.5 h-3.5 text-neon-cyan" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-ink-600" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'truncate font-mono text-xs',
                            emptyNew
                              ? 'text-neon-rose'
                              : changed
                              ? 'text-neon-cyan'
                              : 'text-slate-500'
                          )}
                        >
                          {p.newName || '(空)'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ink-700/50 shrink-0">
          <button onClick={onClose} className="btn btn-secondary">
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!!validationError || changedCount === 0}
            className={cn(
              'btn btn-primary',
              (!!validationError || changedCount === 0) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Check className="w-4 h-4" />
            确认重命名 ({changedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
