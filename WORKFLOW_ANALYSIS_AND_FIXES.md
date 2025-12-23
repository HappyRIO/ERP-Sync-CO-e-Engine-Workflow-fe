# Workflow Analysis and Fixes

## Overview
This document outlines all workflows in the platform, identifies issues, and documents fixes.

---

## 1. BOOKING WORKFLOW

### Lifecycle Statuses
```
CREATED → SCHEDULED → COLLECTED → SANITISED → GRADED → COMPLETED
```

### Status Transitions & Who Can Change

| From Status | To Status | Who Can Change | Where/How |
|------------|-----------|----------------|-----------|
| `created` | `scheduled` | **Admin** | `/admin/assign` - Assign driver to booking |
| `created` | `cancelled` | **Admin** | Booking Queue - Cancel booking |
| `scheduled` | `collected` | **Driver** (via Job) | When driver marks job as `collected`, booking auto-updates |
| `scheduled` | `cancelled` | **Admin** | Booking Queue - Cancel booking |
| `collected` | `sanitised` | **Admin** | `/admin/sanitisation/:id` - After all assets sanitised |
| `sanitised` | `graded` | **Admin** | `/admin/grading/:id` - After all assets graded |
| `graded` | `completed` | **Admin** | `/admin/approval/:id` - Final approval |

### Current Issues
1. ✅ **FIXED**: When admin assigns driver, booking status changes to `scheduled`
2. ✅ **FIXED**: When driver marks job as `collected`, booking status auto-updates to `collected`
3. ✅ **FIXED**: When admin marks all assets as sanitised, booking status auto-updates to `sanitised`
4. ✅ **FIXED**: When admin marks all assets as graded, booking status auto-updates to `graded`

---

## 2. JOB WORKFLOW

### Lifecycle Statuses
```
booked → routed → en-route → arrived → collected → warehouse → sanitised → graded → finalised
```

### Status Transitions & Who Can Change

| From Status | To Status | Who Can Change | Where/How |
|------------|-----------|----------------|-----------|
| `booked` | `routed` | **Admin** (automatic) | When admin assigns driver to booking, job is created with `routed` status |
| `routed` | `en-route` | **Driver** | `/jobs/:id` - Driver accepts job and starts route |
| `en-route` | `arrived` | **Driver** | `/jobs/:id` - Driver marks as arrived at site |
| `arrived` | `collected` | **Driver** | `/jobs/:id` - Driver marks as collected (with evidence) |
| `collected` | `warehouse` | **Driver** | `/jobs/:id` - Driver marks as delivered to warehouse |
| `warehouse` | `sanitised` | **Admin** (automatic) | When all assets sanitised, job status updates |
| `sanitised` | `graded` | **Admin** (automatic) | When all assets graded, job status updates |
| `graded` | `finalised` | **Admin** (automatic) | When booking completed, job status updates |

### Current Issues
1. ✅ **FIXED**: Job service now allows `booked → routed → en-route` or `booked → en-route` (driver can accept directly)
2. ✅ **FIXED**: Jobs are automatically created when admin assigns driver to booking (with status `routed`)
3. ✅ **FIXED**: Job status syncs with booking status (when booking becomes `sanitised`/`graded`/`completed`, job updates accordingly)
4. ✅ **FIXED**: When driver marks job as `collected`, booking status auto-updates to `collected`

---

## 3. COMMISSION WORKFLOW

### Lifecycle Statuses
```
pending → approved → paid
```

### Status Transitions & Who Can Change

| From Status | To Status | Who Can Change | Where/How |
|------------|-----------|----------------|-----------|
| - | `pending` | **System** (automatic) | Created automatically when booking is `completed` |
| `pending` | `approved` | **Admin** | `/commission` - Admin approves commission |
| `approved` | `paid` | **Admin** | `/commission` - Admin marks as paid |

### Current Issues
1. ✅ **FIXED**: Commission is automatically created when booking is `completed` (if reseller exists)
2. ✅ **FIXED**: Admin can update commission status via dropdown menu

---

## 4. INVOICE WORKFLOW

### Lifecycle Statuses
```
draft → sent → paid
```

### Status Transitions & Who Can Change

