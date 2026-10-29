import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataTable, Column } from '../components/common/DataTable';

interface SampleItem {
  id: number;
  name: string;
  category: string;
}

const sampleData: SampleItem[] = [
  { id: 1, name: 'Lead Alpha', category: 'Residential' },
  { id: 2, name: 'Lead Beta', category: 'Commercial' },
  { id: 3, name: 'Lead Gamma', category: 'Residential' },
];

const sampleColumns: Column<SampleItem>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'category', header: 'Category' },
];

describe('DataTable Component', () => {
  it('renders table headers and row items correctly', () => {
    render(<DataTable columns={sampleColumns} data={sampleData} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Lead Alpha')).toBeInTheDocument();
    expect(screen.getByText('Lead Beta')).toBeInTheDocument();
    expect(screen.getByText('Lead Gamma')).toBeInTheDocument();
  });

  it('renders empty state when data array is empty', () => {
    render(
      <DataTable
        columns={sampleColumns}
        data={[]}
        emptyTitle="No leads in database"
        emptyDescription="Please create a lead."
      />
    );

    expect(screen.getByText('No leads in database')).toBeInTheDocument();
    expect(screen.getByText('Please create a lead.')).toBeInTheDocument();
  });

  it('supports row selection and indeterminate select-all state', () => {
    const handleSelectionChange = vi.fn();

    const { rerender } = render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        selectable
        selectedIds={[1]}
        onSelectionChange={handleSelectionChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // Index 0 is the header checkbox, Index 1 is first row, etc.
    expect(checkboxes.length).toBe(4);

    const headerCheckbox = checkboxes[0] as HTMLInputElement;
    expect(headerCheckbox.indeterminate).toBe(true);

    // Click select all
    fireEvent.click(headerCheckbox);
    expect(handleSelectionChange).toHaveBeenCalledWith([1, 2, 3]);

    // Re-render with all selected
    rerender(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        selectable
        selectedIds={[1, 2, 3]}
        onSelectionChange={handleSelectionChange}
      />
    );

    expect(headerCheckbox.checked).toBe(true);
    expect(headerCheckbox.indeterminate).toBe(false);
  });

  it('triggers onRowClick when a row is clicked', () => {
    const handleRowClick = vi.fn();

    render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        onRowClick={handleRowClick}
      />
    );

    fireEvent.click(screen.getByText('Lead Beta'));
    expect(handleRowClick).toHaveBeenCalledWith(sampleData[1]);
  });
});
