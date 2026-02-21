import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import './ArtworksTable.css';

import type {
  DataTablePageEvent,
  DataTableSelectionMultipleChangeEvent,
} from 'primereact/datatable';
import type { Artwork, ApiResponse } from '../types';

export default function ArtworksTable() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [rows] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);

  // persistent selection (GLOBAL STATE) without prefetching page data
  const [customSelectedLimit, setCustomSelectedLimit] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deselectedIds, setDeselectedIds] = useState<Set<number>>(new Set());

  // overlay
  const overlayRef = useRef<OverlayPanel>(null);
  const [selectCount, setSelectCount] = useState('');

  const fetchArtworks = async (pageNumber: number) => {
    try {
      setLoading(true);

      const res = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${pageNumber}&limit=${rows}`
      );

      const json: ApiResponse = await res.json();

      const normalizedArtworks = json.data.map((art) => ({
        ...art,
        inscriptions:
          art.inscriptions && art.inscriptions.trim().length > 0
            ? art.inscriptions
            : 'N/A',
      }));

      setArtworks(normalizedArtworks);
      setTotalRecords(json.pagination.total);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(page);
  }, [page]);

  const getAbsolutePosition = (index: number) => (page - 1) * rows + index + 1;
  const effectiveLimit = Math.min(customSelectedLimit, totalRecords);

  const isSelected = (id: number, absolutePosition: number) => {
    if (absolutePosition <= effectiveLimit) {
      return !deselectedIds.has(id);
    }

    return selectedIds.has(id);
  };

  const selectedRows = artworks.filter((art, index) =>
    isSelected(art.id, getAbsolutePosition(index))
  );

  const onSelectionChange = (
    e: DataTableSelectionMultipleChangeEvent<Artwork[]>
  ) => {
    const selectedOnPage = new Set(e.value.map((row) => row.id));
    const nextSelectedIds = new Set(selectedIds);
    const nextDeselectedIds = new Set(deselectedIds);

    artworks.forEach((row, index) => {
      const absolutePosition = getAbsolutePosition(index);
      const checkedNow = selectedOnPage.has(row.id);
      const inCustomRange = absolutePosition <= effectiveLimit;

      if (inCustomRange) {
        if (checkedNow) {
          nextDeselectedIds.delete(row.id);
        } else {
          nextDeselectedIds.add(row.id);
        }
        nextSelectedIds.delete(row.id);
      } else {
        if (checkedNow) {
          nextSelectedIds.add(row.id);
        } else {
          nextSelectedIds.delete(row.id);
        }
        nextDeselectedIds.delete(row.id);
      }
    });

    setSelectedIds(nextSelectedIds);
    setDeselectedIds(nextDeselectedIds);
  };

  const onPageChange = (e: DataTablePageEvent) => {
    setPage((e.page ?? 0) + 1);
  };

  const handleCustomSelection = () => {
    const count = parseInt(selectCount, 10);

    if (Number.isNaN(count) || count <= 0) {
      alert('Enter valid number');
      return;
    }

    setCustomSelectedLimit(count);
    setSelectedIds(new Set());
    setDeselectedIds(new Set());

    setSelectCount('');
    overlayRef.current?.hide();
  };

  const toDisplayText = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    const text = String(value).trim();
    return text.length > 0 ? text : 'N/A';
  };

  const firstRecord = totalRecords === 0 ? 0 : (page - 1) * rows + 1;
  const lastRecord = Math.min(page * rows, totalRecords);
  const selectedCount = effectiveLimit - deselectedIds.size + selectedIds.size;

  const selectionHeader = (
    <div className="selection-header" role="group" aria-label="Selection">
      <button
        type="button"
        className="selection-menu-trigger"
        onClick={(e) => overlayRef.current?.toggle(e)}
        aria-label="Open custom selection"
      >
        <i className="pi pi-angle-down" />
      </button>
    </div>
  );

  const titleBodyTemplate = (rowData: Artwork) => (
    <span className="title-cell">{toDisplayText(rowData.title)}</span>
  );

  const textBodyTemplate = (value: string | number | null | undefined) => (
    <span className="ellipsis-cell">{toDisplayText(value)}</span>
  );

  const numericBodyTemplate = (value: number | null | undefined) => (
    <span className="numeric-cell">{toDisplayText(value)}</span>
  );

  return (
    <div className="artworks-wrapper">
      <div className="selected-report">
        Selected: <strong>{Math.max(0, selectedCount)}</strong> rows
      </div>

      <div className="artworks-shell">
        <OverlayPanel ref={overlayRef} className="selection-overlay">
          <div className="selection-overlay-content">
            <InputText
              value={selectCount}
              onChange={(e) => setSelectCount(e.target.value)}
              placeholder="Enter number"
            />
            <Button label="Apply" size="small" onClick={handleCustomSelection} />
          </div>
        </OverlayPanel>

        <DataTable
          className="artworks-table"
          value={artworks}
          loading={loading}
          paginator
          lazy
          rows={rows}
          totalRecords={totalRecords}
          pageLinkSize={5}
          paginatorTemplate="PrevPageLink PageLinks NextPageLink"
          paginatorLeft={
            <span className="page-report">
              Showing <strong>{firstRecord}</strong> to <strong>{lastRecord}</strong>{' '}
              of <strong>{totalRecords}</strong> entries
            </span>
          }
          first={(page - 1) * rows}
          onPage={onPageChange}
          dataKey="id"
          selectionMode="multiple"
          selection={selectedRows}
          onSelectionChange={onSelectionChange}
          tableStyle={{ minWidth: '100%', tableLayout: 'fixed' }}
        >
          <Column
            selectionMode="multiple"
            header={selectionHeader}
            headerStyle={{ width: '4.5rem' }}
            bodyStyle={{ width: '4.5rem' }}
          />
          <Column
            field="title"
            header="Title"
            body={titleBodyTemplate}
            headerStyle={{ width: '33%' }}
          />
          <Column
            field="place_of_origin"
            header={<span className="header-stack">Place of<br />Origin</span>}
            body={(rowData) => textBodyTemplate(rowData.place_of_origin)}
            headerStyle={{ width: '10%' }}
          />
          <Column
            field="artist_display"
            header="Artist"
            body={(rowData) => textBodyTemplate(rowData.artist_display)}
            headerStyle={{ width: '23%' }}
          />
          <Column
            field="inscriptions"
            header="Inscriptions"
            body={(rowData) => textBodyTemplate(rowData.inscriptions)}
            headerStyle={{ width: '22%' }}
          />
          <Column
            field="date_start"
            header={<span className="header-stack">Start<br />Date</span>}
            body={(rowData) => numericBodyTemplate(rowData.date_start)}
            headerStyle={{ width: '7%' }}
          />
          <Column
            field="date_end"
            header={<span className="header-stack">End<br />Date</span>}
            body={(rowData) => numericBodyTemplate(rowData.date_end)}
            headerStyle={{ width: '6%' }}
          />
        </DataTable>
      </div>
    </div>
  );
}
