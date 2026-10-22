"use client";

import React from 'react';
import { SopDepartmentView } from '@/components/sop/SopDepartmentView';

export default function DataEntrySopPage() {
  return (
    <SopDepartmentView
      department="DATA_ENTRY"
      title="Data Entry & Quality Assurance SOP"
      subtitle="Standard operating procedures for CRM record intake, customer profile completion, duplicate detection, staff profile maintenance, and data quality audits."
      categories={[
        'Work Queue',
        'Lead & Customer Records',
        'Staff Data Maintenance',
        'Data Quality & Validation',
        'Daily Operations',
      ]}
    />
  );
}
