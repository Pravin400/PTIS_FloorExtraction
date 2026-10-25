/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
export type PropertySelectionMode = '' | 'zone' | 'ward' | 'range' | 'property';

export function useSmartLayoutState(reportId: number | null | undefined, handleReset: () => void) {
  const [selectionMode, setSelectionMode] = useState<PropertySelectionMode>('');
  const [financialYear, setFinancialYear] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [wardId, setWardId] = useState<string[]>([]);
  const [fromProperty, setFromProperty] = useState('');
  const [toProperty, setToProperty] = useState('');
  const [propertyNo, setPropertyNo] = useState('');
  const [partitionNo, setPartitionNo] = useState('');
  const [ownerIdList, setOwnerIdList] = useState('');
  const [isPropertyDrawerOpen, setIsPropertyDrawerOpen] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [propSearchQuery, setPropSearchQuery] = useState('');
  const [hasViewedProperties, setHasViewedProperties] = useState(false);
  const [amountOperator, setAmountOperator] = useState<string>('greater_than');
  const [amountValue, setAmountValue] = useState<string>('');
  const [propertyDescription, setPropertyDescription] = useState<string[]>([]);
  const [assessmentStatus, setAssessmentStatus] = useState<string[]>([]);

  useEffect(() => {
    setHasViewedProperties(false);
  }, [selectionMode, fromProperty, toProperty]);

  // Clear values that belong to a different selection mode. Without this,
  // switching from an individual property to ward/range mode can submit a
  // stale partition/property filter and unexpectedly produce no rows.
  useEffect(() => {
    if (selectionMode !== 'property') {
      setPropertyNo('');
      setPartitionNo('');
      setOwnerIdList('');
      setSelectedProperties([]);
    }
    if (selectionMode !== 'range') {
      setFromProperty('');
      setToProperty('');
    }
  }, [selectionMode]);

  const prevReportId = useRef<number | null>(null);
  useEffect(() => {
    if (reportId !== prevReportId.current) {
      prevReportId.current = reportId ?? null;
      setFinancialYear('');
      setZoneId('');
      setWardId([]);
      setFromProperty('');
      setToProperty('');
      setPropertyNo('');
      setPartitionNo('');
      setOwnerIdList('');
      setSelectionMode('');
      setAmountOperator('greater_than');
      setAmountValue('');
      setPropertyDescription([]);
      setAssessmentStatus([]);
    }
  }, [reportId]);

  const handleResetAll = () => {
    setFinancialYear('');
    setZoneId('');
    setWardId([]);
    setFromProperty('');
    setToProperty('');
    setPropertyNo('');
    setPartitionNo('');
    setOwnerIdList('');
    setSelectedProperties([]);
    setPropSearchQuery('');
    setIsPropertyDrawerOpen(false);
    setSelectionMode('');
    setAmountOperator('greater_than');
    setAmountValue('');
    setPropertyDescription([]);
    setAssessmentStatus([]);
    handleReset();
  };

  return {
    state: {
      selectionMode, financialYear, zoneId, wardId, fromProperty, toProperty, propertyNo, partitionNo, ownerIdList,
      isPropertyDrawerOpen, selectedProperties, propSearchQuery, hasViewedProperties, amountOperator, amountValue,
      propertyDescription, assessmentStatus
    },
    actions: {
      setSelectionMode, setFinancialYear, setZoneId, setWardId, setFromProperty, setToProperty, setPropertyNo, setPartitionNo,
      setOwnerIdList, setIsPropertyDrawerOpen, setSelectedProperties, setPropSearchQuery, setHasViewedProperties,
      setAmountOperator, setAmountValue, setPropertyDescription, setAssessmentStatus, handleResetAll
    }
  };
  
}

