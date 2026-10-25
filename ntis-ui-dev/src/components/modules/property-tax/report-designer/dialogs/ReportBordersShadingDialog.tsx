'use client';

import {
  Check,
  HelpCircle,
  RotateCw,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { useReportDesignerWorkspace } from '@/hooks/reports/designer/useReportDesignerWorkspace';

type DialogTab = 'borders' | 'pageBorder' | 'shading';
type BorderPreset = 'none' | 'box' | 'shadow' | '3d' | 'custom';
type LineStyle = 'solid' | 'dotted' | 'dashed' | 'double' | 'thick' | 'gradient';

const COLOR_OPTIONS = [
  { label: 'Automatic (Black)', value: '#000000' },
  { label: 'Dark Navy', value: '#1e3a8a' },
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'Crimson Red', value: '#b91c1c' },
  { label: 'Forest Green', value: '#15803d' },
  { label: 'Amber Gold', value: '#b45309' },
  { label: 'Purple', value: '#6b21a8' },
  { label: 'Slate Gray', value: '#475569' },
];

const WIDTH_OPTIONS = [
  { label: '¼ pt', value: '0.5pt' },
  { label: '½ pt', value: '1pt' },
  { label: '¾ pt', value: '1.5pt' },
  { label: '1 pt', value: '2pt' },
  { label: '1 ½ pt', value: '3pt' },
  { label: '2 ¼ pt', value: '4.5pt' },
  { label: '3 pt', value: '6pt' },
  { label: '4 ½ pt', value: '9pt' },
  { label: '6 pt', value: '12pt' },
];

