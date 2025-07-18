// Client-side report tracking using localStorage
// Similar to the cooldown system but for tracking reported notes

const REPORTS_STORAGE_KEY = 'unsent_canvas_reports';

interface ReportData {
  noteId: string;
  reportedAt: number;
}

function getReportedNotes(): ReportData[] {
  try {
    const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!stored) return [];
    
    const reports: ReportData[] = JSON.parse(stored);
    
    // Clean up old reports (older than 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const validReports = reports.filter(report => report.reportedAt > thirtyDaysAgo);
    
    if (validReports.length !== reports.length) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(validReports));
    }
    
    return validReports;
  } catch (error) {
    console.error('Error reading reported notes from localStorage:', error);
    return [];
  }
}

function setReportedNotes(reports: ReportData[]): void {
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error('Error saving reported notes to localStorage:', error);
  }
}

export function hasUserReportedNote(noteId: string): boolean {
  const reports = getReportedNotes();
  return reports.some(report => report.noteId === noteId);
}

export function recordUserReport(noteId: string): boolean {
  try {
    // Check if already reported
    if (hasUserReportedNote(noteId)) {
      return false;
    }
    
    const reports = getReportedNotes();
    reports.push({
      noteId,
      reportedAt: Date.now()
    });
    
    setReportedNotes(reports);
    return true;
  } catch (error) {
    console.error('Error recording user report:', error);
    return false;
  }
}

export function getUserReportCount(): number {
  return getReportedNotes().length;
}

export function clearUserReports(): void {
  try {
    localStorage.removeItem(REPORTS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user reports:', error);
  }
}
