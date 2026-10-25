import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportViewer } from '@/components/modules/property-tax/reports/ReportViewer';
import type { ReportDefinition } from '@/lib/utils/reports/engine';

describe('ReportViewer React Component', () => {
  const mockReportDef: ReportDefinition = {
    reportId: 'Notice119',
    reportCode: 'Notice119',
    reportName: 'कराकारणी नोटीस ११९',
    paperSize: 'A4',
    orientation: 'portrait',
    pageWidth: 794,
    pageHeight: 1123,
    sections: [
      {
        id: 'sec_header',
        name: 'Header',
        type: 'header',
        height: 60,
      },
      {
        id: 'sec_detail',
        name: 'Detail',
        type: 'detail',
        height: 100,
      },
    ],
    elements: [
      {
        id: 'el_title',
        sectionId: 'sec_header',
        type: 'text',
        x: 10,
        y: 10,
        width: 400,
        height: 30,
        text: 'कराकारणी नोटीस',
      },
      {
        id: 'el_owner',
        sectionId: 'sec_detail',
        type: 'field',
        fieldName: 'ownerName',
        x: 10,
        y: 10,
        width: 300,
        height: 25,
      },
    ],
  };

  it('renders report title and metadata badge', () => {
    render(
      <ReportViewer
        definition={mockReportDef}
        dataRows={[{ ownerName: 'गोपाळ गणेश आगरकर' }]}
        title="कराकारणी नोटीस ११९ पूर्वावलोकन"
      />
    );

    expect(screen.getByText('कराकारणी नोटीस ११९ पूर्वावलोकन')).toBeDefined();
    expect(screen.getByText(/A4/)).toBeDefined();
    expect(screen.getByText(/उभे/)).toBeDefined();
  });

  it('adjusts zoom level on ZoomIn, ZoomOut and Reset buttons', () => {
    render(
      <ReportViewer
        definition={mockReportDef}
        dataRows={[{ ownerName: 'गोपाळ गणेश आगरकर' }]}
      />
    );

    const zoomResetBtn = screen.getByTitle('रीसेट करा');
    expect(zoomResetBtn.textContent).toBe('100%');

    const zoomInBtn = screen.getByLabelText('Zoom In');
    fireEvent.click(zoomInBtn);
    expect(zoomResetBtn.textContent).toBe('115%');

    const zoomOutBtn = screen.getByLabelText('Zoom Out');
    fireEvent.click(zoomOutBtn);
    expect(zoomResetBtn.textContent).toBe('100%');
  });

  it('toggles Marathi Devanagari numerals when toggle button is clicked', () => {
    render(
      <ReportViewer
        definition={mockReportDef}
        dataRows={[{ ownerName: 'गोपाळ गणेश आगरकर' }]}
        locale="mr"
      />
    );

    const numeralToggleBtn = screen.getByTitle('मराठी अंक आणि इंग्रजी अंकांमधील बदल');
    expect(numeralToggleBtn.textContent).toContain('०-९ देवनागरी');

    fireEvent.click(numeralToggleBtn);
    expect(numeralToggleBtn.textContent).toContain('0-9 English');
  });

  it('renders malicious database markup as text in the preview', () => {
    const payload = '<span onmouseover="alert(1)"><img src=x onerror="alert(2)">Owner</span>';
    const { container } = render(
      <ReportViewer definition={mockReportDef} dataRows={[{ ownerName: payload }]} locale="en" />
    );
    expect(container.querySelector('#el_el_owner')?.textContent).toBe(payload);
    expect(container.querySelector('[onmouseover], [onerror]')).toBeNull();
  });

  it('triggers print popup when print button is clicked', () => {
    const originalOpen = window.open;
    const writeMock = vi.fn();
    const closeMock = vi.fn();
    window.open = vi.fn().mockReturnValue({
      document: {
        write: writeMock,
        close: closeMock,
      },
    });

    const unsafeTitle = '</title><script>alert(1)</script>';

    render(
      <ReportViewer
        definition={mockReportDef}
        title={unsafeTitle}
        dataRows={[{ ownerName: 'गोपाळ गणेश आगरकर' }]}
      />
    );

    const printBtn = screen.getByText('प्रिंट (Print)');
    fireEvent.click(printBtn);

    expect(window.open).toHaveBeenCalled();
    expect(writeMock).toHaveBeenCalled();
    expect(writeMock.mock.calls[0][0]).toContain('&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(writeMock.mock.calls[0][0]).not.toContain(unsafeTitle);
    expect(closeMock).toHaveBeenCalled();

    window.open = originalOpen;
  });

  it('downloads HTML file when HTML download button is clicked', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <ReportViewer
        definition={mockReportDef}
        dataRows={[{ ownerName: 'गोपाळ गणेश आगरकर' }]}
      />
    );

    const downloadBtn = screen.getByText('HTML डाऊनलोड');
    fireEvent.click(downloadBtn);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});
