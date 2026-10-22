"use client";

import React from 'react';
import { SopDepartmentView } from '@/components/sop/SopDepartmentView';

export default function SalesSopPage() {
  return (
    <SopDepartmentView
      department="SALES"
      title="Sales Team SOP & Pipeline Management"
      subtitle="Standard operating procedures for lead qualification, follow-ups, quotations, opportunity conversion, HR staff coordination, and post-conversion client care."
      categories={[
        'Lead Qualification',
        'Follow-up Management',
        'Sales Pipeline',
        'Staff Coordination',
        'Post-Conversion',
        'Daily Operations',
      ]}
    />
  );
}
