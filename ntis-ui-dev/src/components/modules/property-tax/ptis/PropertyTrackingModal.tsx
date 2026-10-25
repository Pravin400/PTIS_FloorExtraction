/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable i18next/no-literal-string */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Route, AlertCircle, Map, MapPinned, ShieldCheck, FileText, ThumbsUp, BellRing, Scale, FileStack, Receipt, Check, User } from 'lucide-react';
import { Button, Drawer } from '@/components/common';
import { useTranslations } from 'next-intl';
import type { PropertyWorkflowStage } from '@/types/propertyWorkflowStage.types';
import { getPropertyWorkflowDetailsAction } from '@/app/[locale]/property-tax/ptis/workflowStageActions';

interface PropertyTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: number | string;
  propertyNo?: string;
  ownerName?: string;
  workflowStages: PropertyWorkflowStage[];
}

export function PropertyTrackingModal({
  isOpen,
  onClose,
  propertyId,
  propertyNo,
  ownerName,
  workflowStages,
}: PropertyTrackingModalProps) {
  const t = useTranslations('ptis');
  const [mounted, setMounted] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTrackingData = useCallback(async () => {
    if (!propertyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getPropertyWorkflowDetailsAction(propertyId);
      if (res.success && res.data) {
        // Map exactly as returned in res.data
        const trackingList = res.data.map((historyRecord) => {
          const stage = workflowStages.find((s) => s.id === historyRecord.workflowStageId);

          let statusStr = "Completed";
          if (historyRecord.currentStatus === true) {
            statusStr = "Completed";
          } else if (historyRecord.currentStatus === false) {
            statusStr = "Completed";
          } else if (historyRecord.currentStatus === null || historyRecord.currentStatus === undefined) {
            statusStr = "Completed"; // Default fallback for historical stages
          }

          const submittedByUser = historyRecord.createdByName || (historyRecord.createdBy != null ? `User #${historyRecord.createdBy}` : null);
          const stageName = stage ? stage.stageName : `Stage #${historyRecord.workflowStageId}`;

          return {
            stage: stageName,
            Stage: stageName,
            status: statusStr,
            Status: statusStr,
            date: historyRecord.createdDate || null,
            Date: historyRecord.createdDate || null,
            submittedBy: submittedByUser,
            SubmittedBy: submittedByUser,
          };
        });

        setTrackingData({ tracking: trackingList });
      } else {
        const errorMsg = res.error || '';
        if (errorMsg.includes('404') || errorMsg.toLowerCase().includes('not found')) {
          setTrackingData({ tracking: [] });
        } else {
          setError(res.error || 'Failed to fetch tracking data');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading tracking data');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, workflowStages]);

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchTrackingData();
    }
  }, [isOpen, propertyId, fetchTrackingData]);

  const routeMapData = useMemo(() => {
    if (!trackingData || !trackingData.tracking) return null;

    const tracking = trackingData.tracking;
    const currentStageIndex = tracking.findIndex((s: any) => (s.status || s.Status) === "In Progress");
    const activeIndex = currentStageIndex === -1 ? tracking.findIndex((s: any) => (s.status || s.Status) === "Pending") : currentStageIndex;

    const totalStages = tracking.length;
    const segments: string[] = [];
    for (let idx = 0; idx < totalStages - 1; idx++) {
      const y1 = 24 + idx * 130;
      const y2 = 24 + (idx + 1) * 130;
      const y_mid = y1 + 75;
      if (idx % 2 === 0) {
        // Left to Right U-shape
        segments.push(`M 40,${y1} C 40,${y_mid - 20} 60,${y_mid} 80,${y_mid} L 340,${y_mid} C 360,${y_mid} 380,${y_mid + 20} 380,${y2}`);
      } else {
        // Right to Left U-shape
        segments.push(`M 380,${y1} C 380,${y_mid - 20} 360,${y_mid} 340,${y_mid} L 80,${y_mid} C 60,${y_mid} 40,${y_mid + 20} 40,${y2}`);
      }
    }
    const containerHeight = (totalStages - 1) * 130 + 48;

    return {
      activeIndex,
      segments,
      containerHeight
    };
  }, [trackingData]);

  if (!isOpen || !mounted || typeof window === 'undefined') return null;

  return createPortal(
    <Drawer
      open={isOpen}
      onClose={onClose}
      width="md"
      title={
        <div className="flex items-center justify-between w-[320px] sm:w-[400px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none">{t('propertyTracking')}</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1.5 leading-none">
                {propertyNo || "N/A"} <span className="text-slate-300 mx-1">•</span> {ownerName || t('unknownOwner')}
              </p>
            </div>
          </div>
          {trackingData && trackingData.tracking && (
            <div className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 shadow-sm whitespace-nowrap">
              {trackingData.tracking.filter((s: any) => (s.status || s.Status) === "Completed").length} / {trackingData.tracking.length} {t('completed')}
            </div>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full bg-slate-50/50">
        {/* Progress Bar Header inside Drawer body */}
        {trackingData && trackingData.tracking && (
          <div className="px-6 py-4 border-b border-slate-100 bg-white">
            {/* <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('progress')}</span>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {t('current')}: {trackingData.tracking.find((s: any) => (s.status || s.Status) === "In Progress")?.stage || trackingData.tracking.find((s: any) => (s.status || s.Status) === "In Progress")?.Stage || t('allCompleted')}
              </span>
            </div> */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.round((trackingData.tracking.filter((s: any) => (s.status || s.Status) === "Completed").length / trackingData.tracking.length) * 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Drawer Body Scroll Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col gap-8 py-4 px-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-6 items-start animate-pulse relative">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 z-10" />
                  {i !== 4 && <div className="absolute left-5 top-10 bottom-[-2rem] w-0.5 bg-slate-200" />}
                  <div className="flex-1 space-y-3 mt-1 bg-white p-4 rounded-2xl border border-slate-100">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">{t('failedToLoadTracking')}</h4>
              <p className="text-slate-500 mb-6 max-w-sm">{error}</p>
              <Button
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md"
                onClick={fetchTrackingData}
              >
                {t('tryAgain')}
              </Button>
            </div>
          ) : trackingData && trackingData.tracking && trackingData.tracking.length > 0 ? (
            <div className="flex flex-col items-center">
              {routeMapData && (() => {
                const { activeIndex, segments, containerHeight } = routeMapData;

                return (
                  <div className="w-full flex justify-center pt-1 pb-6">
                    <div className="relative w-full max-w-[420px] shrink-0" style={{ height: containerHeight }}>

                      {/* SVG Bezier Curves (Serpentine path) */}
                      <svg className="absolute left-0 top-0 w-[420px] z-0" viewBox={`0 0 420 ${containerHeight}`} style={{ height: containerHeight }} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="activeGradFlow" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                        <style>
                          {`
                            @keyframes energyTrail {
                              0% { stroke-dashoffset: 100; }
                              100% { stroke-dashoffset: -20; }
                            }
                            .path-energy {
                              stroke-dasharray: 24 100;
                              animation: energyTrail 1.8s linear infinite;
                            }
                            @keyframes drawLine {
                              from { stroke-dashoffset: 1; }
                              to { stroke-dashoffset: 0; }
                            }
                            .path-draw {
                              stroke-dasharray: 1;
                              stroke-dashoffset: 1;
                              animation: drawLine 0.6s ease-out forwards;
                            }
                            @keyframes rotateSnake {
                              0% { transform: rotate(0deg); }
                              100% { transform: rotate(360deg); }
                            }
                            .snake-border {
                              position: absolute;
                              inset: -2px;
                              border-radius: 50%;
                              background: conic-gradient(from 0deg, transparent 40%, #3b82f6 100%);
                              animation: rotateSnake 1.5s linear infinite;
                            }
                            @keyframes nodePop {
                              0% { transform: scale(0); opacity: 0; }
                              70% { transform: scale(1.15); opacity: 1; }
                              100% { transform: scale(1); opacity: 1; }
                            }
                            .node-pop {
                              opacity: 0;
                              animation: nodePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                            }
                            @keyframes fadeSlideRight {
                              from { opacity: 0; transform: translateX(-15px); }
                              to { opacity: 1; transform: translateX(0); }
                            }
                            .fade-slide {
                              opacity: 0;
                              animation: fadeSlideRight 0.4s ease-out forwards;
                            }
                          `}
                        </style>

                        {/* Base dashed path */}
                        {segments.map((d, i) => (
                          <path key={`base-${i}`} d={d} fill="none" stroke="#cbd5e1" strokeWidth="5" strokeDasharray="8 6" />
                        ))}

                        {/* Active/Completed paths */}
                        {segments.map((d, i) => {
                          const isAllCompleted = trackingData.tracking.every((s: any) => (s.status || s.Status) === "Completed");
                          const isCompletedSeg = isAllCompleted ? true : (i < activeIndex);
                          const isInProgressSeg = !isAllCompleted && (i === activeIndex);

                          if (isCompletedSeg) return <path key={`active-${i}`} d={d} fill="none" stroke="#10b981" strokeWidth="5" pathLength="1" className="path-draw" style={{ animationDelay: `${i * 0.4 + 0.15}s` }} />;
                          if (isInProgressSeg) {
                            return (
                              <g key={`active-${i}`} className="active-path-show" style={{ animationDelay: `${i * 0.4 + 0.15}s` }}>
                                <path d={d} fill="none" stroke="#e0e7ff" strokeWidth="5" />
                                <path d={d} fill="none" stroke="url(#activeGradFlow)" strokeWidth="5" pathLength="100" className="path-energy" />
                              </g>
                            );
                          }
                          return null;
                        })}
                      </svg>

                      {/* Nodes and Stage Details */}
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        {trackingData.tracking.map((stageItem: any, i: number) => {
                          const status = stageItem.status || stageItem.Status;
                          const date = stageItem.date || stageItem.Date;
                          const submittedBy = stageItem.submittedBy || stageItem.SubmittedBy;

                          const isCompleted = status === "Completed";
                          const isInProgress = status === "In Progress";

                          const yPos = 24 + i * 130;
                          const xPos = i % 2 === 0 ? 40 : 380;
                          const isTextOnLeft = i % 2 === 1;

                          const stageName = (stageItem.stage || stageItem.Stage || "").toLowerCase();
                          let IconComp = Map;
                          if (stageName.includes('geosequencing')) IconComp = Map;
                          else if (stageName.includes('survey') || stageName.includes('internalsurvey')) IconComp = MapPinned;
                          else if (stageName.includes('dataentry') || stageName.includes('data')) IconComp = ShieldCheck;
                          else if (stageName.includes('assessment') || stageName.includes('assess')) IconComp = FileText;
                          else if (stageName.includes('ulb') || stageName.includes('approve') || stageName.includes('approvalbyulb')) IconComp = ThumbsUp;
                          else if (stageName.includes('notice') || stageName.includes('noticedistribution')) IconComp = BellRing;
                          else if (stageName.includes('hearing') || stageName.includes('appeal') || stageName.includes('hearingandappeal')) IconComp = Scale;
                          else if (stageName.includes('billdistribution') || stageName.includes('distribution')) IconComp = FileStack;
                          else if (stageName.includes('generation') || stageName.includes('billgeneration')) IconComp = Receipt;

                          const isFirst = i === 0;
                          const isLast = i === trackingData.tracking.length - 1;

                          return (
                            <div key={i} className="absolute w-full pointer-events-auto flex items-center pr-4 md:pr-6" style={{ top: yPos, transform: 'translateY(-50%)', height: '130px' }}>

                              {/* Numbered Circle along serpentine path */}
                              <div className="absolute z-20 flex justify-center items-center w-12 h-12" style={{ left: xPos, transform: 'translateX(-50%)' }}>
                                <div className="node-pop relative w-12 h-12 flex items-center justify-center" style={{ animationDelay: `${i * 0.2}s` }}>
                                  {isFirst && (
                                    <span className="absolute -top-4 bg-slate-900 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm z-30">

                                    </span>
                                  )}
                                  {isLast && (
                                    <span className="absolute -bottom-4 bg-slate-900 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm z-30">
                                    </span>
                                  )}
                                  {isInProgress && <div className="snake-border shadow-lg shadow-blue-500/25" />}
                                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center bg-white ring-4 ring-white shadow-md transition-transform hover:scale-110 z-10
                                    ${isCompleted ? 'border border-emerald-500 text-emerald-600 shadow-emerald-500/10' :
                                      isInProgress ? 'border border-blue-500 text-blue-600 shadow-blue-500/20 animate-pulse' :
                                        'border border-slate-300 text-slate-400'}`}>
                                    <IconComp className="w-5 h-5" />
                                  </div>
                                </div>

                                {/* Start / End / Side Indicators next to Numbered Circle */}
                                {!isTextOnLeft ? (
                                  <div className={`absolute right-[44px] flex items-center gap-1.5 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-wider
                                    ${isCompleted ? 'text-emerald-500' : isInProgress ? 'text-blue-500' : 'text-slate-400'}`}>
                                    <span>•</span>
                                    <span>➔</span>
                                  </div>
                                ) : (
                                  <div className={`absolute left-[44px] flex items-center gap-1.5 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-wider
                                    ${isCompleted ? 'text-emerald-500' : isInProgress ? 'text-blue-500' : 'text-slate-400'}`}>
                                    <span>←</span>
                                    <span>•</span>
                                  </div>
                                )}
                              </div>

                              {/* Tooltip Card Container */}
                              <div
                                className="absolute transition-all duration-200"
                                style={
                                  isTextOnLeft
                                    ? { left: '20px', width: '280px' }
                                    : { left: '120px', width: '280px' }
                                }
                              >
                                <div className="relative bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3 fade-slide" style={{ animationDelay: `${i * 0.2 + 0.1}s` }}>

                                  {/* Speech bubble pointing pointer arrow */}
                                  {isTextOnLeft ? (
                                    <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r border-t border-slate-100 rotate-45 z-10" />
                                  ) : (
                                    <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-slate-100 rotate-45 z-10" />
                                  )}

                                  {/* Circular icon wrapper inside Card */}
                                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 border font-bold text-[14px]
                                    ${isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                      isInProgress ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                        'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    {i + 1}
                                    {isCompleted && (
                                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white">
                                        <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                                      </div>
                                    )}
                                    {isInProgress && (
                                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                                        <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                                      </div>
                                    )}
                                  </div>

                                  {/* Details content inside Card (unified left alignment) */}
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className={`font-bold text-[13px] leading-tight truncate ${isCompleted ? 'text-slate-800' : isInProgress ? 'text-blue-900' : 'text-slate-500'}`}>
                                        {stageItem.stage || stageItem.Stage}
                                      </span>
                                      <span className={`text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0
                                        ${isCompleted ? 'bg-emerald-100 text-emerald-700' : isInProgress ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {status}
                                      </span>
                                    </div>

                                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                      {date ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                      {' • '}
                                      {date ? new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                                    </div>

                                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                      <User size={12} className="shrink-0 text-slate-400" />
                                      <span className="truncate" title={submittedBy || ''}>
                                        {stageName.includes('ulb') ? 'Approved' : 'Submitted'} By: {submittedBy || '-'}
                                      </span>
                                    </div>
                                  </div>

                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Route className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">{t('noTrackingData')}</h4>
              <p className="text-slate-500">{t('trackingNotAvailable')}</p>
            </div>
          )}
        </div>
      </div>
    </Drawer>,
    document.body
  );
}