| From Status | To Status | Who Can Change | Where/How |
|------------|-----------|----------------|-----------|
| - | `draft` | **Admin** (automatic) | Created when booking is `completed` |
| `draft` | `sent` | **Admin** | Admin sends invoice to client |
| `sent` | `paid` | **Admin** (automatic) | When payment is processed |
| `sent` | `overdue` | **System** (automatic) | When due date passes without payment |
| Any | `cancelled` | **Admin** | Admin cancels invoice |

### Current Issues
1. ✅ **FIXED**: Invoice is automatically created when booking is `completed` (with status `draft`)
2. ⏳ **PENDING**: No UI for admin to manage invoice status (send, mark as paid, cancel) - Low priority
3. ✅ **FIXED**: Invoice display works for clients

---

## FIXES REQUIRED

### Priority 1: Critical Workflow Issues

1. **Fix Job Status Transitions**
   - Remove `routed` status from driver workflow (driver goes directly from `booked` to `en-route`)
   - OR: Auto-set job to `routed` when admin assigns driver, then driver can move to `en-route`
   - **Decision**: Auto-set to `routed` when driver assigned, then driver moves to `en-route`

2. **Create Job When Driver Assigned**
   - When admin assigns driver to booking, automatically create a job with status `routed`
   - Link job to booking via `booking.jobId` and `job.bookingId`

3. **Sync Booking and Job Status**
   - When driver marks job as `collected`, update booking status to `collected`
   - When all assets sanitised, update both booking and job to `sanitised`
   - When all assets graded, update both booking and job to `graded`
   - When booking `completed`, update job to `finalised`

### Priority 2: Status Update Automation

4. **Auto-Update Booking Status from Sanitisation**
   - When all assets have sanitisation records, auto-update booking to `sanitised`

5. **Auto-Update Booking Status from Grading**
   - When all assets have grading records, auto-update booking to `graded`

6. **Auto-Create Commission**
   - When booking status changes to `completed`, create commission record (if reseller exists)

7. **Auto-Create Invoice**
   - When booking status changes to `completed`, create invoice record

### Priority 3: UI Improvements

8. **Invoice Management UI**
   - Add admin interface to manage invoice status (send, mark as paid, cancel)

---

## IMPLEMENTATION PLAN

1. ✅ Fix job status transitions in `jobs.service.ts` and `DriverJobView.tsx`
2. ✅ Create job when driver assigned in `booking.service.ts`
3. ✅ Sync booking status when job status changes (in `jobs.service.ts`)
4. ✅ Auto-update booking status from sanitisation/grading screens (in `sanitisation.service.ts` and `grading.service.ts`)
5. ✅ Auto-create commission when booking completed (in `booking.service.ts`)
6. ✅ Auto-create invoice when booking completed (in `booking.service.ts`)
7. ✅ Sync job status when booking status changes (in `booking.service.ts`)
8. ⏳ Add invoice management UI (low priority - can be added later if needed)

## IMPLEMENTATION SUMMARY

All critical workflow fixes have been implemented:

### ✅ Completed Fixes:
1. **Job Creation**: Jobs are automatically created with status `routed` when admin assigns driver to booking
2. **Status Synchronization**: 
   - Job status `collected` → Booking status `collected`
   - All assets sanitised → Booking status `sanitised` + Job status `sanitised`
   - All assets graded → Booking status `graded` + Job status `graded`
   - Booking `completed` → Job status `finalised`
3. **Auto-Updates**: 
   - Sanitisation service checks if all assets are sanitised and auto-updates booking/job status
   - Grading service checks if all assets are graded and auto-updates booking/job status
4. **Commission Creation**: Automatically created when booking is completed (if reseller exists)
5. **Invoice Creation**: Automatically created when booking is completed (with status `draft`)

### Files Modified:
- `frontend/src/services/booking.service.ts` - Job creation, commission/invoice creation, status sync
- `frontend/src/services/jobs.service.ts` - Status transitions, booking status sync
- `frontend/src/services/sanitisation.service.ts` - Auto-update booking/job status
- `frontend/src/services/grading.service.ts` - Auto-update booking/job status
- `frontend/src/types/jobs.ts` - Added `bookingId` field to Job interface
- `frontend/src/pages/app/DriverJobView.tsx` - Updated status transitions

