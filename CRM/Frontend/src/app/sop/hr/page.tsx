"use client";

import React from 'react';
import { SopDepartmentView } from '@/components/sop/SopDepartmentView';

export default function HrSopPage() {
  return (
    <SopDepartmentView
      department="HR"
      title="Human Resources SOP & Staff Management"
      subtitle="Standard operating procedures for caregiver onboarding, background checks, qualifications, deployment readiness, and shift coordination."
      categories={[
        'Employee Onboarding',
        'Staff Verification',
        'Staff Deployment',
        'Daily Operations',
        'Compliance & Training',
      ]}
    />
  );
}