export function ReportBordersShadingDialog({
  workspace,
  initialTab = 'borders',
  close,
}: {
  workspace: ReturnType<typeof useReportDesignerWorkspace>;
  initialTab?: DialogTab;
  close: () => void;
}) {
  const { def, state, change, updateElements, setMessage } = workspace;

  const hasSelected = state.selected.length > 0;
  const activeSection = def.sections.find((s) => s.id === state.sectionId);

  const [activeTab, setActiveTab] = useState<DialogTab>(initialTab);
  const [preset, setPreset] = useState<BorderPreset>('box');
  const [lineStyle, setLineStyle] = useState<LineStyle>('solid');
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState('1pt');

  const [borderEdges, setBorderEdges] = useState({
    top: true,
    bottom: true,
    left: true,
    right: true,
  });

  const [margins, setMargins] = useState({
    top: def.pageBorder?.inset?.top ?? 5,
    bottom: def.pageBorder?.inset?.bottom ?? 5,
    left: def.pageBorder?.inset?.left ?? 5,
    right: def.pageBorder?.inset?.right ?? 5,
  });

  const [applyTo, setApplyTo] = useState<'section' | 'selected' | 'page'>(() => {
    if (initialTab === 'pageBorder') return 'page';
    return 'section';
  });

  // Shading tab states
  const [shadingFill, setShadingFill] = useState('#ffffff');
  const [patternStyle, setPatternStyle] = useState('clear');
  const [patternColor, setPatternColor] = useState('#000000');
  const [shadingApplyTo, setShadingApplyTo] = useState<'section' | 'selected' | 'page'>('section');

  const handlePresetChange = (newPreset: BorderPreset) => {
    setPreset(newPreset);
    if (newPreset === 'none') {
      setBorderEdges({ top: false, bottom: false, left: false, right: false });
    } else if (newPreset === 'box' || newPreset === 'shadow') {
      setBorderEdges({ top: true, bottom: true, left: true, right: true });
    } else if (newPreset === '3d') {
      setBorderEdges({ top: true, bottom: true, left: true, right: true });
      setLineStyle('double');
    }
  };

  const toggleEdge = (edge: 'top' | 'bottom' | 'left' | 'right' | 'box') => {
    if (edge === 'box') {
      const allActive =
        borderEdges.top && borderEdges.bottom && borderEdges.left && borderEdges.right;
      setBorderEdges({
        top: !allActive,
        bottom: !allActive,
        left: !allActive,
        right: !allActive,
      });
    } else {
      setBorderEdges((prev) => ({ ...prev, [edge]: !prev[edge] }));
    }
    setPreset('custom');
  };

  const syncMarginsEqual = () => {
    const val = margins.top;
    setMargins({ top: val, bottom: val, left: val, right: val });
  };

  const handleApply = () => {
    if (activeTab === 'shading') {
      if (shadingApplyTo === 'page') {
        change((d) => ({ ...d, pageColor: shadingFill }));
        setMessage?.(`Page background set to ${shadingFill}`);
      } else if (shadingApplyTo === 'selected') {
        if (!hasSelected) {
          setMessage?.('कृपया घटक निवडा (Select an element to shade)');
          return;
        }
        updateElements(state.selected, () => ({
          styles: { backgroundColor: shadingFill },
        }));
        setMessage?.(`Shading applied to ${state.selected.length} element(s)`);
      } else if (shadingApplyTo === 'section') {
        if (!activeSection) {
          setMessage?.('No active section selected');
          return;
        }
        const sectionElementIds = def.elements
          .filter((e) => e.sectionId === activeSection.id)
          .map((e) => e.id);
        if (sectionElementIds.length > 0) {
          updateElements(sectionElementIds, (el) => ({
            styles: { ...el.styles, backgroundColor: shadingFill },
          }));
        }
        setMessage?.(`Section ${activeSection.name} shaded`);
      }
      close();
      return;
    }

    const cssStyle =
      lineStyle === 'thick' || lineStyle === 'gradient'
        ? 'solid'
        : lineStyle;
    const borderCss = `${width} ${cssStyle} ${color}`;
    const target = activeTab === 'pageBorder' ? 'page' : applyTo;

    if (target === 'page') {
      const isNone =
        preset === 'none' ||
        (!borderEdges.top && !borderEdges.bottom && !borderEdges.left && !borderEdges.right);

      change((d) => ({
        ...d,
        pageBorder: isNone
          ? undefined
          : {
              top: borderEdges.top ? borderCss : 'none',
              bottom: borderEdges.bottom ? borderCss : 'none',
              left: borderEdges.left ? borderCss : 'none',
              right: borderEdges.right ? borderCss : 'none',
              inset: {
                top: Math.max(0, margins.top),
                bottom: Math.max(0, margins.bottom),
                left: Math.max(0, margins.left),
                right: Math.max(0, margins.right),
              },
              boxShadow:
                preset === 'shadow'
                  ? '4px 4px 14px rgba(0,0,0,0.35)'
                  : '0 2px 12px rgba(0,0,0,0.18)',
            },
      }));
      setMessage?.('Page border applied successfully');
    } else if (target === 'selected') {
      if (!hasSelected) {
        setMessage?.('कृपया घटक निवडा (Select element(s) to apply borders)');
        return;
      }
      updateElements(state.selected, (el) => {
        const styles = { ...el.styles };
        delete styles.border;
        styles.borderTop = borderEdges.top ? borderCss : 'none';
        styles.borderBottom = borderEdges.bottom ? borderCss : 'none';
        styles.borderLeft = borderEdges.left ? borderCss : 'none';
        styles.borderRight = borderEdges.right ? borderCss : 'none';
        if (borderEdges.top && borderEdges.bottom && borderEdges.left && borderEdges.right) {
          styles.border = borderCss;
        }
        if (preset === 'shadow') {
          styles.boxShadow = '3px 3px 0px rgba(0,0,0,0.35)';
        }
        return { styles };
      });
      setMessage?.(`Borders applied to ${state.selected.length} element(s)`);
    } else if (target === 'section') {
      if (!activeSection) {
        setMessage?.('No active section selected');
        return;
      }
      const sectionElementIds = def.elements
        .filter((e) => e.sectionId === activeSection.id)
        .map((e) => e.id);
      if (sectionElementIds.length > 0) {
        updateElements(sectionElementIds, (el) => {
          const styles = { ...el.styles };
          delete styles.border;
          styles.borderTop = borderEdges.top ? borderCss : 'none';
          styles.borderBottom = borderEdges.bottom ? borderCss : 'none';
          styles.borderLeft = borderEdges.left ? borderCss : 'none';
          styles.borderRight = borderEdges.right ? borderCss : 'none';
          if (borderEdges.top && borderEdges.bottom && borderEdges.left && borderEdges.right) {
            styles.border = borderCss;
          }
          if (preset === 'shadow') {
            styles.boxShadow = '3px 3px 0px rgba(0,0,0,0.35)';
          }
          return { styles };
        });
      }
      setMessage?.(`Section ${activeSection.name} borders updated`);
    }

    close();
  };

  const previewBorderCss = `${width} ${
    lineStyle === 'thick' || lineStyle === 'gradient' ? 'solid' : lineStyle
  } ${color}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        padding: '16px',
      }}
      onClick={close}
    >
      <div
        style={{
          width: '560px',
          maxWidth: '96vw',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="borders-dialog-title"
      >
        {/* Title Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#e8f1ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <div>
              <h2
                id="borders-dialog-title"
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#1e293b',
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                Borders and Shading
              </h2>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  color: '#64748b',
                  margin: '2px 0 0 0',
                }}
              >
                किनार आणि पार्श्वभूमी रंग शैली (Border &amp; Background Styling)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
              title="Help"
              onClick={() =>
                setMessage?.('Borders & Shading: Apply MS Word style borders & shading')
              }
            >
              <HelpCircle style={{ width: '13px', height: '13px' }} />
            </button>
            <button
              type="button"
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
              title="Close"
              onClick={close}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Segmented Track) */}
        <div
          style={{
            margin: '14px 20px 0 20px',
            padding: '4px',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              fontSize: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: 'none',
              backgroundColor: activeTab === 'borders' ? '#ffffff' : 'transparent',
              color: activeTab === 'borders' ? '#2563eb' : '#475569',
              fontWeight: activeTab === 'borders' ? 700 : 600,
              boxShadow: activeTab === 'borders' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
            onClick={() => setActiveTab('borders')}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                border: '1.8px solid currentColor',
                borderRadius: '2px',
              }}
            />
            <span>Borders (घटक किनार)</span>
          </button>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              fontSize: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: 'none',
              backgroundColor: activeTab === 'pageBorder' ? '#ffffff' : 'transparent',
              color: activeTab === 'pageBorder' ? '#2563eb' : '#475569',
              fontWeight: activeTab === 'pageBorder' ? 700 : 600,
              boxShadow: activeTab === 'pageBorder' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
            onClick={() => setActiveTab('pageBorder')}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>Page Border (पृष्ठ किनार)</span>
          </button>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              fontSize: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: 'none',
              backgroundColor: activeTab === 'shading' ? '#ffffff' : 'transparent',
              color: activeTab === 'shading' ? '#2563eb' : '#475569',
              fontWeight: activeTab === 'shading' ? 700 : 600,
              boxShadow: activeTab === 'shading' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
            onClick={() => setActiveTab('shading')}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 11l-8-8-8.5 8.5a2.12 2.12 0 0 0 0 3l5.5 5.5a2.12 2.12 0 0 0 3 0L19 11z" />
              <path d="M5 2l5 5" />
              <path d="M2 13h15" />
            </svg>
            <span>Shading (शेडिंग / रंग)</span>
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'shading' ? (
          /* Shading Tab Body */
          <div
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#64748b',
                    }}
                  >
                    Fill Color (रंग)
                  </label>
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        height: '28px',
                        width: '40px',
                        overflow: 'hidden',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                      }}
                    >
                      <input
                        type="color"
                        value={shadingFill}
                        onChange={(e) => setShadingFill(e.target.value)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                      />
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: shadingFill,
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                      onClick={() => setShadingFill('#ffffff')}
                    >
                      No Color
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#64748b',
                    }}
                  >
                    Patterns (नक्षी)
                  </label>
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>
                        Style:
                      </span>
                      <select
                        value={patternStyle}
                        onChange={(e) => setPatternStyle(e.target.value)}
                        style={{
                          marginTop: '4px',
                          height: '28px',
                          width: '100%',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          padding: '0 8px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: '#334155',
                          outline: 'none',
                        }}
                      >
                        <option value="clear">Clear (No Pattern)</option>
                        <option value="solid">Solid (100%)</option>
                        <option value="5%">5% Tint</option>
                        <option value="10%">10% Tint</option>
                        <option value="20%">20% Tint</option>
                        <option value="25%">25% Tint</option>
                        <option value="50%">50% Tint</option>
                        <option value="diag-cross">Diagonal Stripes</option>
                      </select>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>
                        Color:
                      </span>
                      <div
                        style={{
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            height: '26px',
                            width: '36px',
                            overflow: 'hidden',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                          }}
                        >
                          <input
                            type="color"
                            value={patternColor}
                            onChange={(e) => setPatternColor(e.target.value)}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              opacity: 0,
                              cursor: 'pointer',
                            }}
                          />
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: patternColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shading Preview & Apply */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                }}
              >
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#64748b',
                      marginBottom: '8px',
                    }}
                  >
                    Preview
                  </div>
                  <div
                    style={{
                      margin: '0 auto',
                      display: 'flex',
                      height: '96px',
                      width: '128px',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      padding: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      backgroundColor:
                        patternStyle === 'solid' ? patternColor : shadingFill,
                      backgroundImage:
                        patternStyle === 'diag-cross'
                          ? `repeating-linear-gradient(45deg, ${patternColor}, ${patternColor} 2px, transparent 2px, transparent 6px)`
                          : patternStyle.endsWith('%')
                            ? `radial-gradient(${patternColor} 1px, transparent 0)`
                            : undefined,
                      backgroundSize: patternStyle.endsWith('%') ? '4px 4px' : undefined,
                    }}
                  >
                    <div
                      style={{
                        height: '6px',
                        width: '100%',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(148, 163, 184, 0.4)',
                      }}
                    />
                    <div
                      style={{
                        height: '6px',
                        width: '80%',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(148, 163, 184, 0.4)',
                      }}
                    />
                    <div
                      style={{
                        height: '6px',
                        width: '60%',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(148, 163, 184, 0.4)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: '12px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569' }}>
                    Apply to:
                  </label>
                  <select
                    value={shadingApplyTo}
                    onChange={(e) =>
                      setShadingApplyTo(e.target.value as 'section' | 'selected' | 'page')
                    }
                    style={{
                      marginTop: '4px',
                      height: '28px',
                      width: '100%',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      padding: '0 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#334155',
                      outline: 'none',
                    }}
                  >
                    <option value="section">Active Section</option>
                    <option value="selected">Selected Element(s)</option>
                    <option value="page">Whole page (Page Color)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Borders & Page Border Tab Body (3 Columns identical to screenshot) */
          <div
            style={{
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: '84px 172px 1fr',
              gap: '16px',
              alignItems: 'stretch',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Column 1: SETTING: */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  marginBottom: '2px',
                }}
              >
                SETTING:
              </span>

              {/* None */}
              <button
                type="button"
                style={{
                  height: '52px',
                  width: '100%',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: preset === 'none' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: preset === 'none' ? '#f0f6ff' : '#ffffff',
                  color: preset === 'none' ? '#2563eb' : '#475569',
                  fontWeight: preset === 'none' ? 700 : 500,
                  boxShadow: preset === 'none' ? '0 1px 3px rgba(37,99,235,0.18)' : 'none',
                }}
                onClick={() => handlePresetChange('none')}
              >
                <div style={{ display: 'flex', height: '20px', width: '20px', alignItems: 'center', justifyContent: 'center' }}>
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeDasharray="3 3"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                  </svg>
                </div>
                <span>None</span>
              </button>

              {/* Box */}
              <button
                type="button"
                style={{
                  height: '52px',
                  width: '100%',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: preset === 'box' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: preset === 'box' ? '#f0f6ff' : '#ffffff',
                  color: preset === 'box' ? '#2563eb' : '#475569',
                  fontWeight: preset === 'box' ? 700 : 500,
                  boxShadow: preset === 'box' ? '0 1px 3px rgba(37,99,235,0.18)' : 'none',
                }}
                onClick={() => handlePresetChange('box')}
              >
                <div style={{ display: 'flex', height: '20px', width: '20px', alignItems: 'center', justifyContent: 'center' }}>
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                  </svg>
                </div>
                <span><u>B</u>ox</span>
              </button>

              {/* Shadow */}
              <button
                type="button"
                style={{
                  height: '52px',
                  width: '100%',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: preset === 'shadow' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: preset === 'shadow' ? '#f0f6ff' : '#ffffff',
                  color: preset === 'shadow' ? '#2563eb' : '#475569',
                  fontWeight: preset === 'shadow' ? 700 : 500,
                  boxShadow: preset === 'shadow' ? '0 1px 3px rgba(37,99,235,0.18)' : 'none',
                }}
                onClick={() => handlePresetChange('shadow')}
              >
                <div style={{ display: 'flex', height: '20px', width: '20px', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <rect x="7" y="7" width="13" height="13" rx="2" fill="#cbd5e1" />
                    <rect
                      x="4"
                      y="4"
                      width="13"
                      height="13"
                      rx="2"
                      fill="#ffffff"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <span><u>S</u>hadow</span>
              </button>

              {/* 3-D */}
              <button
                type="button"
                style={{
                  height: '52px',
                  width: '100%',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: preset === '3d' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: preset === '3d' ? '#f0f6ff' : '#ffffff',
                  color: preset === '3d' ? '#2563eb' : '#475569',
                  fontWeight: preset === '3d' ? 700 : 500,
                  boxShadow: preset === '3d' ? '0 1px 3px rgba(37,99,235,0.18)' : 'none',
                }}
                onClick={() => handlePresetChange('3d')}
              >
                <div style={{ display: 'flex', height: '20px', width: '20px', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <rect
                      x="6"
                      y="6"
                      width="12"
                      height="12"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeOpacity="0.45"
                    />
                  </svg>
                </div>
                <span><u>3</u>-D</span>
              </button>

              {/* Custom */}
              <button
                type="button"
                style={{
                  height: '52px',
                  width: '100%',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: preset === 'custom' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: preset === 'custom' ? '#f0f6ff' : '#ffffff',
                  color: preset === 'custom' ? '#2563eb' : '#475569',
                  fontWeight: preset === 'custom' ? 700 : 500,
                  boxShadow: preset === 'custom' ? '0 1px 3px rgba(37,99,235,0.18)' : 'none',
                }}
                onClick={() => setPreset('custom')}
              >
                <div style={{ display: 'flex', height: '20px', width: '20px', alignItems: 'center', justifyContent: 'center' }}>
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="4" y1="4" x2="20" y2="4" />
                    <line x1="4" y1="20" x2="20" y2="20" />
                    <line x1="4" y1="12" x2="10" y2="12" strokeDasharray="1.5 1.5" />
                  </svg>
                </div>
                <span><u>C</u>ustom</span>
              </button>
            </div>

            {/* Column 2: STYLE, COLOR, WIDTH, MARGIN */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* STYLE: */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  marginBottom: '4px',
                }}
              >
                STYLE:
              </span>
              <div
                style={{
                  height: '96px',
                  overflowY: 'auto',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {/* Solid */}
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    height: '24px',
                    width: '100%',
                    alignItems: 'center',
                    padding: '0 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: lineStyle === 'solid' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                    backgroundColor: lineStyle === 'solid' ? '#eff6ff' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                  onClick={() => setLineStyle('solid')}
                >
                  <div style={{ width: '100%', borderTop: '2px solid #1e293b' }} />
                </button>
                {/* Dotted */}
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    height: '24px',
                    width: '100%',
                    alignItems: 'center',
                    padding: '0 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: lineStyle === 'dotted' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                    backgroundColor: lineStyle === 'dotted' ? '#eff6ff' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                  onClick={() => setLineStyle('dotted')}
                >
                  <div style={{ width: '100%', borderTop: '2px dotted #1e293b' }} />
                </button>
                {/* Dashed */}
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    height: '24px',
                    width: '100%',
                    alignItems: 'center',
                    padding: '0 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: lineStyle === 'dashed' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                    backgroundColor: lineStyle === 'dashed' ? '#eff6ff' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                  onClick={() => setLineStyle('dashed')}
                >
                  <div style={{ width: '100%', borderTop: '2px dashed #1e293b' }} />
                </button>
                {/* Double */}
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    height: '24px',
                    width: '100%',
                    alignItems: 'center',
                    padding: '0 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: lineStyle === 'double' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                    backgroundColor: lineStyle === 'double' ? '#eff6ff' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                  onClick={() => setLineStyle('double')}
                >
                  <div style={{ width: '100%', borderTop: '4px double #1e293b' }} />
                </button>
                {/* Thick */}
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    height: '24px',
                    width: '100%',
                    alignItems: 'center',
                    padding: '0 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: lineStyle === 'thick' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                    backgroundColor: lineStyle === 'thick' ? '#eff6ff' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                  onClick={() => setLineStyle('thick')}
                >
                  <div style={{ width: '100%', borderTop: '3.5px solid #1e3a8a' }} />
                </button>
                {/* Gradient / Accent */}
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    height: '24px',
                    width: '100%',
                    alignItems: 'center',
                    padding: '0 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: lineStyle === 'gradient' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                    backgroundColor: lineStyle === 'gradient' ? '#eff6ff' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                  onClick={() => setLineStyle('gradient')}
                >
                  <div style={{ width: '100%', borderTop: '3px solid #2563eb' }} />
                </button>
              </div>

              {/* COLOR: */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  marginTop: '10px',
                  marginBottom: '4px',
                }}
              >
                COLOR:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    position: 'relative',
                    height: '28px',
                    width: '32px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: color,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                </div>
                <select
                  value={COLOR_OPTIONS.some((o) => o.value === color) ? color : '#000000'}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    height: '28px',
                    flex: 1,
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    padding: '0 8px',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* WIDTH: */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  marginTop: '10px',
                  marginBottom: '4px',
                }}
              >
                WIDTH:
              </span>
              <select
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                style={{
                  height: '28px',
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: '0 8px',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {WIDTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Margin (कडांपासून अंतर): */}
              <div
                style={{
                  marginTop: '10px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  padding: '7px 8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#334155' }}>
                    Margin (कडांपासून अंतर):
                  </span>
                  <button
                    type="button"
                    onClick={syncMarginsEqual}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '5px',
                      border: '1px solid #bfdbfe',
                      backgroundColor: '#eff6ff',
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#2563eb',
                      cursor: 'pointer',
                    }}
                    title="Set all margins equal to Top"
                  >
                    <RotateCw style={{ width: '10px', height: '10px' }} />
                    <span>Equal</span>
                  </button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px 8px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    <span>Top:</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={margins.top}
                      onChange={(e) =>
                        setMargins((m) => ({ ...m, top: Number(e.target.value) || 0 }))
                      }
                      style={{
                        height: '20px',
                        width: '32px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    <span>Bottom:</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={margins.bottom}
                      onChange={(e) =>
                        setMargins((m) => ({ ...m, bottom: Number(e.target.value) || 0 }))
                      }
                      style={{
                        height: '20px',
                        width: '32px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    <span>Left:</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={margins.left}
                      onChange={(e) =>
                        setMargins((m) => ({ ...m, left: Number(e.target.value) || 0 }))
                      }
                      style={{
                        height: '20px',
                        width: '32px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    <span>Right:</span>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={margins.right}
                      onChange={(e) =>
                        setMargins((m) => ({ ...m, right: Number(e.target.value) || 0 }))
                      }
                      style={{
                        height: '20px',
                        width: '32px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#1e293b',
                        outline: 'none',
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Column 3: PREVIEW (Right) */}
            <div
              style={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fafcff',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '290px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#64748b',
                    }}
                  >
                    PREVIEW
                  </span>
                  <span
                    style={{
                      borderRadius: '9999px',
                      border: '1px solid #bfdbfe',
                      backgroundColor: '#e0edff',
                      padding: '2px 8px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: '#2563eb',
                    }}
                  >
                    Interactive
                  </span>
                </div>
                <p
                  style={{
                    marginTop: '6px',
                    textAlign: 'center',
                    fontSize: '9.5px',
                    lineHeight: 1.3,
                    color: '#64748b',
                    maxWidth: '180px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  Click on diagram below or use buttons to apply borders
                </p>

                {/* Central Diagram with 4 blue toggle buttons */}
                <div
                  style={{
                    position: 'relative',
                    margin: '14px auto',
                    width: '140px',
                    height: '130px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Top Button */}
                  <button
                    type="button"
                    onClick={() => toggleEdge('top')}
                    title="Toggle Top Border"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '28px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: borderEdges.top ? '#2563eb' : '#ffffff',
                      color: borderEdges.top ? '#ffffff' : '#94a3b8',
                      border: borderEdges.top ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                      boxShadow: borderEdges.top ? '0 2px 4px rgba(37,99,235,0.25)' : 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="12" height="3" rx="1" fill="currentColor" />
                      <rect
                        x="3"
                        y="7"
                        width="10"
                        height="7"
                        rx="1"
                        stroke="currentColor"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                      />
                    </svg>
                  </button>

                  {/* Bottom Button */}
                  <button
                    type="button"
                    onClick={() => toggleEdge('bottom')}
                    title="Toggle Bottom Border"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '28px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: borderEdges.bottom ? '#2563eb' : '#ffffff',
                      color: borderEdges.bottom ? '#ffffff' : '#94a3b8',
                      border: borderEdges.bottom ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                      boxShadow: borderEdges.bottom ? '0 2px 4px rgba(37,99,235,0.25)' : 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="11" width="12" height="3" rx="1" fill="currentColor" />
                      <rect
                        x="3"
                        y="2"
                        width="10"
                        height="7"
                        rx="1"
                        stroke="currentColor"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                      />
                    </svg>
                  </button>

                  {/* Left Button */}
                  <button
                    type="button"
                    onClick={() => toggleEdge('left')}
                    title="Toggle Left Border"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '22px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: borderEdges.left ? '#2563eb' : '#ffffff',
                      color: borderEdges.left ? '#ffffff' : '#94a3b8',
                      border: borderEdges.left ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                      boxShadow: borderEdges.left ? '0 2px 4px rgba(37,99,235,0.25)' : 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="3" height="12" rx="1" fill="currentColor" />
                      <rect
                        x="7"
                        y="3"
                        width="7"
                        height="10"
                        rx="1"
                        stroke="currentColor"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                      />
                    </svg>
                  </button>

                  {/* Right Button */}
                  <button
                    type="button"
                    onClick={() => toggleEdge('right')}
                    title="Toggle Right Border"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '22px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: borderEdges.right ? '#2563eb' : '#ffffff',
                      color: borderEdges.right ? '#ffffff' : '#94a3b8',
                      border: borderEdges.right ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                      boxShadow: borderEdges.right ? '0 2px 4px rgba(37,99,235,0.25)' : 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="11" y="2" width="3" height="12" rx="1" fill="currentColor" />
                      <rect
                        x="2"
                        y="3"
                        width="7"
                        height="10"
                        rx="1"
                        stroke="currentColor"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                      />
                    </svg>
                  </button>

                  {/* Center Box */}
                  <div
                    onClick={() => toggleEdge('box')}
                    title="Click inside to toggle all borders"
                    style={{
                      width: '76px',
                      height: '76px',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      borderTop: borderEdges.top ? previewBorderCss : '1px dashed #cbd5e1',
                      borderBottom: borderEdges.bottom ? previewBorderCss : '1px dashed #cbd5e1',
                      borderLeft: borderEdges.left ? previewBorderCss : '1px dashed #cbd5e1',
                      borderRight: borderEdges.right ? previewBorderCss : '1px dashed #cbd5e1',
                      boxShadow: preset === 'shadow' ? '3px 3px 0px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.06)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ height: '3px', width: '55%', borderRadius: '2px', backgroundColor: '#94a3b8', opacity: 0.7 }} />
                    <div style={{ height: '3px', width: '80%', borderRadius: '2px', backgroundColor: '#94a3b8', opacity: 0.7 }} />
                    <div style={{ height: '3px', width: '70%', borderRadius: '2px', backgroundColor: '#94a3b8', opacity: 0.7 }} />
                    <div style={{ height: '3px', width: '45%', borderRadius: '2px', backgroundColor: '#94a3b8', opacity: 0.7 }} />
                  </div>
                </div>
              </div>

              {/* APPLY TO: */}
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748b',
                    marginBottom: '4px',
                  }}
                >
                  <u>A</u>PPLY TO:
                </span>
                <select
                  value={applyTo}
                  onChange={(e) => setApplyTo(e.target.value as 'section' | 'selected' | 'page')}
                  style={{
                    height: '32px',
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    padding: '0 8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <option value="section">Active Section</option>
                  <option value="selected">Selected Elements</option>
                  <option value="page">Whole Page</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '12px 20px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
          }}
        >
          <button
            type="button"
            style={{
              height: '32px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onClick={close}
          >
            Cancel
          </button>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '32px',
              padding: '0 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
            }}
            onClick={handleApply}
          >
            <Check style={{ width: '14px', height: '14px', strokeWidth: 3 }} />
            <span>OK</span>
          </button>
        </div>
      </div>
    </div>
  );
}
