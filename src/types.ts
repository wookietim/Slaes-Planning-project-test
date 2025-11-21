// Types for the sales planning form
export interface SalesDataRow {
  id: string;
  planningPeriod: string;
  hfb: string;
  turnover: string;
  profit: string;
  qty: string;
  gm: string;
}

export interface SalesData {
  country: string;
  year: string;
  rows: SalesDataRow[];
}

export type WorkflowStatus = 'draft' | 'review' | 'approved' | 'published' | 'denied';

export interface SalesPlanEntry extends SalesData {
  id: string;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
}