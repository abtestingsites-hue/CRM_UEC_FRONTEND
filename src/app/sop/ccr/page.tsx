"use client";

import React from 'react';
import { SopDepartmentView } from '@/components/sop/SopDepartmentView';

export default function CcrSopPage() {
  return (
    <SopDepartmentView
      department="CCR"
      title="Customer Care Representative (CCR) SOP"
      subtitle="Standard operating procedures for customer enquiry intake, omnichannel communications, complaint investigations, callbacks, and daily resolution handovers."
      categories={[
        'Enquiry Handling',
        'Customer Communication',
        'Complaint Management',
        'Daily Operations',
        'Shift Handover',
      ]}
    />
  );
}
